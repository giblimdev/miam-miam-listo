/*
path :           lib/auth/rbac.ts
tag :            ["auth", "rbac", "roles", "server-only", "guard"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Helpers serveur de garde d'accès basés sur le rôle plateforme.
                 Centralise TOUTES les vérifications d'autorisation :
                 requireSession, requirePlatformRole, requirePlatformRank,
                 requireSuperAdmin. Aucune Server Action ni page protégée
                 ne doit lire le rôle directement — elles passent toutes
                 par ces helpers. Importable UNIQUEMENT côté serveur
                 (server-only).

flow:            requireSession() → getSession() + prisma.user.findUnique
                 → lève 401 si null ou introuvable.
                 requirePlatformRole(roles[]) → requireSession + vérifie
                 user.platformRole ∈ roles → lève 403 sinon.
                 requirePlatformRank(minimum) → requireSession + vérifie
                 user.platformRole a un rang ≥ minimum → lève 403 sinon.
                 requireSuperAdmin() → requirePlatformRole(["superAdmin"]).
                 Tous retournent SessionUser pour usage dans l'action.

ecosystem:       AuthRBAC = [
                   "@/lib/auth/rbac.ts",
                   "@/lib/auth/session.ts",
                   "@/lib/prisma.ts",
                   "@/config/roles.ts",
                 ]

relatedFiles:    ["@/lib/auth/session.ts",
                  "@/lib/prisma.ts",
                  "@/config/roles.ts"]

imports:         ["server-only",
                  "@/lib/auth/session",
                  "@/lib/prisma",
                  "@/config/roles.ts"]

exports:         ["SessionUser", "UnauthorizedError", "ForbiddenError",
                  "requireSession", "requirePlatformRole",
                  "requirePlatformRank", "requireSuperAdmin"]

useBy:           ["@/app/super-admin/page.tsx",
                  "@/app/admin/users/actions.ts",
                  "@/lib/actions/**"]

userStories:     ["*en tant que développeur je veux des gardes d'accès centralisées par rôle plateforme"]

status:          planned
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import "server-only";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PLATFORM_ROLE_RANK, type PlatformRole } from "@/config/roles";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly platformRole: PlatformRole;
}

/* ------------------------------------------------------------------ */
/*  Erreurs typées                                                     */
/* ------------------------------------------------------------------ */

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Authentification requise.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Accès refusé.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Exige une session. Lève UnauthorizedError (401) si absente ou si
 * l'utilisateur n'existe pas / est soft-deleted.
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session?.user) {
    throw new UnauthorizedError();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      platformRole: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError("Utilisateur introuvable.");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    platformRole: user.platformRole as PlatformRole,
  };
}

/**
 * Exige un rôle plateforme parmi `roles`. Lève ForbiddenError (403) sinon.
 */
export async function requirePlatformRole(
  roles: readonly PlatformRole[],
): Promise<SessionUser> {
  const user = await requireSession();
  if (!roles.includes(user.platformRole)) {
    throw new ForbiddenError(
      `Rôle plateforme insuffisant (requis : ${roles.join(", ")}).`,
    );
  }
  return user;
}

/**
 * Exige un rang plateforme ≥ minimum. Hiérarchie : superAdmin > admin > user.
 * Plus permissif que requirePlatformRole : un superAdmin passe toujours.
 */
export async function requirePlatformRank(
  minimum: PlatformRole,
): Promise<SessionUser> {
  const user = await requireSession();
  if (PLATFORM_ROLE_RANK[user.platformRole] < PLATFORM_ROLE_RANK[minimum]) {
    throw new ForbiddenError(
      `Rang plateforme insuffisant (requis : ${minimum}, actuel : ${user.platformRole}).`,
    );
  }
  return user;
}

/**
 * Raccourci : exige le rôle superAdmin.
 */
export async function requireSuperAdmin(): Promise<SessionUser> {
  return requirePlatformRole(["superAdmin"]);
}
