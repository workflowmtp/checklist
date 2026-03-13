import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }

    // Run the seed by importing the logic
    // For the API route, we just create the minimal admin user if none exist
    const prisma = new PrismaClient();
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      await prisma.user.create({
        data: {
          email: 'admin@multiprint.cm',
          nom: 'Administrateur Système',
          motDePasse: await bcrypt.hash('admin', 10),
          role: Role.ADMINISTRATEUR,
        },
      });
    }

    await prisma.$disconnect();
    return NextResponse.json({ success: true, message: 'Use `npm run db:seed` for full seeding' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
