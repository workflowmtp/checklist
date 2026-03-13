import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - /login
     * - /api/auth (NextAuth routes)
     * - /api/seed (Database seeding)
     * - /_next (Next.js internals)
     * - /favicon.ico, /public assets
     */
    '/((?!login|register|api/auth|api/seed|_next|favicon.ico|.*\\.).*)',
  ],
};
