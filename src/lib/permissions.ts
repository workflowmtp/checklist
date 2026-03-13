import { Role } from '@prisma/client';
import prisma from '@/lib/prisma';

// Cache en mémoire pour éviter des requêtes DB à chaque vérification
let permissionsCache: Map<Role, string[]> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

async function loadPermissions(): Promise<Map<Role, string[]>> {
  const now = Date.now();
  if (permissionsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return permissionsCache;
  }

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
