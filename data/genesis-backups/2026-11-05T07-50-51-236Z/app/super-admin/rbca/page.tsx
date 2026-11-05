/*
path :           app/super-admin/rbca/page.tsx
tag :            ["super-admin", "rbca", "rbac", "platform-role", "documentation", "worker-role", "prisma"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de documentation du modèle RBAC de Genesis. Explique
                 la séparation entre :
                 1) PlatformRole (user / admin / dev / superAdmin) — rôle
                    GLOBAL de l'utilisateur sur la plateforme, stocké dans
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

                 Source de vérité : les rôles affichés proviennent
                 DIRECTEMENT de PLATFORM_ROLES (@/config/roles.ts). Ajouter
                 un rôle dans config/roles.ts le fait apparaître ici
                 automatiquement (aucune duplication à maintenir). Les
                 contenus rédactionnels (périmètre, qui l'attribue, notes,
                 icône, accent) sont portés par un Record<PlatformRole,
                 RolePresentation> local — le compilateur TypeScript force
                 l'exhaustivité : impossible d'oublier une entrée.

                 Les blocs de code Prisma/Better Auth utilisent le
                 composant @/components/ui/code-block (CodeBlock +
                 CodeBlockHeader + CodeBlockTitle + CodeBlockActions +
                 CodeBlockCopyButton + CodeBlockContent), au lieu d'un
                 <pre> brut. Cela fournit un bouton « Copier » accessible
                 (aria-label, aria-live), un scroll horizontal fluide
                 (scroll-fade-x), et une cohérence visuelle avec le
                 design system.

                 Hiérarchie : superAdmin (3) > dev (2) > admin (1) >
                 user (0). Un superAdmin voit TOUS les items de
                 navigation, quel que soit leur minPlatformRole (règle
                 appliquée par canSee() via hasPlatformRank).

                 Page statique (Server Component) sans fetch ni état.
                 Sert de référence pour toute évolution future du modèle
                 de rôles.

flow:            Server Component pur → rend un wrapper max-w-5xl →
                 Hero (badge, titre, tagline) → section « Les rôles
                 plateforme » (grille dynamique : map sur PLATFORM_ROLES
                 triés par rang → RoleCard pour chaque rôle, avec
                 présentation lue dans ROLE_PRESENTATION[role]) →
                 section « Hiérarchie » (tableau des rangs + règle
                 superAdmin voit tout) → section « PlatformRole en
                 détail » (tableau des fichiers) → section « WorkerRole »
                 (à venir, modèle Prisma rendu via CodeBlock, contraintes,
                 impact Better Auth) → section « Qui attribue quoi »
                 (règles) → section « Garde-fous » (anti-lockout,
                 anti-auto-promotion) → section « Procédure de migration
                 WorkerRole » (5 étapes numérotées) → CTA vers
                 /super-admin/user-manager. Aucun état, aucun effet,
                 aucun fetch.

ecosystem:       SuperAdmin = [
                   "@/app/super-admin/page.tsx",
                   "@/app/super-admin/rbca/page.tsx",
                   "@/app/super-admin/user-manager/UsersTable.tsx",
                   "@/app/super-admin/user-manager/actions.ts",
                   "@/app/super-admin/user-manager/page.tsx",
                   "@/components/ui/code-block.tsx",
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
                  "@/app/super-admin/user-manager/page.tsx",
                  "@/components/layout/header/navTypes.ts",
                  "@/components/ui/code-block.tsx"]

imports:         ["next",
                  "next/link",
                  "lucide-react",
                  "@/config/roles",
                  "@/components/ui/button",
                  "@/components/ui/card",
                  "@/components/ui/code-block"]

exports:         ["default RcbaPage", "metadata"]

useBy:           []

userStories:     ["*en tant que développeur je veux comprendre le modèle RBAC de la plateforme",
                  "*en tant que super-admin je veux savoir comment attribuer les rôles",
                  "*en tant que développeur je veux préparer l'ajout des rôles métier (WorkerRole)"]

status:          wip
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

import {
  PLATFORM_ROLES,
  PLATFORM_ROLE_LABELS,
  PLATFORM_ROLE_RANK,
  type PlatformRole,
} from "@/config/roles";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ui/code-block";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "RBAC — Rôles plateforme et rôles métier",
  description:
    "Modèle de rôles de Genesis : PlatformRole global (user / admin / dev / superAdmin), hiérarchie stricte, rôles métier contextuels (WorkerRole, à venir) et règles d'attribution.",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Présentation éditoriale d'un rôle plateforme. Les valeurs
 * (`role`, `label`, `rank`) sont dérivées de `config/roles.ts` ; ce
 * Record ne porte que les champs rédactionnels propres à la doc.
 */
interface RolePresentation {
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
/*  Contenu des blocs de code                                          */
/* ------------------------------------------------------------------ */

const PRISMA_WORKER_SNIPPET = `model Organization {
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
}`;

/* ------------------------------------------------------------------ */
/*  Présentation par rôle (exhaustif sur PlatformRole)                 */
/* ------------------------------------------------------------------ */

/**
 * Record<PlatformRole, RolePresentation> — le compilateur TypeScript
 * force l'exhaustivité : ajouter un rôle dans PLATFORM_ROLES sans
 * ajouter son entrée ici provoque une erreur de compilation.
 */
const ROLE_PRESENTATION: Record<PlatformRole, RolePresentation> = {
  visitor: {
    scope:
      "Accès public sans compte : consultation du catalogue public, aucune commande, aucun avis, aucun point de fidélité. Rôle de repli pour les sessions non authentifiées.",
    whoAssigns:
      "Aucune attribution : c'est l'état par défaut d'un visiteur non connecté. Aucune ligne User n'est créée en base — visitor n'existe que côté session/app.",
    notes:
      'Valeur stockée en base : "visitor" (si persistée) — rang 0 (le plus bas). N\'apparaît pas dans Better Auth natif (qui ne connaît que user). Utilisé pour filtrer les items de navigation publics via canSee().',
    icon: Users,
    accent: "chart-5",
  },
  user: {
    scope:
      "Accès standard : lecture publique, gestion de son propre profil, actions autorisées à tout compte connecté. Rôle par défaut à l'inscription.",
    whoAssigns:
      "Automatique (Better Auth) à la création du compte. Aucune action manuelle requise.",
    notes:
      'Valeur stockée en base : "user". Rang 0 (le plus bas). Fallback de toPlatformRole() si la valeur en base est invalide.',
    icon: Users,
    accent: "chart-1",
  },
  admin: {
    scope:
      "Accès aux outils d'administration métier (validation de contenus, modération, gestion des membres d'une organisation). Ne peut pas gérer les rôles plateforme.",
    whoAssigns:
      "Attribué par un superAdmin (ou un admin déjà en place selon la politique retenue). Journalisé.",
    notes:
      'Valeur stockée en base : "admin". Rang 1 dans la hiérarchie (au-dessus de user, sous dev et superAdmin).',
    icon: UserCog,
    accent: "chart-2",
  },
  dev: {
    scope:
      "Accès aux outils techniques : Genesis (SelectFiles, CreateFiles, CopyToIA), diagnostics, feature flags, logs applicatifs. Ne peut pas gérer les rôles plateforme ni les règles globales.",
    whoAssigns:
      "Attribué par un superAdmin. Journalisé. Rôle technique, à périmètre étroit.",
    notes:
      "Valeur stockée en base : \"dev\". Rang 2 dans la hiérarchie — sous superAdmin, au-dessus d'admin. Ouvre /genesis sans donner les droits d'administration métier. Voit donc Admin (rang 1 ≤ 2) mais pas Super-admin (rang 3 > 2).",
    icon: Cog,
    accent: "chart-3",
  },
  superAdmin: {
    scope:
      "Accès total à la plateforme : gestion des rôles plateforme, règles globales, audit, conformité. Rôle à périmètre étroit mais haute responsabilité. Voit TOUS les items de navigation, quel que soit leur minPlatformRole.",
    whoAssigns:
      "Attribué par un autre superAdmin. En bootstrap (aucun superAdmin existant), l'auto-promotion est autorisée via /super-admin/user-manager.",
    notes:
      'Valeur stockée en base : "superAdmin". Rang 3 (le plus haut). Anti-lockout : le dernier superAdmin actif ne peut pas être rétrogradé. Règle « voit tout » appliquée par canSee() via hasPlatformRank.',
    icon: ShieldCheck,
    accent: "chart-4",
  },
};

/**
 * Rôles triés par rang croissant (visitor → user → admin → dev → superAdmin).
 * Le tri est dérivé de PLATFORM_ROLE_RANK, donc l'ordre suit
 * automatiquement la hiérarchie définie dans config/roles.ts.
 */
const SORTED_PLATFORM_ROLES: readonly PlatformRole[] = [...PLATFORM_ROLES].sort(
  (a, b) => PLATFORM_ROLE_RANK[a] - PLATFORM_ROLE_RANK[b],
);

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

function RoleCard({
  role,
  presentation,
}: {
  readonly role: PlatformRole;
  readonly presentation: RolePresentation;
}) {
  const Icon = presentation.icon;
  const accent = presentation.accent;
  const label = PLATFORM_ROLE_LABELS[role];
  const rank = PLATFORM_ROLE_RANK[role];

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
          <CardTitle className="text-base">{label}</CardTitle>
          <CardDescription className="mt-0.5 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span>{role}</span>
            <span aria-hidden>·</span>
            <span>rang {rank}</span>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-foreground/80">
          {presentation.scope}
        </p>
        <dl className="space-y-2 text-xs">
          <div>
            <dt className="font-semibold text-foreground">
              Qui l&apos;attribue ?
            </dt>
            <dd className="text-muted-foreground">{presentation.whoAssigns}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Notes techniques</dt>
            <dd className="text-muted-foreground">{presentation.notes}</dd>
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

      {/* Les rôles plateforme — dynamique depuis PLATFORM_ROLES */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Les rôles plateforme
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {SORTED_PLATFORM_ROLES.length} rôles globaux, stockés dans{" "}
              <code>User.platformRole</code> et validés par{" "}
              <code>platformRoleSchema</code>. Liste dérivée de{" "}
              <code>config/roles.ts</code> — ajouter un rôle dans{" "}
              <code>PLATFORM_ROLES</code> le fait apparaître ici
              automatiquement. Triés par rang croissant.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {SORTED_PLATFORM_ROLES.map((role) => (
              <RoleCard
                key={role}
                role={role}
                presentation={ROLE_PRESENTATION[role]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Hiérarchie */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              1. Hiérarchie des rôles plateforme
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              La hiérarchie est <strong>stricte</strong> et repose sur{" "}
              <code>PLATFORM_ROLE_RANK</code>. Un rôle voit tous les items de
              navigation dont le seuil (<code>minPlatformRole</code>) est{" "}
              <strong>inférieur ou égal</strong> à son rang.
            </p>
          </header>

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/30">
                <tr>
                  <th className="px-4 py-3 font-semibold text-foreground">
                    Rôle
                  </th>
                  <th className="px-4 py-3 font-semibold text-foreground">
                    Rang
                  </th>
                  <th className="px-4 py-3 font-semibold text-foreground">
                    Voit les items de seuil…
                  </th>
                </tr>
              </thead>
              <tbody>
                {SORTED_PLATFORM_ROLES.map((role) => {
                  const rank = PLATFORM_ROLE_RANK[role];
                  const visibleSeuils = SORTED_PLATFORM_ROLES.filter(
                    (seuil) => PLATFORM_ROLE_RANK[seuil] <= rank,
                  );
                  return (
                    <tr
                      key={role}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {role}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {rank}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {visibleSeuils.join(", ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-xl border border-chart-4/30 bg-chart-4/5 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ShieldCheck className="size-4 text-chart-4" aria-hidden />
              Règle « superAdmin voit tout »
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <code>superAdmin</code> a le rang le plus élevé (4). Via{" "}
              <code>hasPlatformRank(role, minimum)</code> — qui teste{" "}
              <code>RANK[role] &gt;= RANK[minimum]</code> —{" "}
              <code>superAdmin</code> satisfait <strong>tous</strong> les seuils
              possibles. Il voit donc <strong>tous</strong> les items de
              navigation, quel que soit leur <code>minPlatformRole</code>. Cette
              règle est centralisée dans <code>canSee()</code> (
              <code>components/layout/header/navTypes.ts</code>) et partagée par{" "}
              <code>Header.tsx</code> et <code>MainNav.tsx</code> — pas de
              duplication, pas d&apos;incohérence desktop/mobile.
            </p>
          </div>
        </div>
      </section>

      {/* PlatformRole — tableau des fichiers */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              2. PlatformRole — rôle global
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Source de vérité et gardes serveur du modèle PlatformRole.
            </p>
          </header>

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
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
                    PLATFORM_ROLE_RANK, platformRoleSchema, hasPlatformRank.
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
                    components/layout/header/navTypes.ts
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Filtrage de navigation : canSee(item, platformRole) — source
                    unique partagée par Header.tsx et MainNav.tsx.
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
              3. WorkerRole — rôle métier (à venir)
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
                <CodeBlock>
                  <CodeBlockHeader>
                    <CodeBlockTitle>schema.prisma</CodeBlockTitle>
                    <CodeBlockActions>
                      <CodeBlockCopyButton value={PRISMA_WORKER_SNIPPET} />
                    </CodeBlockActions>
                  </CodeBlockHeader>
                  <CodeBlockContent>{PRISMA_WORKER_SNIPPET}</CodeBlockContent>
                </CodeBlock>
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
              4. Qui attribue quoi
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
                  <strong>admin</strong> et <strong>dev</strong> : par un
                  superAdmin.
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
              5. Garde-fous
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
                  rétrogradé (ni en <code>dev</code>, ni en <code>admin</code>,
                  ni en <code>user</code>). Règle appliquée côté client (
                  <code>UsersTable</code>) <strong>et</strong> côté serveur (
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
              6. Procédure de migration vers WorkerRole
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
