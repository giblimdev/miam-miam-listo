/*
path :           app/super-admin/user-manager/UsersTable.tsx
tag :            ["super-admin", "users", "table", "platform-role", "client", "anti-lockout"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Tableau responsive des utilisateurs. Affiche une liste
                 (mobile) ou une table (desktop) avec nom, email, rôle
                 plateforme (badge coloré) et un <NativeSelect> pour
                 changer le rôle. Les mutations passent par
                 updateUserPlatformRoleAction (Server Action).

                 SEULE restriction : le DERNIER super-admin actif ne peut
                 pas être rétrogradé (anti-lockout — sinon plus personne
                 ne peut gérer les rôles). Tous les autres comptes sont
                 modifiables, y compris les autres super-admins et
                 l'utilisateur courant.

                 La détection "dernier super-admin" est calculée côté
                 client à partir de la liste reçue : un super-admin est
                 verrouillé si c'est le seul dont platformRole ===
                 "superAdmin" dans `users`.

                 Badges : ROLE_BADGE_CLASS est un Record<PlatformRole,
                 string> exhaustif — ajouter un rôle dans
                 PLATFORM_ROLES (@/config/roles.ts) force l'ajout de son
                 badge ici (erreur de compilation sinon). Le sélecteur
                 itère sur PLATFORM_ROLES et affiche
                 PLATFORM_ROLE_LABELS[role], donc un nouveau rôle
                 apparaît automatiquement.

flow:            Reçoit users (UserListItem[]) → calcule
                 superAdminCount + lastSuperAdminId → pour chaque user,
                 rend une ligne avec NativeSelect (désactivé UNIQUEMENT
                 si user.id === lastSuperAdminId) → onChange →
                 updateUserPlatformRoleAction(user.id, newRole) → toast
                 succès/erreur → router.refresh().

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
                  "@/config/roles.ts"]

imports:         ["react", "next/navigation", "sonner",
                  "@/app/super-admin/user-manager/actions",
                  "@/config/roles.ts",
                  "@/components/ui/native-select"]

exports:         ["UsersTable", "UsersTableProps"]

useBy:           ["@/app/super-admin/user-manager/page.tsx"]

userStories:     ["*en tant qu'utilisateur connecté je veux changer le rôle plateforme d'un utilisateur",
                  "*en tant que super-admin je veux empêcher la rétrogradation du dernier super-admin"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (pendingId), onChange, toast, router.refresh.

import { useMemo, useState } from "react";
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
  /**
   * id de l'utilisateur courant. Sert uniquement à afficher "(vous)"
   * sur la ligne correspondante. Aucune restriction d'édition n'est
   * appliquée de ce fait.
   */
  readonly currentUserId?: string;
}

/* ------------------------------------------------------------------ */
/*  Badge de rôle                                                      */
/* ------------------------------------------------------------------ */

const ROLE_BADGE_CLASS: Record<PlatformRole, string> = {
  user: "bg-muted/60 text-muted-foreground",
  admin: "bg-chart-3/15 text-chart-3",
  dev: "bg-chart-2/15 text-chart-2",
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

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  /* Détection du dernier super-admin actif (anti-lockout). */
  const { lastSuperAdminId } = useMemo(() => {
    const superAdmins = users.filter((u) => u.platformRole === "superAdmin");
    return {
      lastSuperAdminId: superAdmins.length === 1 ? superAdmins[0]!.id : null,
    };
  }, [users]);

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
              const isPending = pendingId === user.id;
              const isLocked = user.id === lastSuperAdminId;

              return (
                <tr
                  key={user.id}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {user.name}
                    {currentUserId === user.id && (
                      <span className="ml-2 text-[11px] italic text-muted-foreground">
                        (vous)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.platformRole} />
                  </td>
                  <td className="px-4 py-3">
                    {isLocked ? (
                      <span className="text-xs italic text-muted-foreground">
                        Dernier super-admin — non modifiable
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
          const isPending = pendingId === user.id;
          const isLocked = user.id === lastSuperAdminId;

          return (
            <div
              key={user.id}
              className="rounded-2xl border border-border/60 bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {user.name}
                    {currentUserId === user.id && (
                      <span className="ml-2 text-[11px] italic text-muted-foreground">
                        (vous)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <RoleBadge role={user.platformRole} />
              </div>

              {isLocked ? (
                <p className="mt-3 text-xs italic text-muted-foreground">
                  Dernier super-admin — non modifiable
                </p>
              ) : (
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
            </div>
          );
        })}
      </div>
    </>
  );
}