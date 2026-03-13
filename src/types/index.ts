import { Role } from '@prisma/client';

// ============================================================
// Session & Auth
// ============================================================
export interface SessionUser {
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
}

// ============================================================
// Permissions
// ============================================================
// Les permissions sont désormais stockées en BD (table permissions)
// et associées aux rôles via role_permissions

// ============================================================
// Navigation
// ============================================================
export interface NavItem {
  type: 'section' | 'link';
  label: string;
  route?: string;
  icon?: string;
  params?: Record<string, string>;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// ============================================================
// Dashboard KPI
// ============================================================
export interface AggregatedKPI {
  nbTotal: number;
  nbEnCours: number;
  nbCloture: number;
  nbAttente: number;
  qteCmd: number;
  totBonnes: number;
  totCalage: number;
  totGache: number;
  totEngage: number;
  txGache: number;
  totalProdMs: number;
  totStopMs: number;
  nbArrets: number;
  mttr: number;
  txDispo: number;
  nbCtrlBon: number;
  nbCtrlMauv: number;
  txConf: number;
  nbTacheConf: number;
  nbTacheNC: number;
  nbPassations: number;
  pareto: ParetoItem[];
  perPole: PerPoleKPI[];
  perMachine: PerMachineKPI[];
  perOp: PerOperateurKPI[];
}

export interface ParetoItem {
  id: string;
  label: string;
  count: number;
}

export interface PerPoleKPI {
  pole: { id: string; nom: string; icone: string; couleur: string };
  dossiers: number;
  bonnes: number;
  gache: number;
  engage: number;
  txGache: number;
  stopMs: number;
  prodMs: number;
  arrets: number;
  txDispo: number;
  txConf: number;
}

export interface PerMachineKPI {
  machine: { id: string; nom: string; codeMachine: string };
  pole: { id: string; nom: string; icone: string; couleur: string } | null;
  dossiers: number;
  engage: number;
  gache: number;
  txGache: number;
  stopMs: number;
  arrets: number;
  prodMs: number;
  txDispo: number;
}

export interface PerOperateurKPI {
  op: { id: string; nom: string; matricule: string | null };
  dossiers: number;
  bonnes: number;
  gache: number;
  engage: number;
  txGache: number;
  arrets: number;
}
