import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Cache en mémoire pour éviter des requêtes DB à chaque vérification
let permissionsCache: Map<string, string[]> | null = null;
let rolesCache: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

// Force fresh load on server restart (after seed changes)
permissionsCache = null;
rolesCache = null;
cacheTimestamp = 0;

async function loadPermissions(): Promise<Map<string, string[]>> {
  const now = Date.now();
  if (permissionsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return permissionsCache;
  }

  try {
    const rolePerms = await prisma.rolePermission.findMany({
      include: { permission: true, role: true },
    });

    const map = new Map<string, string[]>();
    for (const rp of rolePerms) {
      const key = rp.roleId;
      const existing = map.get(key) || [];
      existing.push(rp.permission.code);
      map.set(key, existing);
    }

    permissionsCache = map;
    cacheTimestamp = now;
    return map;
  } catch (error) {
    console.error('Failed to load permissions from DB:', error);
    return new Map<string, string[]>();
  }
}

export function invalidatePermissionsCache() {
  permissionsCache = null;
  rolesCache = null;
  cacheTimestamp = 0;
}

export async function hasPermission(roleId: string, action: string): Promise<boolean> {
  const map = await loadPermissions();
  const perms = map.get(roleId);
  if (!perms) return false;
  return perms.includes(action);
}

export async function getPermissionsForRole(roleId: string): Promise<string[]> {
  if (!roleId) return [];
  const map = await loadPermissions();
  return map.get(roleId) || [];
}

export async function getAllPermissions() {
  return prisma.permission.findMany({ orderBy: [{ groupe: 'asc' }, { code: 'asc' }] });
}

export async function getRolePermissions() {
  return prisma.rolePermission.findMany({
    include: { permission: true, role: true },
    orderBy: { permission: { groupe: 'asc' } },
  });
}

export async function getAllRoles() {
  const now = Date.now();
  if (rolesCache && (now - cacheTimestamp) < CACHE_TTL) {
    return rolesCache;
  }
  const roles = await prisma.role.findMany({ orderBy: { nom: 'asc' } });
  rolesCache = roles;
  return roles;
}

export async function getRoleById(id: string) {
  return prisma.role.findUnique({ where: { id } });
}

export async function getRoleByCode(code: string) {
  return prisma.role.findUnique({ where: { code } });
}

export function getRoleLabel(role: any): string {
  if (!role) return '—';
  if (typeof role === 'string') return role;
  return role.nom || role.code || '—';
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
