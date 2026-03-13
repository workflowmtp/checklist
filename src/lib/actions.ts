'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StatutDossier, StatutTache, StatutArret } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

// ============================================================
// HELPERS
// ============================================================
async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

async function logAction(type: string, entite: string, entiteId?: string, details?: any) {
  const user = await getCurrentUser();
  await prisma.logAction.create({
    data: { utilisateurId: user?.id, typeAction: type, entite, entiteId, detailsJson: details ? JSON.stringify(details) : null },
  });
}

// ============================================================
// HOME DATA
// ============================================================
export async function getHomeData() {
  const [poles, dossiers, machineCount] = await Promise.all([
    prisma.pole.findMany({
      include: {
        ateliers: true,
        machines: true,
        dossiers: { where: { statut: StatutDossier.EN_COURS } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.dossier.findMany({
      where: { statut: { in: [StatutDossier.EN_COURS, StatutDossier.EN_ATTENTE] } },
      include: {
        pole: { select: { id: true, nom: true, icone: true, couleur: true } },
        machine: { select: { id: true, nom: true, codeMachine: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.machine.count(),
  ]);

  const allDossiers = await prisma.dossier.groupBy({
    by: ['statut'],
    _count: true,
  });
  const counts: Record<string, number> = {};
  allDossiers.forEach((g) => { counts[g.statut] = g._count; });

  return { poles, activeDossiers: dossiers, machineCount, counts };
}

// ============================================================
// POLE DATA
// ============================================================
export async function getPoleData(poleId: string) {
  const pole = await prisma.pole.findUnique({
    where: { id: poleId },
    include: {
      ateliers: {
        include: {
          machineAteliers: { include: { machine: true } },
          operateurAteliers: { include: { operateur: true } },
          dossiers: { where: { statut: StatutDossier.EN_COURS } },
        },
      },
      machines: true,
      operateurs: true,
      dossiers: {
        where: { statut: { in: [StatutDossier.EN_COURS, StatutDossier.EN_ATTENTE] } },
        include: { machine: { select: { id: true, nom: true, codeMachine: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  const clotures = pole ? await prisma.dossier.count({ where: { poleId, statut: StatutDossier.CLOTURE } }) : 0;
  return { pole, clotures };
}

// ============================================================
// ATELIER DATA
// ============================================================
export async function getAtelierData(atelierId: string) {
  const atelier = await prisma.atelier.findUnique({
    where: { id: atelierId },
    include: {
      pole: true,
      machineAteliers: { include: { machine: true } },
      operateurAteliers: { include: { operateur: true } },
      dossiers: {
        where: { statut: { in: [StatutDossier.EN_COURS, StatutDossier.EN_ATTENTE] } },
        include: { machine: { select: { id: true, nom: true, codeMachine: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  const clotures = atelier ? await prisma.dossier.count({ where: { atelierId, statut: StatutDossier.CLOTURE } }) : 0;
  return { atelier, clotures };
}

// ============================================================
// DOSSIER OPERATIONS
// ============================================================
export async function getDossierData(dossierId: string) {
  return prisma.dossier.findUnique({
    where: { id: dossierId },
    include: {
      pole: true, atelier: true, machine: true,
      creePar: { select: { id: true, nom: true } },
      cloturePar: { select: { id: true, nom: true } },
      dossierOperateurs: { include: { operateur: true } },
      taches: { orderBy: { position: 'asc' }, include: { validePar: { select: { nom: true } } } },
      declarations: { orderBy: { dateDeclaration: 'desc' }, include: { declarePar: { select: { nom: true } } } },
      arrets: {
        orderBy: { dateDebut: 'desc' },
        include: { arretCauses: { include: { cause: true } }, creePar: { select: { nom: true } }, reprisPar: { select: { nom: true } } },
      },
      controles: { orderBy: { dateControle: 'desc' }, include: { auteur: { select: { nom: true } } } },
      passations: {
        orderBy: { heurePassation: 'desc' },
        include: { deOperateur: { select: { nom: true } }, versOperateur: { select: { nom: true } } },
      },
    },
  });
}

export async function getNewDossierData(poleId?: string, atelierId?: string) {
  const [poles, allAteliers, allMachineAteliers, allOpAteliers, existingNums] = await Promise.all([
    prisma.pole.findMany({ orderBy: { nom: 'asc' } }),
    prisma.atelier.findMany({ orderBy: { nom: 'asc' } }),
    prisma.machineAtelier.findMany({ include: { machine: true } }),
    prisma.operateurAtelier.findMany({ where: { operateur: { actif: true } }, include: { operateur: true } }),
    prisma.dossier.findMany({ select: { dossierNumero: true } }),
  ]);
  return { poles, allAteliers, allMachineAteliers, allOpAteliers, existingNums: existingNums.map(d => d.dossierNumero) };
}

export async function createDossier(data: {
  dossierNumero: string; dateDossier: string; ofNumero?: string; referenceCommande?: string;
  client?: string; poleId: string; atelierId: string; machineId: string;
  designation: string; quantiteCommandee: number; unite: string; operateurIds: string[];
  observations?: string; startImmediately: boolean;
}) {
  const user = await getCurrentUser();
  const now = new Date();
  const dossier = await prisma.dossier.create({
    data: {
      dossierNumero: data.dossierNumero, dateDossier: new Date(data.dateDossier),
      ofNumero: data.ofNumero || null, referenceCommande: data.referenceCommande || null,
      client: data.client || null, poleId: data.poleId, atelierId: data.atelierId,
      machineId: data.machineId, designation: data.designation,
      quantiteCommandee: data.quantiteCommandee, unite: data.unite,
      statut: data.startImmediately ? StatutDossier.EN_COURS : StatutDossier.EN_ATTENTE,
      dateDebut: data.startImmediately ? now : null,
      creeParId: user?.id, observations: data.observations || null,
    },
  });

  // Link operators
  await prisma.dossierOperateur.createMany({
    data: data.operateurIds.map((opId, i) => ({
      dossierId: dossier.id, operateurId: opId,
      role: i === 0 ? 'Conducteur principal' : 'Aide conducteur',
    })),
  });

  // Instantiate task templates
  const templates = await prisma.tacheModele.findMany({
    where: { machineId: data.machineId },
    include: { famille: true },
    orderBy: { position: 'asc' },
  });
  if (templates.length > 0) {
    await prisma.tacheDossier.createMany({
      data: templates.map((t) => ({
        dossierId: dossier.id, tacheModeleId: t.id, code: t.code,
        libelle: t.libelle, famille: t.famille?.nom || null,
        position: t.position, tempsPrevuMin: t.tempsPrevuMin,
        bloquante: t.bloquante, statut: StatutTache.EN_ATTENTE,
      })),
    });
  }

  await logAction('create', 'dossiers', dossier.id, { numero: data.dossierNumero });
  revalidatePath('/');
  return dossier;
}

export async function startDossier(dossierId: string) {
  await prisma.dossier.update({
    where: { id: dossierId },
    data: { statut: StatutDossier.EN_COURS, dateDebut: new Date() },
  });
  await logAction('start', 'dossiers', dossierId);
  revalidatePath(`/dossier/${dossierId}`);
}

// ============================================================
// TASK OPERATIONS
// ============================================================
export async function taskStart(dossierId: string, taskId: string) {
  const dossier = await prisma.dossier.findUnique({ where: { id: dossierId } });
  if (dossier?.statut === StatutDossier.EN_ATTENTE) {
    await prisma.dossier.update({ where: { id: dossierId }, data: { statut: StatutDossier.EN_COURS, dateDebut: new Date() } });
  }
  await prisma.tacheDossier.update({ where: { id: taskId }, data: { statut: StatutTache.EN_COURS, dateDebut: new Date() } });
  await logAction('task_start', 'taches_dossier', taskId);
  revalidatePath(`/dossier/${dossierId}`);
}

export async function taskPause(dossierId: string, taskId: string) {
  const task = await prisma.tacheDossier.findUnique({ where: { id: taskId } });
  if (!task) return;
  const ref = task.dateReprise || task.dateDebut;
  const extra = ref ? Date.now() - new Date(ref).getTime() : 0;
  await prisma.tacheDossier.update({
    where: { id: taskId },
    data: { statut: StatutTache.EN_PAUSE, datePause: new Date(), tempsReelMs: (task.tempsReelMs || 0) + extra },
  });
  revalidatePath(`/dossier/${dossierId}`);
}

export async function taskResume(dossierId: string, taskId: string) {
  await prisma.tacheDossier.update({ where: { id: taskId }, data: { statut: StatutTache.EN_COURS, dateReprise: new Date() } });
  revalidatePath(`/dossier/${dossierId}`);
}

export async function taskValidate(dossierId: string, taskId: string) {
  const user = await getCurrentUser();
  const task = await prisma.tacheDossier.findUnique({ where: { id: taskId } });
  if (!task) return;
  const ref = task.dateReprise || task.dateDebut;
  const extra = task.statut === StatutTache.EN_COURS && ref ? Date.now() - new Date(ref).getTime() : 0;
  await prisma.tacheDossier.update({
    where: { id: taskId },
    data: { statut: StatutTache.CONFORME, dateValidation: new Date(), valideParId: user?.id, tempsReelMs: (task.tempsReelMs || 0) + extra },
  });
  await logAction('task_validate', 'taches_dossier', taskId);
  revalidatePath(`/dossier/${dossierId}`);
}

export async function taskNC(dossierId: string, taskId: string, commentaire: string) {
  const user = await getCurrentUser();
  const task = await prisma.tacheDossier.findUnique({ where: { id: taskId } });
  if (!task) return;
  const ref = task.dateReprise || task.dateDebut;
  const extra = task.statut === StatutTache.EN_COURS && ref ? Date.now() - new Date(ref).getTime() : 0;
  await prisma.tacheDossier.update({
    where: { id: taskId },
    data: { statut: StatutTache.NON_CONFORME, commentaire, dateValidation: new Date(), valideParId: user?.id, tempsReelMs: (task.tempsReelMs || 0) + extra },
  });
  await logAction('task_nc', 'taches_dossier', taskId, { commentaire });
  revalidatePath(`/dossier/${dossierId}`);
}

// ============================================================
// PRODUCTION DECLARATIONS
// ============================================================
export async function declareProduction(dossierId: string, data: {
  bonnes: number; calage: number; gache: number; motifGache?: string; etatTirage: string;
}) {
  const user = await getCurrentUser();
  const dossier = await prisma.dossier.findUnique({ where: { id: dossierId } });
  if (!dossier) return;
  await prisma.declarationProduction.create({
    data: {
      dossierId, machineId: dossier.machineId,
      bonnes: data.bonnes, calage: data.calage, gache: data.gache,
      totalEngage: data.bonnes + data.calage + data.gache,
      motifGache: data.motifGache || null, etatTirage: data.etatTirage,
      declareParId: user?.id,
    },
  });
  await logAction('declare_production', 'declarations_production', dossierId);
  revalidatePath(`/dossier/${dossierId}`);
}

// ============================================================
// ARRÊTS
// ============================================================
export async function createArret(dossierId: string, causeIds: string[], commentaire?: string) {
  const user = await getCurrentUser();
  const arret = await prisma.arret.create({
    data: {
      dossierId, dateDebut: new Date(), statut: StatutArret.ACTIF,
      commentaireArret: commentaire || null, creeParId: user?.id,
    },
  });
  await prisma.arretCause.createMany({
    data: causeIds.map((causeId) => ({ arretId: arret.id, causeId })),
  });
  await logAction('stop_start', 'arrets', arret.id);
  revalidatePath(`/dossier/${dossierId}`);
}

export async function resumeArret(dossierId: string, arretId: string, commentaire?: string) {
  const user = await getCurrentUser();
  const arret = await prisma.arret.findUnique({ where: { id: arretId } });
  if (!arret) return;
  const duree = Date.now() - new Date(arret.dateDebut).getTime();
  await prisma.arret.update({
    where: { id: arretId },
    data: { dateFin: new Date(), dureeMs: duree, commentaireReprise: commentaire || null, statut: StatutArret.TERMINE, reprisParId: user?.id },
  });
  await logAction('stop_resume', 'arrets', arretId, { dureeMs: duree });
  revalidatePath(`/dossier/${dossierId}`);
}

// ============================================================
// CONTRÔLES
// ============================================================
export async function createControle(dossierId: string, details: { checkpoint_id: string; conforme: boolean }[], commentaire?: string) {
  const user = await getCurrentUser();
  const hasNC = details.some((d) => !d.conforme);
  await prisma.controleProduction.create({
    data: {
      dossierId, resultat: hasNC ? 'mauvais' : 'bon',
      commentaire: commentaire || null, auteurId: user?.id,
      detailsJson: JSON.stringify(details),
    },
  });
  await logAction('control', 'controles_production', dossierId, { nb_points: details.length });
  revalidatePath(`/dossier/${dossierId}`);
}

export async function getCheckpointsForPole(poleId?: string) {
  return prisma.checkpoint.findMany({
    where: { actif: true, OR: [{ poleId: null }, { poleId: poleId || undefined }] },
    orderBy: { categorie: 'asc' },
  });
}

export async function getCausesArret() {
  return prisma.causeArret.findMany({ where: { actif: true }, orderBy: { libelle: 'asc' } });
}

// ============================================================
// PASSATION
// ============================================================
export async function createPassation(dossierId: string, data: {
  versOperateurId: string; note?: string;
}) {
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    include: { dossierOperateurs: true, declarations: true },
  });
  if (!dossier) return;

  const fromOpId = dossier.dossierOperateurs[0]?.operateurId;
  let totB = 0, totC = 0, totG = 0;
  dossier.declarations.forEach((d) => { totB += d.bonnes; totC += d.calage; totG += d.gache; });

  const oldSession = dossier.sessionNumero;
  const newSession = oldSession + 1;

  await prisma.passation.create({
    data: {
      dossierId, sessionSortante: oldSession, sessionEntrante: newSession,
      heurePassation: new Date(), deOperateurId: fromOpId, versOperateurId: data.versOperateurId,
      note: data.note || null, bonnes: totB, calage: totC, gache: totG, total: totB + totC + totG,
    },
  });

  await prisma.dossier.update({ where: { id: dossierId }, data: { sessionNumero: newSession } });

  // Swap operators
  await prisma.dossierOperateur.deleteMany({ where: { dossierId } });
  await prisma.dossierOperateur.create({ data: { dossierId, operateurId: data.versOperateurId, role: 'Conducteur principal' } });

  await logAction('passation', 'passations', dossierId, { from: fromOpId, to: data.versOperateurId });
  revalidatePath(`/dossier/${dossierId}`);
}

// ============================================================
// CLÔTURE
// ============================================================
export async function cloturerDossier(dossierId: string, commentaire: string) {
  const user = await getCurrentUser();
  await prisma.dossier.update({
    where: { id: dossierId },
    data: { statut: StatutDossier.CLOTURE, dateFin: new Date(), commentaireCloture: commentaire, clotureParId: user?.id },
  });
  await logAction('cloture', 'dossiers', dossierId, { commentaire });
  revalidatePath(`/dossier/${dossierId}`);
}

// ============================================================
// HISTORIQUE
// ============================================================
export async function getHistoriqueData(filters: {
  pole?: string; machine?: string; statut?: string; search?: string; dateFrom?: string; dateTo?: string;
}) {
  const where: any = {};
  if (filters.pole) where.poleId = filters.pole;
  if (filters.machine) where.machineId = filters.machine;
  if (filters.statut) where.statut = filters.statut;
  if (filters.search) {
    where.OR = [
      { dossierNumero: { contains: filters.search, mode: 'insensitive' } },
      { ofNumero: { contains: filters.search, mode: 'insensitive' } },
      { client: { contains: filters.search, mode: 'insensitive' } },
      { designation: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.dateFrom || filters.dateTo) {
    where.dateDossier = {};
    if (filters.dateFrom) where.dateDossier.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.dateDossier.lte = new Date(filters.dateTo);
  }

  return prisma.dossier.findMany({
    where,
    include: {
      pole: { select: { nom: true, icone: true } },
      machine: { select: { codeMachine: true } },
      declarations: { select: { totalEngage: true } },
    },
    orderBy: { dateDossier: 'desc' },
    take: 200,
  });
}

// ============================================================
// DASHBOARD KPI
// ============================================================
export async function getDashboardData(filters?: { poleId?: string; dateFrom?: string; dateTo?: string }) {
  const where: any = {};
  if (filters?.poleId) where.poleId = filters.poleId;
  if (filters?.dateFrom || filters?.dateTo) {
    where.dateDossier = {};
    if (filters?.dateFrom) where.dateDossier.gte = new Date(filters.dateFrom);
    if (filters?.dateTo) where.dateDossier.lte = new Date(filters.dateTo);
  }

  const [dossiers, declarations, arrets, controles, taches, passations, poles, arretCauses] = await Promise.all([
    prisma.dossier.findMany({ where, select: { id: true, statut: true, poleId: true, machineId: true, quantiteCommandee: true, dateDebut: true, dateFin: true } }),
    prisma.declarationProduction.findMany({ where: { dossier: where }, select: { dossierId: true, bonnes: true, calage: true, gache: true, totalEngage: true } }),
    prisma.arret.findMany({ where: { dossier: where }, select: { id: true, dossierId: true, dureeMs: true } }),
    prisma.controleProduction.findMany({ where: { dossier: where }, select: { resultat: true } }),
    prisma.tacheDossier.findMany({ where: { dossier: where }, select: { statut: true, dossierId: true } }),
    prisma.passation.count({ where: { dossier: where } }),
    prisma.pole.findMany({ select: { id: true, nom: true, icone: true, couleur: true } }),
    prisma.arretCause.findMany({ where: { arret: { dossier: where } }, include: { cause: { select: { id: true, libelle: true } } } }),
  ]);

  // Aggregate
  const dossierIds = new Set(dossiers.map((d) => d.id));
  let nbEnCours = 0, nbCloture = 0, nbAttente = 0, qteCmd = 0, totalProdMs = 0;
  let totBonnes = 0, totCalage = 0, totGache = 0, totEngage = 0, totStopMs = 0;
  let nbCtrlBon = 0, nbCtrlMauv = 0, nbTacheConf = 0, nbTacheNC = 0;

  dossiers.forEach((d) => {
    if (d.statut === 'EN_COURS') { nbEnCours++; if (d.dateDebut) totalProdMs += Date.now() - new Date(d.dateDebut).getTime(); }
    else if (d.statut === 'CLOTURE') { nbCloture++; if (d.dateDebut && d.dateFin) totalProdMs += new Date(d.dateFin).getTime() - new Date(d.dateDebut).getTime(); }
    else if (d.statut === 'EN_ATTENTE') nbAttente++;
    qteCmd += d.quantiteCommandee;
  });
  declarations.forEach((d) => { totBonnes += d.bonnes; totCalage += d.calage; totGache += d.gache; totEngage += d.totalEngage; });
  arrets.forEach((a) => { totStopMs += a.dureeMs || 0; });
  controles.forEach((c) => { if (c.resultat === 'bon') nbCtrlBon++; else nbCtrlMauv++; });
  taches.forEach((t) => { if (t.statut === 'CONFORME') nbTacheConf++; if (t.statut === 'NON_CONFORME') nbTacheNC++; });

  const txGache = totEngage > 0 ? (totGache / totEngage * 100) : 0;
  const txDispo = totalProdMs > 0 ? Math.max(0, (totalProdMs - totStopMs) / totalProdMs * 100) : 100;
  const mttr = arrets.length > 0 ? totStopMs / arrets.length : 0;
  const txConf = (nbTacheConf + nbTacheNC) > 0 ? (nbTacheConf / (nbTacheConf + nbTacheNC) * 100) : 100;

  // Pareto
  const causeCount: Record<string, { label: string; count: number }> = {};
  arretCauses.forEach((ac) => {
    const cid = ac.cause.id;
    if (!causeCount[cid]) causeCount[cid] = { label: ac.cause.libelle, count: 0 };
    causeCount[cid].count++;
  });
  const pareto = Object.entries(causeCount).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.count - a.count);

  // Per-pole
  const perPole = poles.map((pole) => {
    const pDos = dossiers.filter((d) => d.poleId === pole.id);
    const pIds = new Set(pDos.map((d) => d.id));
    const pDecls = declarations.filter((d) => pIds.has(d.dossierId));
    const pArrets = arrets.filter((a) => pIds.has(a.dossierId));
    const pTaches = taches.filter((t) => pIds.has(t.dossierId));
    let pB = 0, pG = 0, pE = 0, pStop = 0, pProd = 0, ptC = 0, ptNC = 0;
    pDecls.forEach((d) => { pB += d.bonnes; pG += d.gache; pE += d.totalEngage; });
    pArrets.forEach((a) => { pStop += a.dureeMs || 0; });
    pDos.forEach((d) => {
      if (d.dateDebut && d.dateFin) pProd += new Date(d.dateFin).getTime() - new Date(d.dateDebut).getTime();
      else if (d.dateDebut && d.statut === 'EN_COURS') pProd += Date.now() - new Date(d.dateDebut).getTime();
    });
    pTaches.forEach((t) => { if (t.statut === 'CONFORME') ptC++; if (t.statut === 'NON_CONFORME') ptNC++; });
    return {
      pole, dossiers: pDos.length, bonnes: pB, gache: pG, engage: pE,
      txGache: pE > 0 ? (pG / pE * 100) : 0, stopMs: pStop, prodMs: pProd,
      arrets: pArrets.length, txDispo: pProd > 0 ? Math.max(0, (pProd - pStop) / pProd * 100) : 100,
      txConf: (ptC + ptNC) > 0 ? (ptC / (ptC + ptNC) * 100) : 100,
    };
  });

  return {
    nbTotal: dossiers.length, nbEnCours, nbCloture, nbAttente, qteCmd,
    totBonnes, totCalage, totGache, totEngage, txGache, totalProdMs,
    totStopMs, nbArrets: arrets.length, mttr, txDispo,
    nbCtrlBon, nbCtrlMauv, txConf, nbTacheConf, nbTacheNC,
    nbPassations: passations, pareto, perPole, poles,
  };
}

// ============================================================
// ADMIN CRUD
// ============================================================
export async function getAdminData(tab: string) {
  switch (tab) {
    case 'poles': return prisma.pole.findMany({ include: { _count: { select: { ateliers: true, machines: true } } }, orderBy: { nom: 'asc' } });
    case 'ateliers': return prisma.atelier.findMany({ include: { pole: true, _count: { select: { machineAteliers: true, operateurAteliers: true } } }, orderBy: { nom: 'asc' } });
    case 'machines': return prisma.machine.findMany({ include: { pole: true, machineAteliers: { include: { atelier: true } } }, orderBy: { codeMachine: 'asc' } });
    case 'operateurs': return prisma.operateur.findMany({ include: { pole: true, operateurAteliers: { include: { atelier: true } } }, orderBy: { nom: 'asc' } });
    case 'causes': return prisma.causeArret.findMany({ orderBy: { code: 'asc' } });
    case 'checkpoints': return prisma.checkpoint.findMany({ include: { pole: true }, orderBy: { code: 'asc' } });
    case 'users': return prisma.user.findMany({ include: { pole: true, atelier: true }, orderBy: { nom: 'asc' } });
    case 'permissions': return prisma.permission.findMany({ orderBy: [{ groupe: 'asc' }, { code: 'asc' }] });
    case 'role-permissions': return prisma.rolePermission.findMany({ include: { permission: true }, orderBy: [{ role: 'asc' }, { permission: { groupe: 'asc' } }] });
    default: return [];
  }
}

export async function savePole(id: string | null, data: { nom: string; icone: string; couleur: string; description?: string }) {
  if (id) { await prisma.pole.update({ where: { id }, data }); }
  else { await prisma.pole.create({ data }); }
  revalidatePath('/admin');
}

export async function deletePole(id: string) {
  await prisma.pole.delete({ where: { id } });
  revalidatePath('/admin');
}

export async function saveAtelier(id: string | null, data: { nom: string; poleId: string; description?: string }) {
  if (id) { await prisma.atelier.update({ where: { id }, data }); }
  else { await prisma.atelier.create({ data }); }
  revalidatePath('/admin');
}

export async function deleteAtelier(id: string) {
  await prisma.atelier.delete({ where: { id } });
  revalidatePath('/admin');
}

export async function saveMachine(id: string | null, data: { codeMachine: string; nom: string; poleId: string; description?: string; actif: boolean }) {
  if (id) { await prisma.machine.update({ where: { id }, data }); }
  else { await prisma.machine.create({ data }); }
  revalidatePath('/admin');
}

export async function deleteMachine(id: string) {
  await prisma.machineAtelier.deleteMany({ where: { machineId: id } });
  await prisma.machine.delete({ where: { id } });
  revalidatePath('/admin');
}

export async function saveOperateur(id: string | null, data: { nom: string; matricule?: string; poleId: string; actif: boolean }) {
  if (id) { await prisma.operateur.update({ where: { id }, data }); }
  else { await prisma.operateur.create({ data }); }
  revalidatePath('/admin');
}

export async function deleteOperateur(id: string) {
  await prisma.operateurAtelier.deleteMany({ where: { operateurId: id } });
  await prisma.operateur.delete({ where: { id } });
  revalidatePath('/admin');
}

export async function saveCause(id: string | null, data: { code: string; libelle: string; actif: boolean }) {
  if (id) { await prisma.causeArret.update({ where: { id }, data }); }
  else { await prisma.causeArret.create({ data }); }
  revalidatePath('/admin');
}

export async function saveCheckpoint(id: string | null, data: { code: string; libelle: string; categorie?: string; poleId?: string | null; obligatoire: boolean; actif: boolean; description?: string }) {
  if (id) { await prisma.checkpoint.update({ where: { id }, data }); }
  else { await prisma.checkpoint.create({ data }); }
  revalidatePath('/admin');
}

export async function saveUser(id: string | null, data: { email: string; nom: string; motDePasse?: string; role: any; poleId?: string | null; atelierId?: string | null; actif: boolean }) {
  const updateData: any = { email: data.email, nom: data.nom, role: data.role, poleId: data.poleId || null, atelierId: data.atelierId || null, actif: data.actif };
  if (data.motDePasse) updateData.motDePasse = await bcrypt.hash(data.motDePasse, 10);
  if (id) { await prisma.user.update({ where: { id }, data: updateData }); }
  else {
    if (!data.motDePasse) throw new Error('Mot de passe obligatoire');
    await prisma.user.create({ data: { ...updateData, motDePasse: await bcrypt.hash(data.motDePasse, 10) } });
  }
  revalidatePath('/admin');
}

export async function savePermission(id: string | null, data: { code: string; libelle: string; description?: string; groupe: string }) {
  if (id) { await prisma.permission.update({ where: { id }, data }); }
  else { await prisma.permission.create({ data }); }
  revalidatePath('/admin');
}

export async function toggleRolePermission(role: string, permissionId: string) {
  const existing = await prisma.rolePermission.findFirst({ where: { role: role as any, permissionId } });
  if (existing) {
    await prisma.rolePermission.delete({ where: { id: existing.id } });
  } else {
    await prisma.rolePermission.create({ data: { role: role as any, permissionId } });
  }
  revalidatePath('/admin');
}

export async function deleteEntity(collection: string, id: string) {
  switch (collection) {
    case 'poles': await prisma.pole.delete({ where: { id } }); break;
    case 'ateliers': await prisma.atelier.delete({ where: { id } }); break;
    case 'causes': await prisma.causeArret.delete({ where: { id } }); break;
    case 'checkpoints': await prisma.checkpoint.delete({ where: { id } }); break;
    case 'users': await prisma.user.delete({ where: { id } }); break;
    case 'permissions': await prisma.rolePermission.deleteMany({ where: { permissionId: id } }); await prisma.permission.delete({ where: { id } }); break;
  }
  revalidatePath('/admin');
}

// ============================================================
// TASK CONFIG
// ============================================================
export async function getTaskConfigData(machineId?: string) {
  const machines = await prisma.machine.findMany({ where: { actif: true }, include: { pole: { select: { icone: true, nom: true } } }, orderBy: { codeMachine: 'asc' } });
  let familles: any[] = [];
  let taches: any[] = [];
  if (machineId) {
    familles = await prisma.familleTache.findMany({ where: { machineId }, orderBy: { ordre: 'asc' } });
    taches = await prisma.tacheModele.findMany({ where: { machineId }, include: { famille: true }, orderBy: { position: 'asc' } });
  }
  return { machines, familles, taches };
}

export async function saveFamille(machineId: string, id: string | null, data: { nom: string; ordre: number }) {
  if (id) { await prisma.familleTache.update({ where: { id }, data: { ...data, machineId } }); }
  else { await prisma.familleTache.create({ data: { ...data, machineId } }); }
  revalidatePath('/configuration-taches');
}

export async function deleteFamille(id: string) {
  await prisma.tacheModele.updateMany({ where: { familleId: id }, data: { familleId: null } });
  await prisma.familleTache.delete({ where: { id } });
  revalidatePath('/configuration-taches');
}

export async function saveTacheModele(machineId: string, id: string | null, data: { code: string; libelle: string; familleId?: string | null; position: number; tempsPrevuMin: number; bloquante: boolean }) {
  if (id) { await prisma.tacheModele.update({ where: { id }, data: { ...data, machineId } }); }
  else { await prisma.tacheModele.create({ data: { ...data, machineId } }); }
  revalidatePath('/configuration-taches');
}

export async function deleteTacheModele(id: string) {
  await prisma.tacheModele.delete({ where: { id } });
  revalidatePath('/configuration-taches');
}

// ============================================================
// EXPORTS
// ============================================================
export async function getExportData(type: string) {
  switch (type) {
    case 'dossiers': return prisma.dossier.findMany({ include: { pole: true, atelier: true, machine: true, declarations: true, arrets: true, taches: true } });
    case 'declarations': return prisma.declarationProduction.findMany({ include: { dossier: { select: { dossierNumero: true } }, machine: { select: { codeMachine: true } }, declarePar: { select: { nom: true } } } });
    case 'arrets': return prisma.arret.findMany({ include: { dossier: { select: { dossierNumero: true } }, arretCauses: { include: { cause: true } }, creePar: { select: { nom: true } }, reprisPar: { select: { nom: true } } } });
    case 'taches': return prisma.tacheDossier.findMany({ include: { dossier: { select: { dossierNumero: true } }, validePar: { select: { nom: true } } } });
    case 'controles': return prisma.controleProduction.findMany({ include: { dossier: { select: { dossierNumero: true } }, auteur: { select: { nom: true } } } });
    case 'passations': return prisma.passation.findMany({ include: { dossier: { select: { dossierNumero: true } }, deOperateur: { select: { nom: true } }, versOperateur: { select: { nom: true } } } });
    default: return [];
  }
}

// ============================================================
// OPERATEURS FOR POLE (for passation, dossier creation)
// ============================================================
export async function getOperateursForPole(poleId: string) {
  return prisma.operateur.findMany({ where: { poleId, actif: true }, orderBy: { nom: 'asc' } });
}

// ============================================================
// ERP
// ============================================================
export async function getERPData() {
  const [config, syncQueue] = await Promise.all([
    prisma.parametreIntegration.findFirst({ where: { typeSysteme: 'sage_x3' } }),
    prisma.syncQueue.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
  ]);
  return { config, syncQueue };
}

export async function saveERPConfig(data: { url: string; site: string; database: string; user: string }) {
  const existing = await prisma.parametreIntegration.findFirst({ where: { typeSysteme: 'sage_x3' } });
  const configJson = JSON.stringify(data);
  if (existing) { await prisma.parametreIntegration.update({ where: { id: existing.id }, data: { configJson } }); }
  else { await prisma.parametreIntegration.create({ data: { typeSysteme: 'sage_x3', configJson } }); }
  revalidatePath('/erp');
}

export async function simulateERPImport() {
  const articles = ['Étiquettes Castel Beer 50cl', 'Film Maggi Cube 100g', 'Cartons Chococam 250g', 'Bouchons 26mm Brasseries'];
  const clients = ['SABC', 'Nestlé Cameroun', 'Chococam', 'Guinness Cameroun'];
  const idx = Math.floor(Math.random() * 4);
  const ofNum = 'OF-26-' + (1000 + Math.floor(Math.random() * 9000));
  await prisma.syncQueue.create({
    data: {
      typeEntite: 'OF', entiteId: ofNum, action: 'import',
      payloadJson: JSON.stringify({ of_numero: ofNum, article: articles[idx], client: clients[idx], quantite: (Math.floor(Math.random() * 40) + 10) * 10000, site: 'DLA' }),
      statut: 'done', dateTentative: new Date(),
    },
  });
  revalidatePath('/erp');
  return { ofNum, article: articles[idx] };
}
