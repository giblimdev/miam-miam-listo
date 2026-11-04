/*
path :           app/admin/users/RoleSelect.tsx
tag :            ["admin", "users", "role", "select", "client", "update"]
projectId:       new-genesis
type :           component
generic:         false

role:            Sélecteur de rôle pour un utilisateur. Affiche un
                 <select> avec "Utilisateur" / "Administrateur". Au
                 changement, appelle updateUserRoleAction(userId, role)
                 puis toast + router.refresh. La prop `disabled` permet
                 au parent de bloquer l'édition (ex. dernier admin) — le
                 serveur refuse aussi (anti-lockout).

flow:            Props { userId, currentRole, disabled? } →
                 useState(role) → onChange → startTransition →
                 updateUserRoleAction → succès : toast + refresh →
                 erreur : rollback + toast.

ecosystem:       Admin = [
                   "@/app/admin/users/actions.ts",
                   "@/app/admin/users/page.tsx",
                   "@/app/admin/users/RoleSelect.tsx",
                 ]

relatedFiles:    ["@/app/admin/users/actions.ts"]

imports:         ["react", "next/navigation", "sonner",
                  "@/app/admin/users/actions",
                  "@/components/ui/native-select"]

exports:         ["RoleSelect", "RoleSelectProps"]

useBy:           ["@/app/admin/users/page.tsx"]

userStories:     ["*en tant qu'administrateur je veux changer le rôle d'un utilisateur"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, useTransition, router.refresh, toast.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateUserRoleAction } from "@/app/admin/users/actions";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

export interface RoleSelectProps {
  readonly userId: string;
  readonly currentRole: string;
  readonly disabled?: boolean;
}

export function RoleSelect({
  userId,
  currentRole,
  disabled = false,
}: RoleSelectProps) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [isPending, startTransition] = useTransition();

  function handleChange(nextRole: string) {
    const previous = role;
    setRole(nextRole);

    startTransition(async () => {
      const result = await updateUserRoleAction(userId, nextRole);
      if (!result.ok) {
        setRole(previous);
        toast.error(result.error);
        return;
      }
      toast.success(`Rôle mis à jour : ${nextRole}.`);
      router.refresh();
    });
  }

  return (
    <NativeSelect
      value={role}
      onChange={(e) => handleChange(e.target.value)}
      disabled={disabled || isPending}
      className="w-32"
      aria-label="Rôle de l'utilisateur"
    >
      <NativeSelectOption value="user">Utilisateur</NativeSelectOption>
      <NativeSelectOption value="admin">Administrateur</NativeSelectOption>
    </NativeSelect>
  );
}