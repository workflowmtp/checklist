# PrintSeq — Next.js Edition

Application de séquençage et suivi de production pour **MULTIPRINT** (Douala, Cameroun).

Migration de l'application HTML monolithique vers **Next.js 14 + PostgreSQL + Prisma + NextAuth**.

## Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Base de données**: PostgreSQL + Prisma ORM
- **Authentification**: NextAuth.js (Credentials)
- **State management**: Zustand (UI state)
- **Styling**: Tailwind CSS + CSS Variables (thème dark/light)
- **Fonts**: DM Sans + JetBrains Mono
- **Notifications**: Sonner
- **IA**: API Anthropic (Claude Sonnet)

## Prérequis

- Node.js >= 18
- PostgreSQL >= 14
- npm ou yarn

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres PostgreSQL

# 3. Générer le client Prisma
npx prisma generate

# 4. Pousser le schéma vers la base
npx prisma db push

# 5. Seeder la base avec les données démo
npm run db:seed

# 6. Lancer le serveur de développement
npm run dev
```

## Comptes de démonstration

| Rôle | Login | Mot de passe |
|------|-------|-------------|
| Administrateur | `admin` | `admin` |
| Chef d'Atelier | `chef1` | `chef1` |
| Conducteur | `cond1` | `cond1` |
| Resp. Pôle | `resp1` | `resp1` |
| Chef Atelier (Hélio) | `chef2` | `chef2` |
| Maintenance | `maint1` | `maint1` |
| Contrôle Qualité | `qc1` | `qc1` |

## Structure du projet

```
src/
├── app/
│   ├── (dashboard)/     # Routes protégées avec layout Sidebar+Header
│   │   ├── page.tsx     # Accueil
│   │   ├── pole/[id]/   # Vue détaillée pôle
│   │   ├── atelier/[id]/ # Vue détaillée atelier
│   │   ├── dossier/     # Dossiers (nouveau, exécution)
│   │   ├── dashboard/   # Dashboard KPI
│   │   ├── admin/       # Administration CRUD
│   │   ├── ai/          # Agent IA PrintSeq
│   │   └── ...
│   ├── login/           # Page de connexion
│   └── api/             # API routes (auth, seed)
├── components/
│   ├── layout/          # Sidebar, Header
│   └── ui/              # Composants réutilisables
├── lib/
│   ├── prisma.ts        # Client Prisma
│   ├── auth.ts          # Config NextAuth
│   ├── permissions.ts   # Matrice de permissions
│   ├── store.ts         # Zustand store
│   └── utils.ts         # Fonctions utilitaires
├── types/               # Types TypeScript
└── styles/              # CSS global + thème
```

## Plan de construction (10 parties)

- [x] **Partie 1** — Fondations & Infrastructure
- [x] **Partie 2** — Composants UI réutilisables
- [x] **Partie 3** — Écrans Accueil, Pôle, Atelier
- [x] **Partie 4** — Gestion des Dossiers
- [x] **Partie 5** — Opérations de Production
- [x] **Partie 6** — Passation, Clôture, Historique
- [x] **Partie 7** — Dashboard KPI multi-pôles
- [x] **Partie 8** — Administration CRUD
- [x] **Partie 9** — Agent IA, Exports, ERP
- [x] **Partie 10** — Seed, Demo Data & Intégration finale
