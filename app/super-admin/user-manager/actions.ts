/*
path :           app/super-admin/user-manager/actions.ts
tag :            ["super-admin", "users", "actions", "platform-role", "no-restriction"]
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Actions de gestion des utilisateurs. AUCUNE
                 restriction de rôle : tout utilisateur connecté peut
                 lister les utilisateurs et changer un rôle plateforme.
                 Seule la session est exigée (requireSession).

                 Les garde-fous anti-auto-promotion, anti-rétrogradation
                 et anti-création de super-admin supplémentaire ont été
                 SUPPRIMÉS. La seule règle conservée est qu'on ne peut
                 pas changer le rôle d'un utilisateur soft-deleted ou
                 inexistant.

flow:            Chaque action → requireSession() → validation Zod
                 (platformRoleSchema) → prisma.user.findMany/update →
                 revalidatePath("/super-admin/user-manager") →
                 ActionResult<T>.

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

relatedFiles:    ["@/config/roles.ts",
                  "@/lib/auth/rbac.ts",
                  "@/lib/actions/result.ts",
                  "@/lib/prisma.ts",
                  "@/app/super-admin/user-manager/page.tsx",
                  "@/app/super-admin/user-manager/UsersTable.tsx"]

imports:         ["next/cache",
                  "@/config/roles.ts",
                  "@/lib/auth/rbac.ts",
                  "@/lib/actions/result.ts",
                  "@/lib/prisma.ts"]

exports:         ["countSuperAdminsAction", "listUsersAction",
                  "updateUserPlatformRoleAction", "UserListItem"]

useBy:           ["@/app/super-admin/user-manager/page.tsx",
                  "@/app/super-admin/user-manager/UsersTable.tsx"]

userStories:     ["*en tant qu'utilisateur connecté je veux gérer les rôles plateforme"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use server";
// "use server" justifié : Server Actions (mutations + lecture serveur).

import { revalidatePath } from "next/cache";

import { platformRoleSchema, type PlatformRole } from "@/config/roles";
import { requireSession } from "@/lib/auth/rbca";
import { handleActionError, type ActionResult } from "@/lib/actions/result";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface UserListItem {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly image: string | null;
  readonly platformRole: PlatformRole;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toPlatformRole(raw: string): PlatformRole {
  const parsed = platformRoleSchema.safeParse(raw);
  return parsed.success ? parsed.data : "user";
}

async function countSuperAdmins(): Promise<number> {
  return prisma.user.count({
    where: { deletedAt: null, platformRole: "superAdmin" },
  });
}

/* ------------------------------------------------------------------ */
/*  Comptage (utilisé par la page pour le bandeau)                     */
/* ------------------------------------------------------------------ */

export async function countSuperAdminsAction(): Promise<number> {
  return countSuperAdmins();
}

/* ------------------------------------------------------------------ */
/*  Lecture : lister les utilisateurs                                  */
/* ------------------------------------------------------------------ */

export async function listUsersAction(): Promise<
  ActionResult<readonly UserListItem[]>
> {
  try {
    /* Session obligatoire — AUCUN contrôle de rôle. */
    await requireSession();

    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: [{ platformRole: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        platformRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const items: UserListItem[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      platformRole: toPlatformRole(user.platformRole),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    return { ok: true, data: items };
  } catch (error) {
    return handleActionError(error);
  }
}

/* ------------------------------------------------------------------ */
/*  Mutation : changer le rôle plateforme d'un utilisateur             */
/* ------------------------------------------------------------------ */

export async function updateUserPlatformRoleAction(
  targetUserId: string,
  rawPlatformRole: string,
): Promise<ActionResult<UserListItem>> {
  try {
    /* Session obligatoire — AUCUN contrôle de rôle. */
    await requireSession();

    /* Validation Zod du rôle cible. */
    const platformRole = platformRoleSchema.parse(rawPlatformRole);

    /* La cible doit exister et ne pas être soft-deleted. */
    const target = await prisma.user.findUnique({
      where: { id: targetUserId, deletedAt: null },
      select: { id: true },
    });

    if (!target) {
      throw new Error("Utilisateur introuvable ou supprimé.");
    }

    /* Mise à jour atomique. */
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { platformRole },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        platformRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/super-admin/user-manager");

    return {
      ok: true,
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        emailVerified: updated.emailVerified,
        image: updated.image,
        platformRole: toPlatformRole(updated.platformRole),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
