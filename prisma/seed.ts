import { PrismaClient, Role, StatutDossier, StatutTache, StatutArret } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PrintSeq database — Données démo MULTIPRINT v9.0...');

  // ===== CLEAN =====
  await prisma.$transaction([
    prisma.rolePermission.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.arretCause.deleteMany(),
    prisma.arret.deleteMany(),
    prisma.controleProduction.deleteMany(),
    prisma.declarationProduction.deleteMany(),
    prisma.tacheDossier.deleteMany(),
    prisma.passation.deleteMany(),
    prisma.dossierOperateur.deleteMany(),
    prisma.dossier.deleteMany(),
    prisma.tacheModele.deleteMany(),
    prisma.familleTache.deleteMany(),
    prisma.machineAtelier.deleteMany(),
    prisma.operateurAtelier.deleteMany(),
    prisma.checkpoint.deleteMany(),
    prisma.causeArret.deleteMany(),
    prisma.syncQueue.deleteMany(),
    prisma.parametreIntegration.deleteMany(),
    prisma.logAction.deleteMany(),
    prisma.user.deleteMany(),
    prisma.operateur.deleteMany(),
    prisma.machine.deleteMany(),
    prisma.atelier.deleteMany(),
    prisma.pole.deleteMany(),
  ]);
  console.log('✅ Base nettoyée');

  const hash = async (pw: string) => bcrypt.hash(pw, 10);

  // ===== PÔLES =====
  const polesData = [
    { id: 'pole_oe', nom: 'Offset Étiquette', icone: '🏷️', couleur: '#3b82f6', description: "Impression offset d'étiquettes haute qualité" },
    { id: 'pole_hf', nom: 'Héliogravure Flexible', icone: '📦', couleur: '#a855f7', description: 'Emballages flexibles par héliogravure' },
    { id: 'pole_oc', nom: 'Offset Carton', icone: '📋', couleur: '#f59e0b', description: 'Impression offset sur carton plat et ondulé' },
    { id: 'pole_bc', nom: 'Bouchon Couronne', icone: '🔩', couleur: '#22c55e', description: 'Fabrication de bouchons couronnes métalliques' },
  ];
  for (const p of polesData) await prisma.pole.create({ data: p });
  console.log('✅ 4 Pôles créés');

  // ===== ATELIERS =====
  const ateliersData = [
    { id: 'at_oe_imp', poleId: 'pole_oe', nom: 'Impression Étiquette', description: "Atelier d'impression offset étiquettes" },
    { id: 'at_oe_fin', poleId: 'pole_oe', nom: 'Finition Étiquette', description: 'Découpe, vernis, dorure' },
    { id: 'at_hf_imp', poleId: 'pole_hf', nom: 'Impression Hélio', description: 'Impression par héliogravure' },
    { id: 'at_hf_lam', poleId: 'pole_hf', nom: 'Complexage & Découpe', description: 'Lamination et refente' },
    { id: 'at_oc_imp', poleId: 'pole_oc', nom: 'Impression Carton', description: 'Impression offset feuilles carton' },
    { id: 'at_oc_dec', poleId: 'pole_oc', nom: 'Découpe & Pliage', description: 'Découpe à plat, collage, pliage' },
    { id: 'at_bc_fab', poleId: 'pole_bc', nom: 'Fabrication Bouchons', description: 'Emboutissage et lithographie' },
    { id: 'at_bc_ctr', poleId: 'pole_bc', nom: 'Contrôle & Emballage', description: 'Tri, contrôle qualité, conditionnement' },
  ];
  for (const a of ateliersData) await prisma.atelier.create({ data: a });
  console.log('✅ 8 Ateliers créés');

  // ===== MACHINES =====
  const machinesData = [
    { id: 'm_sm102', poleId: 'pole_oe', nom: 'Heidelberg SM 102', codeMachine: 'SM102', description: 'Offset 4 couleurs', actif: true },
    { id: 'm_gto52', poleId: 'pole_oe', nom: 'Heidelberg GTO 52', codeMachine: 'GTO52', description: 'Offset 2 couleurs étiquettes', actif: true },
    { id: 'm_bob1', poleId: 'pole_oe', nom: 'Bobst SP 102', codeMachine: 'BOBST1', description: 'Découpe à plat étiquettes', actif: true },
    { id: 'm_rot1', poleId: 'pole_hf', nom: 'Rotomec RS 4003', codeMachine: 'ROT1', description: 'Rotative hélio 8 couleurs', actif: true },
    { id: 'm_rot2', poleId: 'pole_hf', nom: 'Rotomec RS 4002', codeMachine: 'ROT2', description: 'Rotative hélio 6 couleurs', actif: true },
    { id: 'm_lam1', poleId: 'pole_hf', nom: 'Nordmeccanica Duplex', codeMachine: 'LAM1', description: 'Complexeuse sans solvant', actif: true },
    { id: 'm_cd102', poleId: 'pole_oc', nom: 'Heidelberg CD 102', codeMachine: 'CD102', description: 'Offset 6 couleurs carton', actif: true },
    { id: 'm_bob2', poleId: 'pole_oc', nom: 'Bobst SP 130', codeMachine: 'BOBST2', description: 'Découpe carton', actif: true },
    { id: 'm_pli1', poleId: 'pole_oc', nom: 'Bobst Expertfold', codeMachine: 'PLI1', description: 'Plieuse-colleuse', actif: true },
    { id: 'm_emb1', poleId: 'pole_bc', nom: 'Presse Emboutissage P1', codeMachine: 'EMB1', description: 'Presse emboutissage couronne', actif: true },
    { id: 'm_lit1', poleId: 'pole_bc', nom: 'Crabtree Litho', codeMachine: 'LIT1', description: 'Lithographie bouchons', actif: true },
    { id: 'm_tri1', poleId: 'pole_bc', nom: 'Trieuse Optique T1', codeMachine: 'TRI1', description: 'Tri automatique bouchons', actif: true },
  ];
  for (const m of machinesData) await prisma.machine.create({ data: m });
  console.log('✅ 12 Machines créées');

  // ===== MACHINE <-> ATELIER =====
  const maLinks = [
    { machineId: 'm_sm102', atelierId: 'at_oe_imp' },
    { machineId: 'm_gto52', atelierId: 'at_oe_imp' },
    { machineId: 'm_bob1', atelierId: 'at_oe_fin' },
    { machineId: 'm_rot1', atelierId: 'at_hf_imp' },
    { machineId: 'm_rot2', atelierId: 'at_hf_imp' },
    { machineId: 'm_lam1', atelierId: 'at_hf_lam' },
    { machineId: 'm_cd102', atelierId: 'at_oc_imp' },
    { machineId: 'm_bob2', atelierId: 'at_oc_dec' },
    { machineId: 'm_pli1', atelierId: 'at_oc_dec' },
    { machineId: 'm_emb1', atelierId: 'at_bc_fab' },
    { machineId: 'm_lit1', atelierId: 'at_bc_fab' },
    { machineId: 'm_tri1', atelierId: 'at_bc_ctr' },
  ];
  for (const l of maLinks) await prisma.machineAtelier.create({ data: l });
  console.log('✅ 12 Machine-Atelier links');

  // ===== OPÉRATEURS =====
  const opsData = [
    { id: 'op1', poleId: 'pole_oe', nom: 'Mbarga Jean-Paul', matricule: 'MP-1042', actif: true },
    { id: 'op2', poleId: 'pole_oe', nom: 'Nkoulou Patrice', matricule: 'MP-1055', actif: true },
    { id: 'op3', poleId: 'pole_hf', nom: 'Fotso Albert', matricule: 'MP-1068', actif: true },
    { id: 'op4', poleId: 'pole_hf', nom: 'Tchinda Serge', matricule: 'MP-1071', actif: true },
    { id: 'op5', poleId: 'pole_oc', nom: 'Essomba David', matricule: 'MP-1083', actif: true },
    { id: 'op6', poleId: 'pole_oc', nom: 'Ndongo Pierre', matricule: 'MP-1092', actif: true },
    { id: 'op7', poleId: 'pole_bc', nom: 'Tagne Raphaël', matricule: 'MP-1105', actif: true },
    { id: 'op8', poleId: 'pole_bc', nom: 'Simo François', matricule: 'MP-1112', actif: true },
    { id: 'op9', poleId: 'pole_oe', nom: 'Kamga Michel', matricule: 'MP-1125', actif: true },
    { id: 'op10', poleId: 'pole_hf', nom: 'Djomou Eric', matricule: 'MP-1138', actif: true },
  ];
  for (const o of opsData) await prisma.operateur.create({ data: o });
  console.log('✅ 10 Opérateurs créés');

  // ===== OPÉRATEUR <-> ATELIER =====
  const oaLinks = [
    { operateurId: 'op1', atelierId: 'at_oe_imp' },
    { operateurId: 'op2', atelierId: 'at_oe_imp' },
    { operateurId: 'op9', atelierId: 'at_oe_fin' },
    { operateurId: 'op3', atelierId: 'at_hf_imp' },
    { operateurId: 'op4', atelierId: 'at_hf_imp' },
    { operateurId: 'op10', atelierId: 'at_hf_lam' },
    { operateurId: 'op5', atelierId: 'at_oc_imp' },
    { operateurId: 'op6', atelierId: 'at_oc_dec' },
    { operateurId: 'op7', atelierId: 'at_bc_fab' },
    { operateurId: 'op8', atelierId: 'at_bc_ctr' },
  ];
  for (const l of oaLinks) await prisma.operateurAtelier.create({ data: l });
  console.log('✅ 10 Opérateur-Atelier links');

  // ===== UTILISATEURS =====
  const usersData = [
    { id: 'u_admin', email: 'admin@multiprint.cm', nom: 'Administrateur Système', motDePasse: await hash('admin'), role: Role.ADMINISTRATEUR },
    { id: 'u_chef1', email: 'chef1@multiprint.cm', nom: 'Nana Robert', motDePasse: await hash('chef1'), role: Role.CHEF_ATELIER, poleId: 'pole_oe', atelierId: 'at_oe_imp' },
    { id: 'u_cond1', email: 'cond1@multiprint.cm', nom: 'Mbarga Jean-Paul', motDePasse: await hash('cond1'), role: Role.CONDUCTEUR, poleId: 'pole_oe', atelierId: 'at_oe_imp' },
    { id: 'u_resp1', email: 'resp1@multiprint.cm', nom: 'Tchuente Alain', motDePasse: await hash('resp1'), role: Role.RESPONSABLE_POLE, poleId: 'pole_oe' },
    { id: 'u_chef2', email: 'chef2@multiprint.cm', nom: 'Sontsa Gabriel', motDePasse: await hash('chef2'), role: Role.CHEF_ATELIER, poleId: 'pole_hf', atelierId: 'at_hf_imp' },
    { id: 'u_maint', email: 'maint1@multiprint.cm', nom: 'Biya Emmanuel', motDePasse: await hash('maint1'), role: Role.MAINTENANCE },
    { id: 'u_qc', email: 'qc1@multiprint.cm', nom: 'Onana Cécile', motDePasse: await hash('qc1'), role: Role.CONTROLE_QUALITE },
  ];
  for (const u of usersData) await prisma.user.create({ data: u });
  console.log('✅ 7 Utilisateurs créés');

  // ===== PERMISSIONS =====
  const permissions = [
    { code: 'view_all_poles', libelle: 'Voir tous les pôles', groupe: 'navigation' },
    { code: 'view_pole', libelle: 'Voir son pôle', groupe: 'navigation' },
    { code: 'view_atelier', libelle: 'Voir un atelier', groupe: 'navigation' },
    { code: 'view_dossier', libelle: 'Voir un dossier', groupe: 'navigation' },
    { code: 'create_dossier', libelle: 'Créer un dossier', groupe: 'dossiers' },
    { code: 'edit_dossier', libelle: 'Modifier un dossier', groupe: 'dossiers' },
    { code: 'close_dossier', libelle: 'Clôturer un dossier', groupe: 'dossiers' },
    { code: 'manage_tasks', libelle: 'Gérer les tâches', groupe: 'production' },
    { code: 'execute_tasks', libelle: 'Exécuter les tâches', groupe: 'production' },
    { code: 'declare_production', libelle: 'Déclarer la production', groupe: 'production' },
    { code: 'manage_stops', libelle: 'Gérer les arrêts', groupe: 'arrets' },
    { code: 'manage_controls', libelle: 'Gérer les contrôles qualité', groupe: 'qualite' },
    { code: 'manage_handover', libelle: 'Gérer les passations', groupe: 'production' },
    { code: 'view_kpi', libelle: 'Voir les KPIs', groupe: 'reporting' },
    { code: 'view_history', libelle: "Voir l'historique", groupe: 'reporting' },
    { code: 'export_data', libelle: 'Exporter les données', groupe: 'reporting' },
    { code: 'use_ai', libelle: "Utiliser l'assistant IA", groupe: 'outils' },
    { code: 'manage_users', libelle: 'Gérer les utilisateurs', groupe: 'admin' },
    { code: 'manage_roles', libelle: 'Gérer les rôles et permissions', groupe: 'admin' },
    { code: 'manage_referentials', libelle: 'Gérer les référentiels', groupe: 'admin' },
    { code: 'view_logs', libelle: 'Voir les logs système', groupe: 'admin' },
  ];
  for (const p of permissions) await prisma.permission.create({ data: p });
  console.log('✅ Permissions créées');

  // ===== ROLE-PERMISSIONS =====
  const rolePerms: Record<string, string[]> = {
    [Role.ADMINISTRATEUR]: permissions.map(p => p.code),
    [Role.RESPONSABLE_POLE]: ['view_all_poles','view_pole','view_atelier','view_dossier','create_dossier','edit_dossier','close_dossier','view_kpi','view_history','export_data','use_ai'],
    [Role.CHEF_ATELIER]: ['view_pole','view_atelier','view_dossier','create_dossier','edit_dossier','close_dossier','manage_tasks','declare_production','manage_stops','manage_controls','manage_handover','view_kpi','view_history','export_data','use_ai'],
    [Role.CONDUCTEUR]: ['view_pole','view_atelier','view_dossier','execute_tasks','declare_production','manage_stops','manage_controls','manage_handover'],
    [Role.MAINTENANCE]: ['view_all_poles','view_dossier','manage_stops','view_kpi','view_history'],
    [Role.CONTROLE_QUALITE]: ['view_all_poles','view_dossier','manage_controls','view_kpi','view_history'],
  };
  const allPerms = await prisma.permission.findMany();
  const permMap = new Map(allPerms.map(p => [p.code, p.id]));
  for (const [role, codes] of Object.entries(rolePerms)) {
    for (const code of codes) {
      const pid = permMap.get(code);
      if (pid) await prisma.rolePermission.create({ data: { role: role as Role, permissionId: pid } });
    }
  }
  console.log('✅ Rôles-Permissions créés');

  // ===== CAUSES D'ARRÊT =====
  const causesData = [
    { id: 'ca1', code: 'PANNE_MECA', libelle: 'Panne mécanique' },
    { id: 'ca2', code: 'PANNE_ELEC', libelle: 'Panne électrique' },
    { id: 'ca3', code: 'REGLAGE', libelle: 'Réglage machine' },
    { id: 'ca4', code: 'CALAGE', libelle: 'Calage / Mise en place' },
    { id: 'ca5', code: 'MATIERE', libelle: 'Attente matière première' },
    { id: 'ca6', code: 'ENCRE', libelle: 'Problème encre / couleur' },
    { id: 'ca7', code: 'QUALITE', libelle: 'Problème qualité produit' },
    { id: 'ca8', code: 'NETTOYAGE', libelle: 'Nettoyage planifié' },
    { id: 'ca9', code: 'CHANGEMENT', libelle: 'Changement de commande' },
    { id: 'ca10', code: 'ENERGIE', libelle: 'Coupure électrique / énergie' },
    { id: 'ca11', code: 'PERSONNEL', libelle: 'Absence personnel' },
    { id: 'ca12', code: 'AUTRE', libelle: 'Autre cause' },
  ];
  for (const c of causesData) await prisma.causeArret.create({ data: c });
  console.log('✅ 12 Causes d\'arrêt créées');

  // ===== CHECKPOINTS (points de contrôle) =====
  const checkpointsData = [
    { id: 'cp_visco', code: 'CP-VISCO', libelle: "Viscosité de l'encre", categorie: 'Encre', obligatoire: true, description: "Vérifier viscosité avec coupe Zahn n°2. Tolérance : 18-22 secondes" },
    { id: 'cp_densite', code: 'CP-DENSI', libelle: 'Densité optique couleurs', categorie: 'Couleur', obligatoire: true, description: 'Mesurer avec densitomètre. Écart max ΔE < 2 vs BAT' },
    { id: 'cp_reperage', code: 'CP-REPER', libelle: 'Repérage / registre', categorie: 'Repérage', obligatoire: true, description: "Contrôler l'alignement des couleurs. Tolérance : ±0.15mm" },
    { id: 'cp_qualimpr', code: 'CP-QUIMP', libelle: "Qualité d'impression", categorie: 'Impression', obligatoire: true, description: "Vérifier netteté, absence de taches, régularité de l'aplat" },
    { id: 'cp_pression', code: 'CP-PRESS', libelle: "Pression d'impression", categorie: 'Pression', obligatoire: false, description: "Vérifier l'uniformité de la pression sur toute la laize" },
    { id: 'cp_coupe', code: 'CP-COUPE', libelle: 'Qualité de coupe / découpe', categorie: 'Découpe', obligatoire: true, description: 'Vérifier propreté de coupe, absence de bavures, cotes conformes' },
    { id: 'cp_matiere', code: 'CP-MATPR', libelle: 'Conformité matière première', categorie: 'Matière', obligatoire: false, description: 'Vérifier grammage, épaisseur, aspect du support' },
    { id: 'cp_sechage', code: 'CP-SECH', libelle: 'Séchage / adhérence encre', categorie: 'Encre', obligatoire: false, description: "Test d'adhérence au scotch après séchage complet" },
    { id: 'cp_complex', code: 'CP-COMPL', libelle: 'Qualité complexage', categorie: 'Finition', poleId: 'pole_hf', obligatoire: true, description: 'Vérifier force de pelage, absence de bulles et tunneling' },
    { id: 'cp_litho', code: 'CP-LITHO', libelle: 'Qualité lithographie bouchon', categorie: 'Impression', poleId: 'pole_bc', obligatoire: true, description: 'Contrôle visuel + densitométrie sur bouchon imprimé' },
  ];
  for (const cp of checkpointsData) await prisma.checkpoint.create({ data: cp });
  console.log('✅ 10 Checkpoints créés');

  // ===== FAMILLES DE TÂCHES (SM102) =====
  const famillesData = [
    { id: 'ft1', machineId: 'm_sm102', nom: 'Préparation', ordre: 1 },
    { id: 'ft2', machineId: 'm_sm102', nom: 'Calage', ordre: 2 },
    { id: 'ft3', machineId: 'm_sm102', nom: 'Tirage', ordre: 3 },
    { id: 'ft4', machineId: 'm_sm102', nom: 'Finition', ordre: 4 },
  ];
  for (const f of famillesData) await prisma.familleTache.create({ data: f });
  console.log('✅ 4 Familles de tâches créées');

  // ===== TÂCHES MODÈLES (SM102) =====
  const tmData = [
    { id: 'tm1', machineId: 'm_sm102', familleId: 'ft1', code: 'PREP-01', libelle: 'Vérification bon de commande', position: 1, tempsPrevuMin: 10, bloquante: true },
    { id: 'tm2', machineId: 'm_sm102', familleId: 'ft1', code: 'PREP-02', libelle: 'Montage plaques', position: 2, tempsPrevuMin: 20, bloquante: true },
    { id: 'tm3', machineId: 'm_sm102', familleId: 'ft1', code: 'PREP-03', libelle: 'Préparation encriers', position: 3, tempsPrevuMin: 15, bloquante: true },
    { id: 'tm4', machineId: 'm_sm102', familleId: 'ft2', code: 'CAL-01', libelle: 'Calage encre', position: 4, tempsPrevuMin: 30, bloquante: true },
    { id: 'tm5', machineId: 'm_sm102', familleId: 'ft2', code: 'CAL-02', libelle: 'Calage repérage', position: 5, tempsPrevuMin: 25, bloquante: true },
    { id: 'tm6', machineId: 'm_sm102', familleId: 'ft2', code: 'CAL-03', libelle: 'BAT / Validation couleur', position: 6, tempsPrevuMin: 15, bloquante: true },
    { id: 'tm7', machineId: 'm_sm102', familleId: 'ft3', code: 'TIR-01', libelle: 'Tirage production', position: 7, tempsPrevuMin: 180, bloquante: true },
    { id: 'tm8', machineId: 'm_sm102', familleId: 'ft3', code: 'TIR-02', libelle: 'Contrôle en cours de tirage', position: 8, tempsPrevuMin: 0, bloquante: false },
    { id: 'tm9', machineId: 'm_sm102', familleId: 'ft4', code: 'FIN-01', libelle: 'Nettoyage machine', position: 9, tempsPrevuMin: 20, bloquante: false },
    { id: 'tm10', machineId: 'm_sm102', familleId: 'ft4', code: 'FIN-02', libelle: 'Comptage & empilage', position: 10, tempsPrevuMin: 15, bloquante: false },
  ];
  for (const t of tmData) await prisma.tacheModele.create({ data: t });
  console.log('✅ 10 Tâches modèles créées');

  // ===== DOSSIERS DE FABRICATION =====
  const dossiersData = [
    {
      id: 'd1', dossierNumero: 'DF-2026-001', sessionNumero: 2,
      dateDossier: new Date('2026-03-06'), ofNumero: 'OF-26-0142',
      referenceCommande: 'CMD-SA-2026-078', client: 'SABC',
      poleId: 'pole_oe', atelierId: 'at_oe_imp', machineId: 'm_sm102',
      designation: 'Étiquettes Beaufort Lager 33cl — Front + Back',
      quantiteCommandee: 250000, unite: 'feuilles',
      statut: StatutDossier.EN_COURS, dateDebut: new Date('2026-03-06T07:30:00'),
      creeParId: 'u_chef1',
    },
    {
      id: 'd2', dossierNumero: 'DF-2026-002', sessionNumero: 1,
      dateDossier: new Date('2026-03-07'), ofNumero: 'OF-26-0155',
      referenceCommande: 'CMD-UC-2026-045', client: 'UCAO',
      poleId: 'pole_hf', atelierId: 'at_hf_imp', machineId: 'm_rot1',
      designation: 'Film emballage savon Azur 200g — 4 pistes',
      quantiteCommandee: 180000, unite: 'mètres',
      statut: StatutDossier.EN_COURS, dateDebut: new Date('2026-03-07T06:00:00'),
      creeParId: 'u_chef2',
    },
    {
      id: 'd3', dossierNumero: 'DF-2026-003', sessionNumero: 1,
      dateDossier: new Date('2026-03-05'), ofNumero: 'OF-26-0138',
      referenceCommande: 'CMD-CF-2026-032', client: 'Chococam',
      poleId: 'pole_oc', atelierId: 'at_oc_imp', machineId: 'm_cd102',
      designation: 'Boîte pliante Tartina 500g — Impression 6 couleurs',
      quantiteCommandee: 80000, unite: 'feuilles',
      statut: StatutDossier.CLOTURE, dateDebut: new Date('2026-03-05T07:00:00'),
      dateFin: new Date('2026-03-06T16:30:00'), creeParId: 'u_admin',
      clotureParId: 'u_admin', commentaireCloture: 'Tirage conforme, livré au magasin',
    },
    {
      id: 'd4', dossierNumero: 'DF-2026-004', sessionNumero: 1,
      dateDossier: new Date('2026-03-08'), ofNumero: 'OF-26-0160',
      referenceCommande: 'CMD-GN-2026-018', client: 'Guinness Cameroun',
      poleId: 'pole_bc', atelierId: 'at_bc_fab', machineId: 'm_emb1',
      designation: 'Bouchons couronnes Guinness Smooth 33cl',
      quantiteCommandee: 500000, unite: 'pièces',
      statut: StatutDossier.EN_ATTENTE, creeParId: 'u_admin',
    },
  ];
  for (const d of dossiersData) await prisma.dossier.create({ data: d });
  console.log('✅ 4 Dossiers créés');

  // ===== DOSSIER <-> OPÉRATEUR =====
  const doLinks = [
    { dossierId: 'd1', operateurId: 'op1', role: 'Conducteur principal' },
    { dossierId: 'd1', operateurId: 'op2', role: 'Aide conducteur' },
    { dossierId: 'd2', operateurId: 'op3', role: 'Conducteur principal' },
    { dossierId: 'd3', operateurId: 'op5', role: 'Conducteur principal' },
    { dossierId: 'd4', operateurId: 'op7', role: 'Conducteur principal' },
  ];
  for (const l of doLinks) await prisma.dossierOperateur.create({ data: l });
  console.log('✅ 5 Dossier-Opérateur links');

  // ===== TÂCHES DOSSIER (instanciées pour d1 — SM102) =====
  const tdData = [
    { id: 'td1', dossierId: 'd1', tacheModeleId: 'tm1', code: 'PREP-01', libelle: 'Vérification bon de commande', famille: 'Préparation', position: 1, tempsPrevuMin: 10, tempsReelMs: 540000, statut: StatutTache.CONFORME, bloquante: true, dateDebut: new Date('2026-03-06T07:30:00'), dateValidation: new Date('2026-03-06T07:39:00'), valideParId: 'u_chef1' },
    { id: 'td2', dossierId: 'd1', tacheModeleId: 'tm2', code: 'PREP-02', libelle: 'Montage plaques', famille: 'Préparation', position: 2, tempsPrevuMin: 20, tempsReelMs: 1320000, statut: StatutTache.CONFORME, bloquante: true, dateDebut: new Date('2026-03-06T07:40:00'), dateValidation: new Date('2026-03-06T08:02:00'), valideParId: 'u_cond1' },
    { id: 'td3', dossierId: 'd1', tacheModeleId: 'tm3', code: 'PREP-03', libelle: 'Préparation encriers', famille: 'Préparation', position: 3, tempsPrevuMin: 15, tempsReelMs: 960000, statut: StatutTache.CONFORME, bloquante: true, dateDebut: new Date('2026-03-06T08:02:00'), dateValidation: new Date('2026-03-06T08:18:00'), valideParId: 'u_cond1' },
    { id: 'td4', dossierId: 'd1', tacheModeleId: 'tm4', code: 'CAL-01', libelle: 'Calage encre', famille: 'Calage', position: 4, tempsPrevuMin: 30, tempsReelMs: 2100000, statut: StatutTache.CONFORME, bloquante: true, dateDebut: new Date('2026-03-06T08:20:00'), dateValidation: new Date('2026-03-06T08:55:00'), valideParId: 'u_cond1' },
    { id: 'td5', dossierId: 'd1', tacheModeleId: 'tm5', code: 'CAL-02', libelle: 'Calage repérage', famille: 'Calage', position: 5, tempsPrevuMin: 25, tempsReelMs: 1800000, statut: StatutTache.CONFORME, bloquante: true, dateDebut: new Date('2026-03-06T08:55:00'), dateValidation: new Date('2026-03-06T09:25:00'), valideParId: 'u_cond1' },
    { id: 'td6', dossierId: 'd1', tacheModeleId: 'tm6', code: 'CAL-03', libelle: 'BAT / Validation couleur', famille: 'Calage', position: 6, tempsPrevuMin: 15, tempsReelMs: 0, statut: StatutTache.EN_COURS, bloquante: true, dateDebut: new Date('2026-03-06T09:30:00') },
    { id: 'td7', dossierId: 'd1', tacheModeleId: 'tm7', code: 'TIR-01', libelle: 'Tirage production', famille: 'Tirage', position: 7, tempsPrevuMin: 180, tempsReelMs: 0, statut: StatutTache.EN_ATTENTE, bloquante: true },
    { id: 'td8', dossierId: 'd1', tacheModeleId: 'tm8', code: 'TIR-02', libelle: 'Contrôle en cours de tirage', famille: 'Tirage', position: 8, tempsPrevuMin: 0, tempsReelMs: 0, statut: StatutTache.EN_ATTENTE, bloquante: false },
    { id: 'td9', dossierId: 'd1', tacheModeleId: 'tm9', code: 'FIN-01', libelle: 'Nettoyage machine', famille: 'Finition', position: 9, tempsPrevuMin: 20, tempsReelMs: 0, statut: StatutTache.EN_ATTENTE, bloquante: false },
    { id: 'td10', dossierId: 'd1', tacheModeleId: 'tm10', code: 'FIN-02', libelle: 'Comptage & empilage', famille: 'Finition', position: 10, tempsPrevuMin: 15, tempsReelMs: 0, statut: StatutTache.EN_ATTENTE, bloquante: false },
  ];
  for (const t of tdData) await prisma.tacheDossier.create({ data: t });
  console.log('✅ 10 Tâches dossier d1');

  // ===== DÉCLARATIONS DE PRODUCTION =====
  await prisma.declarationProduction.create({
    data: {
      id: 'dp1', dossierId: 'd1', machineId: 'm_sm102',
      bonnes: 85000, calage: 2500, gache: 1200, totalEngage: 88700,
      motifGache: 'Réglage registre initial', etatTirage: 'conforme',
      dateDeclaration: new Date('2026-03-07T14:00:00'), declareParId: 'u_cond1',
    },
  });
  // Extra declarations for d2 and d3 to enrich dashboard
  await prisma.declarationProduction.create({
    data: {
      id: 'dp2', dossierId: 'd2', machineId: 'm_rot1',
      bonnes: 62000, calage: 3000, gache: 1800, totalEngage: 66800,
      motifGache: 'Déviation tension bande', etatTirage: 'conforme',
      dateDeclaration: new Date('2026-03-08T10:00:00'), declareParId: 'u_chef2',
    },
  });
  await prisma.declarationProduction.create({
    data: {
      id: 'dp3', dossierId: 'd3', machineId: 'm_cd102',
      bonnes: 76500, calage: 1800, gache: 900, totalEngage: 79200,
      motifGache: 'Calage initial', etatTirage: 'conforme',
      dateDeclaration: new Date('2026-03-06T15:00:00'), declareParId: 'u_admin',
    },
  });
  console.log('✅ 3 Déclarations de production');

  // ===== ARRÊTS =====
  await prisma.arret.create({
    data: {
      id: 'ar1', dossierId: 'd1',
      dateDebut: new Date('2026-03-06T10:15:00'), dateFin: new Date('2026-03-06T10:42:00'),
      dureeMs: 1620000, commentaireArret: 'Bourrage papier au margeur',
      commentaireReprise: 'Dégagement effectué, reprise OK',
      statut: StatutArret.TERMINE, creeParId: 'u_cond1', reprisParId: 'u_cond1',
    },
  });
  await prisma.arret.create({
    data: {
      id: 'ar2', dossierId: 'd2',
      dateDebut: new Date('2026-03-07T09:20:00'), dateFin: new Date('2026-03-07T09:55:00'),
      dureeMs: 2100000, commentaireArret: 'Problème tension bande, déchirement film',
      commentaireReprise: 'Réglage tension effectué',
      statut: StatutArret.TERMINE, creeParId: 'u_chef2', reprisParId: 'u_chef2',
    },
  });
  await prisma.arret.create({
    data: {
      id: 'ar3', dossierId: 'd3',
      dateDebut: new Date('2026-03-05T11:00:00'), dateFin: new Date('2026-03-05T11:25:00'),
      dureeMs: 1500000, commentaireArret: 'Changement blanchet usé',
      commentaireReprise: 'Blanchet remplacé',
      statut: StatutArret.TERMINE, creeParId: 'u_admin', reprisParId: 'u_admin',
    },
  });
  console.log('✅ 3 Arrêts créés');

  // ===== ARRÊT-CAUSES =====
  await prisma.arretCause.create({ data: { arretId: 'ar1', causeId: 'ca1' } });
  await prisma.arretCause.create({ data: { arretId: 'ar2', causeId: 'ca3' } });
  await prisma.arretCause.create({ data: { arretId: 'ar2', causeId: 'ca5' } });
  await prisma.arretCause.create({ data: { arretId: 'ar3', causeId: 'ca1' } });
  await prisma.arretCause.create({ data: { arretId: 'ar3', causeId: 'ca8' } });
  console.log('✅ 5 Arrêt-Cause links');

  // ===== CONTRÔLES DE PRODUCTION =====
  await prisma.controleProduction.create({
    data: {
      id: 'ctrl1', dossierId: 'd1', resultat: 'bon',
      commentaire: 'Couleurs conformes au BAT',
      dateControle: new Date('2026-03-06T11:00:00'), auteurId: 'u_qc',
      detailsJson: JSON.stringify([{ checkpoint_id: 'cp_densite', conforme: true }, { checkpoint_id: 'cp_reperage', conforme: true }, { checkpoint_id: 'cp_qualimpr', conforme: true }]),
    },
  });
  await prisma.controleProduction.create({
    data: {
      id: 'ctrl2', dossierId: 'd1', resultat: 'bon',
      dateControle: new Date('2026-03-07T08:30:00'), auteurId: 'u_qc',
      detailsJson: JSON.stringify([{ checkpoint_id: 'cp_visco', conforme: true }, { checkpoint_id: 'cp_densite', conforme: true }, { checkpoint_id: 'cp_coupe', conforme: true }]),
    },
  });
  await prisma.controleProduction.create({
    data: {
      id: 'ctrl3', dossierId: 'd1', resultat: 'mauvais',
      commentaire: 'Décalage repérage couleur 3 détecté sur 200 feuilles',
      dateControle: new Date('2026-03-07T11:15:00'), auteurId: 'u_qc',
      detailsJson: JSON.stringify([{ checkpoint_id: 'cp_visco', conforme: true }, { checkpoint_id: 'cp_reperage', conforme: false, comment: 'Décalage C3 +0.3mm' }, { checkpoint_id: 'cp_qualimpr', conforme: true }]),
    },
  });
  await prisma.controleProduction.create({
    data: {
      id: 'ctrl4', dossierId: 'd3', resultat: 'bon',
      commentaire: 'Contrôle final OK avant clôture',
      dateControle: new Date('2026-03-06T15:30:00'), auteurId: 'u_qc',
      detailsJson: JSON.stringify([{ checkpoint_id: 'cp_densite', conforme: true }, { checkpoint_id: 'cp_coupe', conforme: true }, { checkpoint_id: 'cp_qualimpr', conforme: true }]),
    },
  });
  console.log('✅ 4 Contrôles de production');

  // ===== PASSATION =====
  await prisma.passation.create({
    data: {
      id: 'pas1', dossierId: 'd1',
      sessionSortante: 1, sessionEntrante: 2,
      heurePassation: new Date('2026-03-06T18:00:00'),
      deOperateurId: 'op1', versOperateurId: 'op2',
      note: "Machine stable, attention au réglage margeur côté opérateur. Encre noire à surveiller (niveau bas).",
      bonnes: 42000, calage: 1500, gache: 800, total: 44300,
    },
  });
  console.log('✅ 1 Passation');

  // ===== PARAMÈTRE INTÉGRATION =====
  await prisma.parametreIntegration.create({
    data: {
      id: 'pi1', typeSysteme: 'sage_x3', actif: false,
      configJson: JSON.stringify({ url: '', site: 'DLA', database: '', user: '', password: '' }),
    },
  });
  console.log('✅ Paramètre intégration');

  console.log('');
  console.log('🎉 Seed terminé — Données démo MULTIPRINT v9.0 !');
  console.log('');
  console.log('Comptes créés :');
  console.log('  admin@multiprint.cm / admin — Administrateur');
  console.log('  chef1@multiprint.cm / chef1 — Chef d\'Atelier (Offset Étiquette)');
  console.log('  cond1@multiprint.cm / cond1 — Conducteur (Offset Étiquette)');
  console.log('  resp1@multiprint.cm / resp1 — Responsable de Pôle (Offset Étiquette)');
  console.log('  chef2@multiprint.cm / chef2 — Chef d\'Atelier (Héliogravure Flexible)');
  console.log('  maint1@multiprint.cm / maint1 — Maintenance');
  console.log('  qc1@multiprint.cm / qc1 — Contrôle Qualité');
  console.log('');
  console.log('Données : 4 pôles, 8 ateliers, 12 machines, 10 opérateurs,');
  console.log('  4 dossiers, 10 tâches, 3 déclarations, 3 arrêts, 4 contrôles, 1 passation');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
