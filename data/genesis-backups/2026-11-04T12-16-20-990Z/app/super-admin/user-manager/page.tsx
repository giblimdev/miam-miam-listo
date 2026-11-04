/*
path :           app/super-admin/user-manager/page.tsx
tag :            ["super-admin", "users", "page", "platform-role", "rbac", "bootstrap"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de gestion des utilisateurs pour le super-admin.
                 Sync page + Suspense ; la lecture des utilisateurs est
                 isolée dans un composant async. Affiche un tableau
                 responsive (liste sur mobile, table sur desktop) avec,
                 pour chaque utilisateur : nom, email, rôle plateforme
                 (badge coloré), date d'inscription, et un sélecteur de
                 rôle pour changer le rôle plateforme. Les mutations
                 passent par updateUserPlatformRoleAction (Server Action).

                 AUCUNE garde d'accès côté page : la page est accessible
                 à tout utilisateur connecté pour permettre le bootstrap
                 (création du premier super-admin). C'est listUsersAction()
                 qui décide de ce qu'elle renvoie (voir actions.ts). Si tu
                 veux plus tard restreindre l'accès, fais-le dans l'action,
                 pas ici.

                 Un bandeau "mode initialisation" est affiché tant
                 qu'aucun super-admin n'existe en base (via
                 countSuperAdminsAction) pour expliquer à l'utilisateur
                 connecté comment créer le premier super-admin.

flow:            Sync page → <Suspense fallback=<UsersSkeleton />> →
                 <UsersSection /> async → Promise.all([
                   listUsersAction(),
                   countSuperAdminsAction(),
                 ]) → rend <BootstrapBanner /> si count === 0, puis
                 <UsersTable users canBootstrap />. UsersTable (client)
                 gère le select de rôle → updateUserPlatformRoleAction
                 → toast + router.refresh().

ecosystem:       SuperAdmin = [
                   "@/app/super-admin/page.tsx",
                   "@/app/super-admin/user-manager/UsersTable.tsx",
                   "@/app/super-admin/user-manager/actions.ts",
                   "@/app/super-admin/user-manager/page.tsx",
                   "@/config/roles.ts",
                   "@/lib/actions/result.ts",
                   "@/lib/auth/rbac.ts",
                   "@/lib/prisma.ts",
                 ]

relatedFiles:    ["@/app/super-admin/user-manager/actions.ts",
                  "@/app/super-admin/user-manager/UsersTable.tsx",
                  "@/config/roles.ts"]

imports:         ["next", "react", "lucide-react",
                  "@/app/super-admin/user-manager/actions",
                  "@/app/super-admin/user-manager/UsersTable",
                  "@/components/ui/skeleton"]

exports:         ["default SuperAdminUsersPage", "metadata"]

useBy:           []

userStories:     ["*en tant que super-admin je veux gérer les rôles plateforme des utilisateurs",
                  "*en tant que premier utilisateur je veux pouvoir créer le premier super-admin"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldAlert, Sparkles } from "lucide-react";

import {
  countSuperAdminsAction,
  listUsersAction,
} from "@/app/super-admin/user-manager/actions";
import { UsersTable } from "@/app/super-admin/user-manager/UsersTable";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Utilisateurs — Super-admin",
  description:
    "Gestion des rôles plateforme des utilisateurs. Accessible à tout utilisateur connecté tant qu'aucun super-administrateur n'existe (mode initialisation).",
};

/* ------------------------------------------------------------------ */
/*  Page (sync)                                                        */
/* ------------------------------------------------------------------ */

export default function SuperAdminUsersPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Utilisateurs
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez les rôles plateforme. Seul un super-administrateur peut modifier
          un rôle une fois le premier super-admin créé.
        </p>
      </header>

      <Suspense fallback={<UsersSkeleton />}>
        <UsersSection />
      </Suspense>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bandeau bootstrap                                                  */
/* ------------------------------------------------------------------ */

function BootstrapBanner() {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-chart-2/40 bg-chart-2/10 p-4 text-sm"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-chart-2/20 text-chart-2">
        <Sparkles className="size-4" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-semibold text-foreground">Mode initialisation</p>
        <p className="text-muted-foreground">
          Aucun super-administrateur n&apos;existe encore. Vous pouvez
          promouvoir votre propre compte en super-admin via le sélecteur de rôle
          sur votre ligne. Cette possibilité se ferme automatiquement dès
          qu&apos;un super-admin existe.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section async                                                      */
/* ------------------------------------------------------------------ */

async function UsersSection() {
  const [usersResult, superAdminCount] = await Promise.all([
    listUsersAction(),
    countSuperAdminsAction(),
  ]);

  if (!usersResult.ok) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
      >
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{usersResult.error}</span>
      </div>
    );
  }

  const isBootstrap = superAdminCount === 0;

  return (
    <div className="space-y-4">
      {isBootstrap && <BootstrapBanner />}
      <UsersTable users={usersResult.data} canBootstrap={isBootstrap} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function UsersSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="hidden md:block">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
