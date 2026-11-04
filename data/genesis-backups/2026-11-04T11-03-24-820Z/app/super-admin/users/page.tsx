/*
path :           app/admin/users/page.tsx
tag :            ["admin", "users", "page", "read", "update", "role"]
projectId:       new-genesis
type :           page
generic:         false

role:            Administration utilisateurs. Utilise LoginCTA pour
                 l'anonyme.

flow:            AdminUsersPage (sync) → Suspense → UsersSection
                 async → getSession → si null : <LoginCTA /> →
                 fetch caller.role → si !== "admin" : accès refusé →
                 prisma.user.findMany → rend tableau + RoleSelect.

ecosystem:       Admin = [
                   "@/app/admin/users/actions.ts",
                   "@/app/admin/users/page.tsx",
                   "@/app/admin/users/RoleSelect.tsx",
                 ]

relatedFiles:    ["@/lib/prisma.ts",
                  "@/lib/auth/session.ts",
                  "@/app/blog/lib/actions/result.ts",
                  "@/utils/date.ts",
                  "@/components/auth/LoginCTA.tsx"]

imports:         ["react", "lucide-react",
                  "@/lib/prisma",
                  "@/lib/auth/session",
                  "@/components/auth/LoginCTA",
                  "@/components/ui/skeleton",
                  "@/app/admin/users/RoleSelect",
                  "@/utils/date"]

exports:         ["default AdminUsersPage"]

useBy:           []

userStories:     ["*en tant qu'administrateur je veux gérer les utilisateurs et leurs rôles"]

status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { Shield, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleSelect } from "@/app/super-admin/rcba/RoleSelect";
import { formatDateShort } from "@/utils/date";

export default function AdminUsersPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-1">
            Administration
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <Users className="size-5 text-chart-1" aria-hidden />
            Utilisateurs
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Modifiez le rôle d&apos;un utilisateur. Le dernier administrateur ne
          peut pas être rétrogradé.
        </p>
      </header>

      <Suspense fallback={<UsersSkeleton />}>
        <UsersSection />
      </Suspense>
    </div>
  );
}

async function UsersSection() {
  const session = await getSession();
  if (!session?.user) {
    return (
      <LoginCTA message="Connectez-vous pour accéder à la gestion des utilisateurs." />
    );
  }

  const caller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (caller?.role !== "admin") {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
        <Shield className="mx-auto mb-2 size-8 text-destructive" aria-hidden />
        <p className="text-sm text-destructive">
          Accès réservé aux administrateurs.
        </p>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <table className="w-full">
          <thead className="border-b border-border/60 bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nom
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rôle
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Inscrit le
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isLastAdmin = user.role === "admin" && adminCount <= 1;
              return (
                <tr
                  key={user.id}
                  className="border-b border-border/40 last:border-b-0"
                >
                  <td className="px-4 py-3 text-sm text-foreground">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <RoleSelect
                      userId={user.id}
                      currentRole={user.role ?? "user"}
                      disabled={isLastAdmin}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDateShort(user.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Aucun utilisateur en base.
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {adminCount} administrateur{adminCount > 1 ? "s" : ""} actif
        {adminCount > 1 ? "s" : ""} · le dernier ne peut pas être rétrogradé.
      </p>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
