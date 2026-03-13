import { PrismaClient } from '@prisma/client';

const POOL_PARAMS = 'connection_limit=5&pool_timeout=30&connect_timeout=10';

function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    let base = process.env.DATABASE_URL;
    const separator = base.includes('?') ? '&' : '?';
    // Add pool params if missing
    if (!base.includes('connection_limit')) {
      base = base + separator + POOL_PARAMS;
    }
    // Force SSL in production (required by most cloud DB providers)
    if (process.env.NODE_ENV === 'production' && !base.includes('sslmode')) {
      base += '&sslmode=require';
    }
    return base;
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const name = process.env.DB_NAME || 'printseq';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || '';
  const ssl = process.env.DB_SSL === 'true' ? '&sslmode=require' : '';

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}?${POOL_PARAMS}${ssl}`;
}

const url = buildDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
