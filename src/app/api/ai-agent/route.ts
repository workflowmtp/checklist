import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';
const N8N_USER = process.env.N8N_USER || '';
const N8N_PASSWORD = process.env.N8N_PASSWORD || '';

export async function POST(req: NextRequest) {
  // Vérifier authentification + permission use_ai
  let user: any;
  try {
    const result = await requirePermission('use_ai');
    user = result.user;
  } catch {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
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
        sessionId: sessionId || user.id || 'default',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
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
