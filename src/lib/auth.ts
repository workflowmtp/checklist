import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getPermissionsForRole } from '@/lib/permissions';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Veuillez remplir tous les champs');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            pole: { select: { id: true, nom: true, icone: true, couleur: true } },
            atelier: { select: { id: true, nom: true } },
          },
        });

        if (!user || !user.actif) {
          throw new Error('Email ou mot de passe incorrect');
        }

        const isValid = await bcrypt.compare(credentials.password, user.motDePasse);
        if (!isValid) {
          throw new Error('Email ou mot de passe incorrect');
        }

        // Log action
        await prisma.logAction.create({
          data: {
            utilisateurId: user.id,
            typeAction: 'login',
            entite: 'users',
            entiteId: user.id,
            detailsJson: JSON.stringify({ email: user.email }),
          },
        });

        const permissions = await getPermissionsForRole(user.role);

        return {
          id: user.id,
          name: user.nom,
          email: user.email,
          role: user.role,
          permissions,
          poleId: user.poleId,
          atelierId: user.atelierId,
          pole: user.pole,
          atelier: user.atelier,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 heures
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = (user as any).email;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
        token.poleId = (user as any).poleId;
        token.atelierId = (user as any).atelierId;
        token.pole = (user as any).pole;
        token.atelier = (user as any).atelier;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).email = token.email;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
        (session.user as any).poleId = token.poleId;
        (session.user as any).atelierId = token.atelierId;
        (session.user as any).pole = token.pole;
        (session.user as any).atelier = token.atelier;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
