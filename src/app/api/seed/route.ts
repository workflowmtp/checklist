import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }

    const prisma = new PrismaClient();
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      const adminRole = await prisma.role.findUnique({ where: { code: 'ADMINISTRATEUR' } });
      if (adminRole) {
        await prisma.user.create({
          data: {
            email: 'admin@multiprint.cm',
            nom: 'Administrateur Système',
            motDePasse: await bcrypt.hash('admin', 10),
            roleId: adminRole.id,
          },
        });
      }
    }

    await prisma.$disconnect();
    return NextResponse.json({ success: true, message: 'Use `npm run db:seed` for full seeding' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
