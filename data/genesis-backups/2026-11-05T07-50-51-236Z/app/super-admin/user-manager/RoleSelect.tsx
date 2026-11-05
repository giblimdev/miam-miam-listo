/*
path :           app/super-admin/users/RoleSelect.tsx
tag :            ["super-admin", "users", "role", "select", "client", "update", "platform-role"]
projectId:       new-genesis
type:            component
generic:         false

role:            Sélecteur de rôle plateforme pour un utilisateur. Affiche
                 un <NativeSelect> avec les rôles définis dans
                 PLATFORM_ROLES (user / admin / superAdmin) et leurs
                 labels lisibles via PLATFORM_ROLE_LABELS. Au changement,
                 appelle updateUserPlatformRoleAction(userId, role) via
                 useActionResult (toast + rollback optimiste). La prop
                 `disabled` permet au parent de bloquer l'édition (ex.
                 dernier admin, super-admin) — le serveur refuse aussi
                 (anti-lockout, anti-auto-promotion). Le type
                 `currentRole` est PlatformRole (pas string) pour la
                 sécurité de typage.

flow:            Props { userId, currentRole: PlatformRole, disabled? } →
                 useState<PlatformRole>(currentRole) → onChange →
                 optimistic setRole(nextRole) → useActionResult.run(() =>
                 updateUserPlatformRoleAction(userId, nextRole), {
                 successMessage, rollback: () => setRole(previous) }).

ecosystem:       SuperAdmin = [
                   "@/app/super-admin/page.tsx",
                   "@/app/super-admin/users/actions.ts",
                   "@/app/super-admin/users/page.tsx",
                   "@/app/super-admin/users/RoleSelect.tsx",
                   "@/config/roles.ts",
                   "@/lib/actions/result.ts",
                   "@/lib/auth/rbac.ts",
                   "@/lib/prisma.ts",
                 ]

relatedFiles:    ["@/app/super-admin/users/actions.ts",
                  "@/hooks/useActionResult.ts",
                  "@/config/roles.ts"]

imports:         ["react",
                  "@/app/super-admin/users/actions",
                  "@/config/roles.ts",
                  "@/components/ui/native-select",
                  "@/hooks/useActionResult"]

exports:         ["RoleSelect", "RoleSelectProps"]

useBy:           ["@/app/super-admin/users/page.tsx"]

userStories:     ["*en tant que super-administrateur je veux changer le rôle plateforme d'un utilisateur"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState + useActionResult.

import { useState } from "react";

import { updateUserPlatformRoleAction } from "@/app/super-admin/user-manager/actions";
import {
  PLATFORM_ROLES,
  PLATFORM_ROLE_LABELS,
  type PlatformRole,
} from "@/config/roles";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { useActionResult } from "@/hooks/useActionResult";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface RoleSelectProps {
  readonly userId: string;
  readonly currentRole: PlatformRole;
  readonly disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function RoleSelect({
  userId,
  currentRole,
  disabled = false,
}: RoleSelectProps) {
  const [role, setRole] = useState<PlatformRole>(currentRole);
  const { run, isPending } = useActionResult();

  function handleChange(nextRole: string) {
    /* Cast sécurisé : la valeur vient d'un <NativeSelect> alimenté par
       PLATFORM_ROLES, donc nextRole est nécessairement un PlatformRole. */
    const typedRole = nextRole as PlatformRole;
    const previous = role;
    setRole(typedRole);

    run(() => updateUserPlatformRoleAction(userId, typedRole), {
      successMessage: `Rôle mis à jour : ${PLATFORM_ROLE_LABELS[typedRole]}.`,
      rollback: () => setRole(previous),
    });
  }

  return (
    <NativeSelect
      value={role}
      onChange={(e) => handleChange(e.target.value)}
      disabled={disabled || isPending}
      className="w-40"
      aria-label="Rôle plateforme de l'utilisateur"
    >
      {PLATFORM_ROLES.map((r) => (
        <NativeSelectOption key={r} value={r}>
          {PLATFORM_ROLE_LABELS[r]}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
