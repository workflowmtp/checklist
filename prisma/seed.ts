import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PrintSeq database (données essentielles uniquement)...');

  // Clean existing data
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

  // ===== UTILISATEUR ADMIN =====
  const hash = async (pw: string) => bcrypt.hash(pw, 10);
  await prisma.user.create({
    data: {
      id: 'u_admin',
      email: 'admin@multiprint.cm',
      nom: 'Administrateur Système',
      motDePasse: await hash('admin'),
      role: Role.ADMINISTRATEUR,
    },
  });
  console.log('✅ Utilisateur admin créé');

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
    { code: 'view_history', libelle: 'Voir l\'historique', groupe: 'reporting' },
    { code: 'export_data', libelle: 'Exporter les données', groupe: 'reporting' },
    { code: 'use_ai', libelle: 'Utiliser l\'assistant IA', groupe: 'outils' },
    { code: 'manage_users', libelle: 'Gérer les utilisateurs', groupe: 'admin' },
    { code: 'manage_roles', libelle: 'Gérer les rôles et permissions', groupe: 'admin' },
    { code: 'manage_referentials', libelle: 'Gérer les référentiels', groupe: 'admin' },
    { code: 'view_logs', libelle: 'Voir les logs système', groupe: 'admin' },
  ];
  for (const p of permissions) {
    await prisma.permission.create({ data: p });
  }
  console.log('✅ Permissions créées');

  // ===== ROLE-PERMISSIONS =====
  const rolePerms: Record<string, string[]> = {
    [Role.ADMINISTRATEUR]: permissions.map(p => p.code),
    [Role.RESPONSABLE_POLE]: [
      'view_all_poles', 'view_pole', 'view_atelier', 'view_dossier',
      'create_dossier', 'edit_dossier', 'close_dossier',
      'view_kpi', 'view_history', 'export_data', 'use_ai',
    ],
    [Role.CHEF_ATELIER]: [
      'view_pole', 'view_atelier', 'view_dossier',
      'create_dossier', 'edit_dossier', 'close_dossier',
      'manage_tasks', 'declare_production', 'manage_stops',
      'manage_controls', 'manage_handover',
      'view_kpi', 'view_history', 'export_data', 'use_ai',
    ],
    [Role.CONDUCTEUR]: [
      'view_pole', 'view_atelier', 'view_dossier',
      'execute_tasks', 'declare_production', 'manage_stops',
      'manage_controls', 'manage_handover',
    ],
    [Role.MAINTENANCE]: [
      'view_all_poles', 'view_dossier', 'manage_stops',
      'view_kpi', 'view_history',
    ],
    [Role.CONTROLE_QUALITE]: [
      'view_all_poles', 'view_dossier', 'manage_controls',
      'view_kpi', 'view_history',
    ],
  };

  const allPerms = await prisma.permission.findMany();
  const permMap = new Map(allPerms.map(p => [p.code, p.id]));

  for (const [role, codes] of Object.entries(rolePerms)) {
    for (const code of codes) {
      const permId = permMap.get(code);
      if (permId) {
        await prisma.rolePermission.create({
          data: { role: role as Role, permissionId: permId },
        });
      }
    }
  }
  console.log('✅ Rôles-Permissions créés');

  console.log('');
  console.log('🎉 Seed terminé !');
  console.log('');
  console.log('Compte créé :');
  console.log('  admin@multiprint.cm / admin — Administrateur');
  console.log('');
  console.log('Toutes les autres données (pôles, ateliers, machines, opérateurs, etc.)');
  console.log('doivent être créées via l\'interface d\'administration.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
