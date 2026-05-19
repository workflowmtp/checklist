import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const isProduction = process.env.NODE_ENV === 'production';

const routePermissions: Record<string, string[]> = {
  '/admin': ['create_pole','read_pole','update_pole','delete_pole','create_atelier','read_atelier','update_atelier','delete_atelier','create_machine','read_machine','update_machine','delete_machine','create_operator','read_operator','update_operator','delete_operator','create_cause','read_cause','update_cause','delete_cause','create_checkpoint','read_checkpoint','update_checkpoint','delete_checkpoint','create_task_config','read_task_config','update_task_config','delete_task_config','create_user','read_user','update_user','delete_user','create_role','read_role','update_role','delete_role','read_log'],
  '/ai': ['use_ai'],
  '/exports': ['read_export','create_export'],
  '/historique': ['read_history'],
  '/dashboard': ['read_kpi'],
  '/configuration-taches': ['create_task_config','read_task_config','update_task_config','delete_task_config'],
  '/erp': ['create_erp_config','read_erp_config','update_erp_config','delete_erp_config'],
};

function hasAnyPerm(token: any, perms: string[]): boolean {
  const userPerms: string[] = token?.permissions || [];
  return perms.some((p) => userPerms.includes(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/seed') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: isProduction,
    cookieName: isProduction
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token',
  });

  // Redirect to login if no token
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check route permissions
  for (const [prefix, perms] of Object.entries(routePermissions)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      if (!hasAnyPerm(token, perms)) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
