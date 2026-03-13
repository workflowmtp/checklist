import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, nom, password } = body;

    // Validation
    if (!email || !nom || !password) {
      return NextResponse.json(
        { error: 'Les champs email, nom et mot de passe sont obligatoires' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Veuillez entrer une adresse email valide' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 4 caractères' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cette adresse email est déjà utilisée' },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        nom,
        motDePasse: hashedPassword,
        role: 'CONDUCTEUR',
        actif: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Compte créé avec succès',
        user: { id: user.id, email: user.email, nom: user.nom, role: user.role },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erreur inscription:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  }
}
