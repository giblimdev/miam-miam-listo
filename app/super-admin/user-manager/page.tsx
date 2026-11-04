/*
path :           app/super-admin/user-manager/page.tsx
tag :            ["super-admin", "users", "page", "platform-role", "rbac", "dynamic"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de gestion des utilisateurs. Sync page + Suspense ;
                 la lecture des utilisateurs est isolée dans un composant
                 async qui force le rendu dynamique via connection()
                 AVANT d'appeler listUsersAction() — évite l'erreur
                 "Blocking Route" de Next.js 16 (new Date() interne à
                 Better Auth pendant le prérendu statique).

                 AUCUNE garde d'accès côté page : accessible à tout
                 utilisateur connecté. C'est listUsersAction() qui décide
                 de ce qu'elle renvoie.

flow:            Sync page → <Suspense fallback=<UsersSkeleton />> →
                 <UsersSection /> async → await connection() →
                 Promise.all([listUsersAction(), countSuperAdminsAction()])
                 → rend <UsersTable users />.

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

imports:         ["next", "react", "next/server",
                  "@/app/super-admin/user-manager/actions",
                  "@/app/super-admin/user-manager/UsersTable",
                  "@/components/ui/skeleton"]

exports:         ["default SuperAdminUsersPage", "metadata"]

useBy:           []

userStories:     ["*en tant que super-admin je veux gérer les rôles plateforme des utilisateurs"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";

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
    "Gestion des rôles plateforme des utilisateurs.",
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
          Gérez les rôles plateforme. Tout utilisateur connecté peut modifier
          un rôle.
        </p>
      </header>

      <Suspense fallback={<UsersSkeleton />}>
        <UsersSection />
      </Suspense>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section async                                                      */
/* ------------------------------------------------------------------ */

async function UsersSection() {
  /* Force le rendu dynamique AVANT Better Auth / Prisma.
     Sans ceci, Next.js 16 exécute new Date() de Better Auth pendant le
     prérendu statique et lève "Blocking Route". */
  await connection();

  const [usersResult, superAdminCount] = await Promise.all([
    listUsersAction(),
    countSuperAdminsAction(),
  ]);

  if (!usersResult.ok) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
      >
        {usersResult.error}
      </div>
    );
  }

  const isBootstrap = superAdminCount === 0;

  return (
    <div className="space-y-4">
      {isBootstrap && (
        <div
          role="status"
          className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground"
        >
          Aucun super-administrateur n&apos;existe encore. Vous pouvez
          promouvoir un compte via le sélecteur ci-dessous.
        </div>
      )}
      <UsersTable users={usersResult.data} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function UsersSkeleton() {
  return (
    <div className="space-y-4">
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