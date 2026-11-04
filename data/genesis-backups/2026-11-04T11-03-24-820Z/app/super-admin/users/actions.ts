/*
path :           app/admin/users/actions.ts
tag :            ["admin", "users", "action", "role", "server-action", "bootstrap"]
projectId:       new-genesis
type :           action
generic:         false

role:            Server Action de mise à jour du rôle d'un utilisateur.
                 Règles d'autorisation :
                 1. Authentification requise (getSession).
                 2. Cas bootstrap : si AUCUN admin n'existe en base,
                    un utilisateur peut se promouvoir LUI-MÊME admin
                    (self-promotion) une seule fois. Cela résout le
                    chicken-and-egg sans faille exploitable : dès le
                    premier admin créé, la règle tombe.
                 3. Cas normal : l'appelant doit être admin pour
                    modifier le rôle de n'importe qui.
                 4. Un admin ne peut pas se rétrograder lui-même s'il
                    est le dernier admin (garde-fou anti-lockout).
                 Validation role ∈ {"user","admin"}. Revalide
                 /admin/users.

                 ⚠️ Depuis la suppression du module Blog, le contrat
                 ActionResult<T> et handleActionError sont importés
                 depuis @/lib/actions/result (module neutre partagé
                 avec Scrum) — plus aucune dépendance à
                 @/app/blog/lib/actions/result.

flow:            updateUserRoleAction(userId, role) → getSession() →
                 si null : erreur → validation role → count admins
                 en base → si 0 admins ET userId === session.user.id :
                 autoriser (bootstrap) → sinon : fetch caller.role →
                 si caller.role !== "admin" : erreur → si caller.id
                 === userId et role === "user" et adminCount <= 1 :
                 erreur "dernier admin" → prisma.user.update →
                 revalidatePath → {ok, data}.

ecosystem:       Admin = [
                   "@/app/admin/users/actions.ts",
                   "@/app/admin/users/page.tsx",
                   "@/app/admin/users/RoleSelect.tsx",
                 ]

relatedFiles:    ["@/lib/prisma.ts",
                  "@/lib/auth/session.ts",
                  "@/lib/actions/result.ts"]

imports:         ["next/cache",
                  "@/lib/prisma",
                  "@/lib/auth/session",
                  "@/lib/actions/result"]

exports:         ["updateUserRoleAction"]

useBy:           ["@/app/admin/users/RoleSelect.tsx"]

userStories:     ["*en tant qu'administrateur je veux changer le rôle d'un utilisateur",
                  "us1100012"]
status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { handleActionError, type ActionResult } from "@/lib/actions/result";

const VALID_ROLES = new Set(["user", "admin"]);

export async function updateUserRoleAction(
  userId: string,
  role: string,
): Promise<ActionResult<null>> {
  try {
    /* 1. Authentification */
    const session = await getSession();
    if (!session?.user) {
      return { ok: false, error: "Authentification requise." };
    }

    /* 2. Validation du rôle cible */
    if (!VALID_ROLES.has(role)) {
      return { ok: false, error: `Rôle invalide : ${role}.` };
    }

    const callerId = session.user.id;
    const isSelf = callerId === userId;

    /* 3. Compter les admins existants (pour bootstrap + anti-lockout) */
    const adminCount = await prisma.user.count({
      where: { role: "admin", deletedAt: null },
    });

    /* 4. Cas bootstrap : aucun admin + self-promotion admin */
    const isBootstrap = adminCount === 0 && isSelf && role === "admin";

    if (!isBootstrap) {
      /* 5. Cas normal : l'appelant doit être admin */
      const caller = await prisma.user.findUnique({
        where: { id: callerId },
        select: { role: true },
      });
      if (caller?.role !== "admin") {
        return { ok: false, error: "Rôle administrateur requis." };
      }

      /* 6. Anti-lockout : dernier admin ne peut pas se rétrograder */
      if (isSelf && role === "user" && adminCount <= 1) {
        return {
          ok: false,
          error:
            "Impossible de retirer le rôle au dernier administrateur. Nommez d'abord un autre admin.",
        };
      }
    }

    /* 7. Mise à jour */
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/admin/users");
    return { ok: true, data: null };
  } catch (error) {
    return handleActionError(error);
  }
}
