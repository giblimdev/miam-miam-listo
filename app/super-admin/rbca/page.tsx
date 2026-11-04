/*
path :           app/super-admin/rbca/page.tsx
tag :            ["super-admin", "rbca", "rbac", "platform-role", "documentation", "worker-role", "prisma"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de documentation du modèle RBAC de Genesis. Explique
                 la séparation entre :
                 1) PlatformRole (user / admin / superAdmin) — rôle GLOBAL
                    de l'utilisateur sur la plateforme, stocké dans
                    User.platformRole (String, validé côté app par
                    platformRoleSchema). C'est le seul rôle natif Better
                    Auth.
                 2) WorkerRole (rôles MÉTIER, à venir) — rôles contextuels
                    liés à une organisation (commerce, équipe, agence…)
                    qui seront stockés dans une table dédiée (Worker,
                    Membership, OrganizationRole…) et NON dans
                    User.platformRole. Better Auth doit être étendu
                    (additionalFields / hooks / plugins) pour les exposer
                    en session.
                 Présente aussi les règles d'attribution : qui peut
                 attribuer quel rôle, les garde-fous anti-lockout et
                 anti-auto-promotion, et la procédure de migration
                 (prisma schema + better-auth config + validations +
                 helpers rbac + UI).

                 Page statique (Server Component) sans fetch ni état.
                 Sert de référence pour toute évolution future du modèle
                 de rôles.

flow:            Server Component pur → rend un wrapper max-w-5xl →
                 Hero (badge, titre, tagline) → section « PlatformRole »
                 (3 rôles, tableau) → section « WorkerRole » (à venir,
                 modèle Prisma, contraintes, impact Better Auth) →
                 section « Qui attribue quoi » (règles) → section
                 « Garde-fous » (anti-lockout, anti-auto-promotion) →
                 section « Procédure de migration WorkerRole » (5 étapes
                 numérotées) → CTA vers /super-admin/user-manager.
                 Aucun état, aucun effet, aucun fetch.

ecosystem:       SuperAdmin = [
                   "@/app/super-admin/page.tsx",
                   "@/app/super-admin/rbca/page.tsx",
                   "@/app/super-admin/user-manager/UsersTable.tsx",
                   "@/app/super-admin/user-manager/actions.ts",
                   "@/app/super-admin/user-manager/page.tsx",
                   "@/config/roles.ts",
                   "@/lib/actions/result.ts",
                   "@/lib/auth/auth.ts",
                   "@/lib/auth/rbac.ts",
                   "@/lib/prisma.ts",
                 ]

relatedFiles:    ["@/config/roles.ts",
                  "@/lib/auth/rbac.ts",
                  "@/lib/auth/auth.ts",
                  "@/lib/prisma.ts",
                  "@/app/super-admin/user-manager/page.tsx"]

imports:         ["next/link", "lucide-react",
                  "@/components/ui/button",
                  "@/components/ui/card"]

exports:         ["default RcbaPage", "metadata"]

useBy:           []

userStories:     ["*en tant que développeur je veux comprendre le modèle RBAC de la plateforme",
                  "*en tant que super-admin je veux savoir comment attribuer les rôles",
                  "*en tant que développeur je veux préparer l'ajout des rôles métier (WorkerRole)"]

status:          planned
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Cog,
  KeyRound,
  Layers,
  ListChecks,
  Lock,
  ShieldCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "RBAC — Rôles plateforme et rôles métier",
  description:
    "Modèle de rôles de Genesis : PlatformRole global (user / admin / superAdmin), rôles métier contextuels (WorkerRole, à venir) et règles d'attribution.",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RoleRow {
  readonly role: string;
  readonly label: string;
  readonly scope: string;
  readonly whoAssigns: string;
  readonly notes: string;
  readonly icon: LucideIcon;
  readonly accent: string;
}

interface MigrationStep {
  readonly title: string;
  readonly description: string;
  readonly files: readonly string[];
}

/* ------------------------------------------------------------------ */
/*  Données — PlatformRole                                             */
/* ------------------------------------------------------------------ */

const PLATFORM_ROLE_ROWS: readonly RoleRow[] = [
  {
    role: "user",
    label: "Utilisateur",
    scope:
      "Accès standard : lecture publique, gestion de son propre profil, actions autorisées à tout compte connecté. Rôle par défaut à l'inscription.",
    whoAssigns:
      "Automatique (Better Auth) à la création du compte. Aucune action manuelle requise.",
    notes:
      'Valeur stockée en base : "user". Fallback de toPlatformRole() si la valeur en base est invalide.',
    icon: Users,
    accent: "chart-1",
  },
  {
    role: "admin",
    label: "Administrateur",
    scope:
      "Accès aux outils d'administration métier (validation de contenus, modération, gestion des membres d'une organisation). Ne peut pas gérer les rôles plateforme.",
    whoAssigns:
      "Attribué par un superAdmin (ou un admin déjà en place selon la politique retenue). Journalisé.",
    notes:
      'Valeur stockée en base : "admin". Utilisé par requirePlatformRole(["admin", "superAdmin"]) via requirePlatformRank.',
    icon: UserCog,
    accent: "chart-2",
  },
  {
    role: "superAdmin",
    label: "Super-administrateur",
    scope:
      "Accès total à la plateforme : gestion des rôles plateforme, règles globales, audit, conformité. Rôle à périmètre étroit mais haute responsabilité.",
    whoAssigns:
      "Attribué par un autre superAdmin. En bootstrap (aucun superAdmin existant), l'auto-promotion est autorisée via /super-admin/user-manager.",
    notes:
      'Valeur stockée en base : "superAdmin". Anti-lockout : le dernier superAdmin actif ne peut pas être rétrogradé.',
    icon: ShieldCheck,
    accent: "chart-4",
  },
];

/* ------------------------------------------------------------------ */
/*  Données — étapes de migration WorkerRole                           */
/* ------------------------------------------------------------------ */

const MIGRATION_STEPS: readonly MigrationStep[] = [
  {
    title: "1. Étendre le schéma Prisma",
    description:
      "Créer une table dédiée aux rôles métier, distincte de User.platformRole. Modèle recommandé : un modèle Worker (ou Membership) qui lie un User à une organisation avec un rôle contextuel. Ne JAMAIS stocker un rôle métier dans User.platformRole.",
    files: [
      "prisma/schema.prisma — ajouter les modèles Organization, Worker (ou Membership), WorkerRole (enum String)",
    ],
  },
  {
    title: "2. Déclarer les rôles métier dans config/roles.ts",
    description:
      "Ajouter un tableau WORKER_ROLES (valeurs), WORKER_ROLE_LABELS (libellés UI) et un workerRoleSchema Zod, sur le modèle de PLATFORM_ROLES. Séparer clairement les deux espaces de noms : un PlatformRole n'est pas un WorkerRole.",
    files: [
      "config/roles.ts — WORKER_ROLES, WORKER_ROLE_LABELS, WORKER_ROLE_RANK, workerRoleSchema",
    ],
  },
  {
    title: "3. Étendre Better Auth",
    description:
      "Better Auth ne connaît QUE User.platformRole. Pour exposer les rôles métier en session, il faut : (a) ajouter un additionalField workerRoles (ou memberships) dans la config auth.ts via user.additionalFields, (b) alimenter ce champ via un hook databaseHooks.user.create/update ou un plugin custom qui joint la table Worker, (c) ou exposer un endpoint dédié /api/auth/worker-roles que les Server Actions interrogent. Aucune de ces options ne modifie le schéma Better Auth natif : tout passe par la config.",
    files: [
      "lib/auth/auth.ts — user.additionalFields.workerRoles + databaseHooks",
      "lib/auth/rbac.ts — helpers requireWorkerRole(orgId, role) et hasWorkerRole(userId, orgId, role)",
    ],
  },
  {
    title: "4. Mettre à jour les helpers et validations",
    description:
      "Étendre lib/auth/rbac.ts avec requireWorkerRole(organizationId, role) et requirePlatformRank(minimum) déjà existant. Ajouter les validations Zod dans lib/validations/worker.ts. Les Server Actions qui touchent aux rôles métier doivent TOUTES passer par ces helpers — aucune lecture directe de la table Worker dans l'UI.",
    files: [
      "lib/auth/rbac.ts — requireWorkerRole, hasWorkerRole",
      "lib/validations/worker.ts — workerRoleSchema, membershipSchema",
    ],
  },
  {
    title: "5. Brancher l'UI et les routes",
    description:
      "Ajouter les pages de gestion des membres d'organisation (ex. /back-studio/organizations/[slug]/members) avec un sélecteur de WorkerRole. Ne PAS réutiliser UsersTable (qui gère PlatformRole) : créer un MembersTable dédié. Mettre à jour dataNav.ts pour exposer les nouvelles pages d'entrée.",
    files: [
      "app/back-studio/organizations/[slug]/members/page.tsx",
      "components/organization/MembersTable.tsx",
      "components/layout/header/nav/dataNav.ts — brancher la page d'entrée",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Sous-composants                                                    */
/* ------------------------------------------------------------------ */

function RoleCard({ row }: { readonly row: RoleRow }) {
  const Icon = row.icon;
  const accent = row.accent;

  return (
    <Card
      className="relative h-full overflow-hidden border-border/60"
      style={{ "--accent": `var(--${accent})` } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-70"
        style={{
          background: `linear-gradient(90deg, var(--${accent}), transparent)`,
        }}
      />
      <CardHeader className="flex flex-row items-start gap-3">
        <div
          className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-md"
          style={{
            background: `linear-gradient(135deg, var(--${accent}), color-mix(in oklab, var(--${accent}) 60%, black))`,
          }}
        >
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">{row.label}</CardTitle>
          <CardDescription className="mt-0.5 font-mono text-xs text-muted-foreground">
            {row.role}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-foreground/80">
          {row.scope}
        </p>
        <dl className="space-y-2 text-xs">
          <div>
            <dt className="font-semibold text-foreground">
              Qui l&apos;attribue ?
            </dt>
            <dd className="text-muted-foreground">{row.whoAssigns}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Notes techniques</dt>
            <dd className="text-muted-foreground">{row.notes}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function RcbaPage() {
  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-muted/30">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-chart-4/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-12 size-96 rounded-full bg-chart-2/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <KeyRound className="size-3.5 text-chart-4" aria-hidden />
            Modèle RBAC · Genesis
          </span>

          <h1 className="mt-5 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-4 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Rôles plateforme et rôles métier
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Deux espaces de noms distincts : <strong>PlatformRole</strong>{" "}
            (global, natif Better Auth) et <strong>WorkerRole</strong>{" "}
            (contextuel, à venir, stocké hors de <code>User</code>). Comprendre
            cette séparation est la clé d&apos;une évolution propre.
          </p>
        </div>
      </section>

      {/* PlatformRole */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              1. PlatformRole — rôle global
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Stocké dans <code>User.platformRole</code> (String). Validé par{" "}
              <code>platformRoleSchema</code>. C&apos;est le seul rôle que
              Better Auth connaît nativement.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {PLATFORM_ROLE_ROWS.map((row) => (
              <RoleCard key={row.role} row={row} />
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/30">
                <tr>
                  <th className="px-4 py-3 font-semibold text-foreground">
                    Fichier
                  </th>
                  <th className="px-4 py-3 font-semibold text-foreground">
                    Rôle dans le modèle
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/40">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    config/roles.ts
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Source de vérité : PLATFORM_ROLES, PLATFORM_ROLE_LABELS,
                    PLATFORM_ROLE_RANK, platformRoleSchema.
                  </td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    lib/auth/rbac.ts
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Gardes serveur : requireSession, requirePlatformRole,
                    requirePlatformRank, requireSuperAdmin.
                  </td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    lib/auth/auth.ts
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Config Better Auth. Expose platformRole en session via
                    additionalFields si nécessaire.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    app/super-admin/user-manager/
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    UI de gestion : liste + select de rôle + Server Action
                    updateUserPlatformRoleAction.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* WorkerRole */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              2. WorkerRole — rôle métier (à venir)
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Un rôle <em>contextuel</em>, lié à une organisation. Un même
              utilisateur peut être <code>owner</code> d&apos;un commerce et{" "}
              <code>member</code> d&apos;un autre. Ces rôles ne doivent{" "}
              <strong>jamais</strong> être stockés dans{" "}
              <code>User.platformRole</code>.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-border/60">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-chart-3/15 text-chart-3">
                  <Building2 className="size-4" aria-hidden />
                </div>
                <CardTitle className="text-sm">Modèle Prisma cible</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground">
                  {`model Organization {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  workers   Worker[]
}

model Worker {
  id             String   @id @default(cuid())
  userId         String
  organizationId String
  role           String   // ex. "owner" | "manager" | "member"
  createdAt      DateTime @default(now())

  user         User         @relation(fields: [userId], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id])

  @@unique([userId, organizationId])
}`}
                </pre>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-chart-1/15 text-chart-1">
                  <Cog className="size-4" aria-hidden />
                </div>
                <CardTitle className="text-sm">
                  Impact sur Better Auth
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Better Auth ne lit <strong>que</strong>{" "}
                  <code>User.platformRole</code> par défaut. Pour exposer les
                  rôles métier en session, il faut <strong>étendre</strong> la
                  config (sans modifier le schéma natif) :
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-xs">
                  <li>
                    <code>user.additionalFields.workerRoles</code> dans{" "}
                    <code>lib/auth/auth.ts</code> — champ tableau de chaînes.
                  </li>
                  <li>
                    <code>databaseHooks.user.create</code> /{" "}
                    <code>databaseHooks.user.update</code> — joint la table{" "}
                    <code>Worker</code> pour alimenter ce champ.
                  </li>
                  <li>
                    Ou endpoint dédié <code>/api/auth/worker-roles</code>{" "}
                    interrogé par les Server Actions.
                  </li>
                  <li>
                    Dans tous les cas : <strong>aucun</strong> champ{" "}
                    <code>workerRoles</code> ne doit être ajouté à{" "}
                    <code>User</code> en Prisma — le rôle métier vit dans{" "}
                    <code>Worker</code>.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Qui attribue quoi */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              3. Qui attribue quoi
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Règles d&apos;attribution. La cohérence entre UI et serveur est
              obligatoire : chaque règle côté client doit avoir son équivalent
              dans les Server Actions.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="h-full border-border/60">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-muted text-foreground">
                  <Users className="size-4" aria-hidden />
                </div>
                <CardTitle className="text-sm">PlatformRole</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p>
                  <strong>user</strong> : automatique à la création.
                </p>
                <p>
                  <strong>admin</strong> : par un superAdmin.
                </p>
                <p>
                  <strong>superAdmin</strong> : par un autre superAdmin, ou
                  auto-promotion en bootstrap (aucun superAdmin existant).
                </p>
              </CardContent>
            </Card>

            <Card className="h-full border-border/60">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-muted text-foreground">
                  <Building2 className="size-4" aria-hidden />
                </div>
                <CardTitle className="text-sm">WorkerRole</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p>
                  Toujours attribué <strong>dans une organisation</strong>, par
                  un <code>owner</code> de cette organisation ou par un{" "}
                  <code>superAdmin</code>.
                </p>
                <p className="mt-2">
                  Un PlatformRole ne donne <strong>pas</strong> accès aux
                  organisations dont l&apos;utilisateur n&apos;est pas membre.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full border-border/60">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-muted text-foreground">
                  <BadgeCheck className="size-4" aria-hidden />
                </div>
                <CardTitle className="text-sm">Journalisation</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p>
                  Toute attribution de rôle (platform ou worker) doit être
                  journalisée : acteur, cible, ancien rôle, nouveau rôle,
                  horodatage, organisation (si worker).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Garde-fous */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              4. Garde-fous
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Empêcher la perte d&apos;accès administrateur et les
              auto-promotions abusives.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-border/60">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-chart-4/15 text-chart-4">
                  <Lock className="size-4" aria-hidden />
                </div>
                <CardTitle className="text-sm">Anti-lockout</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Le <strong>dernier superAdmin actif</strong> ne peut pas être
                  rétrogradé (ni en <code>admin</code>, ni en <code>user</code>
                  ). Règle appliquée côté client (<code>UsersTable</code>){" "}
                  <strong>et</strong> côté serveur (
                  <code>updateUserPlatformRoleAction</code>).
                </p>
                <p className="mt-2 text-xs">
                  Dès qu&apos;un second superAdmin existe, le premier redevient
                  modifiable.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-chart-2/15 text-chart-2">
                  <ListChecks className="size-4" aria-hidden />
                </div>
                <CardTitle className="text-sm">Anti-auto-promotion</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Hors bootstrap, un utilisateur ne peut pas modifier son propre
                  rôle plateforme. En bootstrap (aucun superAdmin), la règle est
                  levée <strong>uniquement</strong> pour permettre la création
                  du premier superAdmin.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Procédure de migration */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              5. Procédure de migration vers WorkerRole
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cinq étapes ordonnées. Chaque étape est indépendante et peut être
              livrée séparément, sans casser l&apos;existant.
            </p>
          </header>

          <ol className="space-y-4">
            {MIGRATION_STEPS.map((step) => (
              <li
                key={step.title}
                className="rounded-2xl border border-border/60 bg-card p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-chart-1 to-chart-2 text-white">
                    <Layers className="size-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="text-base font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                    <ul className="space-y-1 text-xs">
                      {step.files.map((file) => (
                        <li
                          key={file}
                          className="font-mono text-muted-foreground"
                        >
                          {file}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-gradient-to-br from-chart-1/5 via-chart-2/5 to-chart-4/5 p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Gérer les rôles plateforme
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            La page de gestion des utilisateurs permet d&apos;attribuer les
            PlatformRole. Les WorkerRole seront gérés depuis les pages
            d&apos;organisation, une fois l&apos;étape 1 de la migration livrée.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/super-admin/user-manager" className={buttonVariants()}>
              Gérer les PlatformRole
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/super-admin"
              className={buttonVariants({ variant: "outline" })}
            >
              Documentation super-admin
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
