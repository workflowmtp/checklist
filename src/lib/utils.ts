import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { StatutDossier, StatutTache } from '@prisma/client';

// ============================================================
// CSS utility
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// Number formatting (FCFA style with spaces)
// ============================================================
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '0';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// ============================================================
// Duration formatting from milliseconds
// ============================================================
export function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '0min';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

// ============================================================
// Chrono format HH:MM:SS
// ============================================================
export function formatChrono(ms: number): string {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ============================================================
// Statut labels & classes
// ============================================================
export function getStatutDossierLabel(statut: StatutDossier): string {
  const map: Record<StatutDossier, string> = {
    [StatutDossier.EN_ATTENTE]: 'En attente',
    [StatutDossier.EN_COURS]: 'En cours',
    [StatutDossier.EN_PAUSE]: 'En pause',
    [StatutDossier.CLOTURE]: 'Clôturé',
  };
  return map[statut] || statut;
}

export function getStatutDossierVariant(statut: StatutDossier): 'active' | 'paused' | 'closed' | 'stopped' {
  const map: Record<StatutDossier, 'active' | 'paused' | 'closed' | 'stopped'> = {
    [StatutDossier.EN_ATTENTE]: 'paused',
    [StatutDossier.EN_COURS]: 'active',
    [StatutDossier.EN_PAUSE]: 'paused',
    [StatutDossier.CLOTURE]: 'closed',
  };
  return map[statut] || 'paused';
}

export function getStatutTacheLabel(statut: StatutTache): string {
  const map: Record<StatutTache, string> = {
    [StatutTache.EN_ATTENTE]: 'En attente',
    [StatutTache.EN_COURS]: 'En cours',
    [StatutTache.EN_PAUSE]: 'En pause',
    [StatutTache.CONFORME]: 'Conforme',
    [StatutTache.NON_CONFORME]: 'Non conforme',
  };
  return map[statut] || statut;
}

// ============================================================
// Initials from name
// ============================================================
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

// ============================================================
// Next dossier number generator
// ============================================================
export function generateDossierNumero(existingNumbers: string[]): string {
  const year = new Date().getFullYear();
  let max = 0;
  for (const num of existingNumbers) {
    const parts = num.split('-');
    if (parts.length >= 3 && parseInt(parts[1]) === year) {
      const n = parseInt(parts[2]);
      if (n > max) max = n;
    }
  }
  const next = (max + 1).toString().padStart(3, '0');
  return `DF-${year}-${next}`;
}
