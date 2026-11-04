/*
path :           app/super-admin/users/UsersTable.tsx
tag :            ["super-admin", "users", "table", "platform-role", "client"]
projectId:       new-genesis
type :           component
generic:         false

role:            Tableau responsive des utilisateurs pour la page
                 super-admin/users. Affiche une liste (mobile) ou une
                 table (desktop) avec nom, email, rôle plateforme (badge
                 coloré) et un <NativeSelect> pour changer le rôle. Le
                 select est désactivé pour soi-même et pour les
                 super-admin (anti-auto-promotion et anti-rétrogradation).
                 Les mutations passent par updateUserPlatformRoleAction
                 (Server Action) protégée par requireSuperAdmin.

flow:            Reçoit users (UserListItem[]) → pour chaque user, rend
                 une ligne avec NativeSelect (role) → onChange →
                 updateUserPlatformRoleAction(user.id, newRole) → toast
                 succès/erreur → router.refresh().

ecosystem:       SuperAdmin = [
                   "@/app/super-admin/page.tsx",
                   "@/app/super-admin/users/actions.ts",
                   "@/app/super-admin/users/page.tsx",
                   "@/app/super-admin/users/UsersTable.tsx",
                   "@/config/roles.ts",
                   "@/lib/actions/result.ts",
                   "@/lib/auth/rbac.ts",
                   "@/lib/prisma.ts",
                 ]

relatedFiles:    ["@/app/super-admin/users/actions.ts",
                  "@/config/roles.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/super-admin/users/actions",
                  "@/config/roles.ts",
                  "@/components/ui/native-select"]

exports:         ["UsersTable", "UsersTableProps"]

useBy:           ["@/app/super-admin/users/page.tsx"]

userStories:     ["*en tant que super-admin je veux changer le rôle plateforme d'un utilisateur"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (pending), onChange, toast, router.refresh.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  PLATFORM_ROLES,
  PLATFORM_ROLE_LABELS,
  type PlatformRole,
} from "@/config/roles";
import {
  updateUserPlatformRoleAction,
  type UserListItem,
} from "@/app/super-admin/user-manager/actions";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface UsersTableProps {
  readonly users: readonly UserListItem[];
}

/* ------------------------------------------------------------------ */
/*  Badge de rôle                                                      */
/* ------------------------------------------------------------------ */

const ROLE_BADGE_CLASS: Record<PlatformRole, string> = {
  user: "bg-muted/60 text-muted-foreground",
  admin: "bg-chart-3/15 text-chart-3",
  superAdmin: "bg-chart-4/15 text-chart-4",
};

function RoleBadge({ role }: { readonly role: PlatformRole }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_BADGE_CLASS[role]}`}
    >
      {PLATFORM_ROLE_LABELS[role]}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleRoleChange(userId: string, rawRole: string) {
    const platformRole = rawRole as PlatformRole;
    setPendingId(userId);

    const result = await updateUserPlatformRoleAction(userId, platformRole);

    setPendingId(null);

    if (result.ok) {
      toast.success("Rôle mis à jour.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Aucun utilisateur pour l&apos;instant.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop : table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border/60 bg-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30">
            <tr>
              <th className="px-4 py-3 font-semibold text-foreground">Nom</th>
              <th className="px-4 py-3 font-semibold text-foreground">Email</th>
              <th className="px-4 py-3 font-semibold text-foreground">
                Rôle plateforme
              </th>
              <th className="px-4 py-3 font-semibold text-foreground">
                Changer
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSuperAdmin = user.platformRole === "superAdmin";
              const isPending = pendingId === user.id;

              return (
                <tr
                  key={user.id}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.platformRole} />
                  </td>
                  <td className="px-4 py-3">
                    {isSuperAdmin ? (
                      <span className="text-xs italic text-muted-foreground">
                        Non modifiable
                      </span>
                    ) : (
                      <NativeSelect
                        value={user.platformRole}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        disabled={isPending}
                        aria-label={`Changer le rôle de ${user.name}`}
                      >
                        {PLATFORM_ROLES.map((role) => (
                          <NativeSelectOption key={role} value={role}>
                            {PLATFORM_ROLE_LABELS[role]}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile : cartes */}
      <div className="space-y-3 md:hidden">
        {users.map((user) => {
          const isSuperAdmin = user.platformRole === "superAdmin";
          const isPending = pendingId === user.id;

          return (
            <div
              key={user.id}
              className="rounded-2xl border border-border/60 bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <RoleBadge role={user.platformRole} />
              </div>

              {!isSuperAdmin && (
                <div className="mt-3">
                  <NativeSelect
                    value={user.platformRole}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={isPending}
                    aria-label={`Changer le rôle de ${user.name}`}
                  >
                    {PLATFORM_ROLES.map((role) => (
                      <NativeSelectOption key={role} value={role}>
                        {PLATFORM_ROLE_LABELS[role]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              )}

              {isSuperAdmin && (
                <p className="mt-3 text-xs italic text-muted-foreground">
                  Rôle non modifiable depuis cette page.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
