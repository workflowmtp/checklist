import { Role } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Cache en mémoire pour éviter des requêtes DB à chaque vérification
let permissionsCache: Map<Role, string[]> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

// Force fresh load on server restart (after seed changes)
permissionsCache = null;
cacheTimestamp = 0;

async function loadPermissions(): Promise<Map<Role, string[]>> {
  const now = Date.now();
  if (permissionsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return permissionsCache;
  }

  try {
    const rolePerms = await prisma.rolePermission.findMany({
      include: { permission: true },
    });

    const map = new Map<Role, string[]>();
    for (const rp of rolePerms) {
      const existing = map.get(rp.role) || [];
      existing.push(rp.permission.code);
      map.set(rp.role, existing);
    }

    permissionsCache = map;
    cacheTimestamp = now;
    return map;
  } catch (error) {
    console.error('Failed to load permissions from DB:', error);
    return new Map<Role, string[]>();
  }
}

export function invalidatePermissionsCache() {
  permissionsCache = null;
  cacheTimestamp = 0;
}

export async function hasPermission(role: Role, action: string): Promise<boolean> {
  const map = await loadPermissions();
  const perms = map.get(role);
  if (!perms) return false;
  return perms.includes(action);
}

export async function getPermissionsForRole(role: Role): Promise<string[]> {
  const map = await loadPermissions();
  return map.get(role) || [];
}

export async function getAllPermissions() {
  return prisma.permission.findMany({ orderBy: [{ groupe: 'asc' }, { code: 'asc' }] });
}

export async function getRolePermissions() {
  return prisma.rolePermission.findMany({
    include: { permission: true },
    orderBy: { permission: { groupe: 'asc' } },
  });
}

export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    [Role.ADMINISTRATEUR]: 'Administrateur',
    [Role.RESPONSABLE_POLE]: 'Responsable de Pôle',
    [Role.CHEF_ATELIER]: "Chef d'Atelier",
    [Role.CONDUCTEUR]: 'Conducteur',
    [Role.MAINTENANCE]: 'Maintenance',
    [Role.CONTROLE_QUALITE]: 'Contrôle Qualité',
  };
  return labels[role] || role;
}

export function getAllRoles(): Role[] {
  return Object.values(Role);
}

export async function requirePermission(action: string): Promise<{ user: any; allowed: true }> {
  const session = await getServerSession(authOptions);
  const user = (session as any)?.user;
  if (!user) {
    throw new Error('Authentification requise');
  }
  const perms: string[] = user.permissions || [];
  if (perms.includes(action)) {
    return { user, allowed: true };
  }
  throw new Error(`Permission refusée : ${action}`);
}

export async function requireAnyPermission(actions: string[]): Promise<{ user: any; allowed: true }> {
  const session = await getServerSession(authOptions);
  const user = (session as any)?.user;
  if (!user) {
    throw new Error('Authentification requise');
  }
  const perms: string[] = user.permissions || [];
  if (actions.some((a) => perms.includes(a))) {
    return { user, allowed: true };
  }
  throw new Error(`Permission refusée`);
}
