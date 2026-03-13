import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const checks: Record<string, string> = {
    status: 'ok',
    time: new Date().toISOString(),
    env_db: process.env.DATABASE_URL ? 'set' : 'MISSING',
    env_secret: process.env.NEXTAUTH_SECRET ? 'set' : 'MISSING',
    env_n8n: process.env.N8N_WEBHOOK_URL ? 'set' : 'MISSING',
  };

  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    checks.database = 'connected';
  } catch (err: any) {
    checks.database = `error: ${err.message}`;
    checks.status = 'degraded';
  }

  return NextResponse.json(checks);
}
