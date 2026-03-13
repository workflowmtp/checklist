import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';
const N8N_USER = process.env.N8N_USER || '';
const N8N_PASSWORD = process.env.N8N_PASSWORD || '';

export async function POST(req: NextRequest) {
  // Vérifier que l'utilisateur est authentifié
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 });
    }

    // Construire le header Basic Auth
    const basicAuth = Buffer.from(`${N8N_USER}:${N8N_PASSWORD}`).toString('base64');

    // Appeler le webhook n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        message,
        sessionId: sessionId || session.user.id || 'default',
        user: {
          id: (session.user as any).id,
          name: session.user.name,
          email: session.user.email,
          role: (session.user as any).role,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Erreur du service IA', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      reply: data.output || data.response || data.text || data.message || JSON.stringify(data),
    });
  } catch (error: any) {
    console.error('AI Agent error:', error);
    return NextResponse.json(
      { error: 'Erreur interne', details: error.message },
      { status: 500 }
    );
  }
}
