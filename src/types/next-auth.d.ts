import { Role } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      permissions: string[];
      poleId: string | null;
      atelierId: string | null;
      pole: {
        id: string;
        nom: string;
        icone: string;
        couleur: string;
      } | null;
      atelier: {
        id: string;
        nom: string;
      } | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: Role;
    permissions: string[];
    poleId: string | null;
    atelierId: string | null;
    pole: any;
    atelier: any;
  }
}
