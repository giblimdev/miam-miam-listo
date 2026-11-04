/*
path :           config/roles.ts
tag :            ["config", "roles", "platform", "rbac", "types", "zod"]
projectId:       <à fournir>
type:            config
generic:         true

role:            Source unique de vérité pour les rôles plateforme.
                 Exporte PLATFORM_ROLES (tableau as const), le type
                 PlatformRole dérivé, PLATFORM_ROLE_LABELS,
                 PLATFORM_ROLE_DESCRIPTIONS, PLATFORM_ROLE_RANK (hiérarchie),
                 hasPlatformRank (comparaison hiérarchique), isPlatformRole
                 (type guard), assertPlatformRole (assertion), et
                 platformRoleSchema (Zod enum) pour la validation runtime.
                 Utilisé par les schémas Zod, le Header (menus), les
                 Server Actions (gardes d'accès), et les pages. Aucun
                 accès fichier, aucun effet, importable client ET serveur.

flow:            Module TypeScript pur → constantes + type dérivé +
                 schéma Zod. Aucun état, aucun effet.

ecosystem:       AuthRoles = [
                   "@/config/roles.ts",
                 ]

relatedFiles:    ["@/lib/validations/auth.ts",
                  "@/lib/auth/rbac.ts",
                  "@/config/navigation.ts",
                  "@/components/layout/header/MainNav.tsx",
                  "@/components/layout/header/Header.tsx",
                  "@/app/super-admin/users/actions.ts"]

imports:         ["zod"]

exports:         ["PLATFORM_ROLES", "PlatformRole",
                  "PLATFORM_ROLE_LABELS", "PLATFORM_ROLE_DESCRIPTIONS",
                  "PLATFORM_ROLE_RANK", "hasPlatformRank",
                  "isPlatformRole", "assertPlatformRole",
                  "platformRoleSchema"]

useBy:           ["@/lib/validations/auth.ts",
                  "@/lib/auth/rbac.ts",
                  "@/config/navigation.ts",
                  "@/components/layout/header/MainNav.tsx",
                  "@/components/layout/header/Header.tsx",
                  "@/app/super-admin/users/actions.ts",
                  "@/app/super-admin/users/page.tsx",
                  "@/app/super-admin/page.tsx"]

userStories:     ["*en tant que développeur je veux une source unique pour les rôles plateforme"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Rôles plateforme (source unique)                                   */
/* ------------------------------------------------------------------ */

export const PLATFORM_ROLES = ["user", "admin", "superAdmin"] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/* ------------------------------------------------------------------ */
/*  Schéma Zod (validation runtime)                                    */
/* ------------------------------------------------------------------ */

/**
 * Valide qu'une valeur est un PlatformRole valide.
 * Utilisé dans les Server Actions (parse), les formulaires (resolver
 * Zod), les seeds (parse), et les API (parse).
 *
 * @example
 *   const role = platformRoleSchema.parse(rawRole);
 *   // → PlatformRole (lève ZodError si invalide)
 */
export const platformRoleSchema = z.enum(PLATFORM_ROLES);

/* ------------------------------------------------------------------ */
/*  Labels lisibles                                                    */
/* ------------------------------------------------------------------ */

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  user: "Utilisateur",
  admin: "Administrateur",
  superAdmin: "Super-administrateur",
};

/* ------------------------------------------------------------------ */
/*  Descriptions (tooltips, aide)                                      */
/* ------------------------------------------------------------------ */

export const PLATFORM_ROLE_DESCRIPTIONS: Record<PlatformRole, string> = {
  user: "Utilisateur standard : peut commander, laisser des avis, cumuler des points.",
  admin:
    "Administrateur metier : valide les commerces, gère les utilisateurs et leurs rôles par commerce, arbitre les litiges.",
  superAdmin:
    "Super-administrateur : gère les admins, les règles globales de la plateforme et l'audit. Accès en lecture à toutes les données.",
};

/* ------------------------------------------------------------------ */
/*  Hiérarchie                                                         */
/* ------------------------------------------------------------------ */

/**
 * Rang de chaque rôle plateforme. Utilisé pour les comparaisons
 * hiérarchiques (ex. `superAdmin` a un rang supérieur à `admin`).
 * Plus le rang est élevé, plus les permissions sont larges.
 */
export const PLATFORM_ROLE_RANK: Record<PlatformRole, number> = {
  user: 0,
  admin: 1,
  superAdmin: 2,
};

/**
 * Vrai si `role` a un rang ≥ au rang de `minimum`.
 * Exemple : hasPlatformRank("superAdmin", "admin") → true
 */
export function hasPlatformRank(
  role: PlatformRole,
  minimum: PlatformRole,
): boolean {
  return PLATFORM_ROLE_RANK[role] >= PLATFORM_ROLE_RANK[minimum];
}

/* ------------------------------------------------------------------ */
/*  Type guard + assertion                                             */
/* ------------------------------------------------------------------ */

export function isPlatformRole(value: unknown): value is PlatformRole {
  return (
    typeof value === "string" &&
    (PLATFORM_ROLES as readonly string[]).includes(value)
  );
}

export function assertPlatformRole(
  value: unknown,
  context = "rôle plateforme",
): asserts value is PlatformRole {
  if (!isPlatformRole(value)) {
    throw new Error(
      `${context} invalide : "${String(value)}". Valeurs autorisées : ${PLATFORM_ROLES.join(", ")}.`,
    );
  }
}