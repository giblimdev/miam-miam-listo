/*
path :           app/super-admin/user-manager/actions.ts
tag :            ["super-admin", "users", "actions", "platform-role", "rbac", "bootstrap"]
projectId:       <à fournir>
type :           action
generic:         false

role:            Server Actions de gestion des utilisateurs pour le
                 super-admin. Permet de lister les utilisateurs, de
                 promouvoir/révoquer un administrateur, et de changer le
                 rôle plateforme d'un utilisateur.

                 MODE BOOTSTRAP : tant qu'AUCUN super-admin n'existe en
                 base, listUsersAction et updateUserPlatformRoleAction
                 sont accessibles à tout utilisateur connecté, dans le
                 seul but de créer le premier super-admin. Dès qu'un
                 super-admin existe, les deux actions exigent
                 requireSuperAdmin(). Le comptage est fait par
                 countSuperAdminsAction(), exportée pour la page.

                 Garde-fous conservés dans updateUserPlatformRoleAction :
                 anti-auto-promotion (on ne change pas son propre rôle),
                 anti-rétrogradation d'un super-admin, refus de créer un
                 super-admin quand il en existe déjà un (seul un autre
                 super-admin peut le faire, via une action dédiée future).

flow:            Chaque action → countSuperAdminsAction() → si > 0 :
                 requireSuperAdmin() → validation Zod
                 (platformRoleSchema) → prisma.user.update/findMany →
                 revalidatePath("/super-admin/userManager") →
                 ActionResult<T>.

ecosystem:       SuperAdmin = [
                   "@/app/super-admin/page.tsx",
                   "@/app/super-admin/user-manager/UsersTable.tsx",
                   "@/app/super-admin/user-manager/actions.ts",
                   "@/app/super-admin/user-manager/page.tsx",
                 ]

relatedFiles:    ["@/config/roles.ts",
                  "@/lib/auth/rbac.ts",
                  "@/lib/actions/result.ts",
                  "@/lib/prisma.ts",
                  "@/app/super-admin/user-manager/page.tsx"]

imports:         ["next/cache",
                  "@/config/roles.ts",
                  "@/lib/auth/rbac.ts",
                  "@/lib/actions/result.ts",
                  "@/lib/prisma.ts"]

exports:         ["countSuperAdminsAction", "listUsersAction",
                  "updateUserPlatformRoleAction", "UserListItem"]

useBy:           ["@/app/super-admin/userManager/page.tsx",
                  "@/app/super-admin/userManager/UsersTable.tsx"]

userStories:     ["*en tant que super-admin je veux gérer les rôles plateforme des utilisateurs",
                  "*en tant que premier utilisateur je veux pouvoir créer le premier super-admin"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use server";
// "use server" justifié : Server Actions (mutations + lecture serveur).

import { revalidatePath } from "next/cache";

import { platformRoleSchema, type PlatformRole } from "@/config/roles";
import {
  ForbiddenError,
  requireSession,
  requireSuperAdmin,
} from "@/lib/auth/rbac";
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

/** Conversion string Prisma → PlatformRole, fallback "user" si corrompu. */
function toPlatformRole(raw: string): PlatformRole {
  const parsed = platformRoleSchema.safeParse(raw);
  return parsed.success ? parsed.data : "user";
}

/* ------------------------------------------------------------------ */
/*  Bootstrap : compter les super-admins                               */
/* ------------------------------------------------------------------ */

/**
 * Retourne le nombre de super-admins actifs (non soft-deleted).
 * Exportée pour que la page puisse décider d'afficher ou non le
 * bandeau "mode initialisation". Ne révèle aucun nom.
 */
export async function countSuperAdminsAction(): Promise<number> {
  const count = await prisma.user.count({
    where: { deletedAt: null, platformRole: "superAdmin" },
  });
  return count;
}

/* ------------------------------------------------------------------ */
/*  Lecture : lister les utilisateurs                                  */
/* ------------------------------------------------------------------ */

export async function listUsersAction(): Promise<
  ActionResult<readonly UserListItem[]>
> {
  try {
    /* Session obligatoire dans tous les cas (pas d'accès anonyme). */
    await requireSession();

    /* Bootstrap : tant qu'aucun super-admin n'existe, la lecture est
       ouverte à tout utilisateur connecté. Dès qu'il y en a un, on
       exige le rôle superAdmin. */
    const superAdminCount = await prisma.user.count({
      where: { deletedAt: null, platformRole: "superAdmin" },
    });
    if (superAdminCount > 0) {
      await requireSuperAdmin();
    }

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
    /* 1. Session obligatoire. */
    const currentUser = await requireSession();

    /* 2. Compter les super-admins pour décider du mode. */
    const superAdminCount = await prisma.user.count({
      where: { deletedAt: null, platformRole: "superAdmin" },
    });
    const isBootstrap = superAdminCount === 0;

    /* 3. Hors bootstrap, seuls les super-admins peuvent changer un rôle. */
    if (!isBootstrap) {
      await requireSuperAdmin();
    }

    /* 4. Anti-auto-promotion : on ne change pas son propre rôle. */
    if (currentUser.id === targetUserId) {
      throw new ForbiddenError(
        "Vous ne pouvez pas modifier votre propre rôle plateforme.",
      );
    }

    /* 5. Validation Zod du rôle cible. */
    const platformRole = platformRoleSchema.parse(rawPlatformRole);

    /* 6. Création d'un super-admin : autorisée UNIQUEMENT en bootstrap
          (aucun super-admin existant). Ensuite, refusée depuis cette
          action — un super-admin ne se crée pas un pair ici. */
    if (platformRole === "superAdmin" && !isBootstrap) {
      throw new ForbiddenError(
        "La promotion au rôle superAdmin n'est pas autorisée depuis cette action.",
      );
    }

    /* 7. La cible doit exister et ne pas être soft-deleted. */
    const target = await prisma.user.findUnique({
      where: { id: targetUserId, deletedAt: null },
      select: { id: true, platformRole: true },
    });

    if (!target) {
      throw new Error("Utilisateur introuvable ou supprimé.");
    }

    /* 8. Anti-rétrogradation : on ne dégrade pas un super-admin. */
    if (toPlatformRole(target.platformRole) === "superAdmin") {
      throw new ForbiddenError(
        "Un super-administrateur ne peut pas être rétrogradé depuis cette action.",
      );
    }

    /* 9. Mise à jour atomique. */
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

    /* 10. Revalidation de la page. */
    revalidatePath("/super-admin/userManager");

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
