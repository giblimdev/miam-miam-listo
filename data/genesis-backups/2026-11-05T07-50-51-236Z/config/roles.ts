/*
path :           config/roles.ts
tag :            ["config", "roles", "platform", "app", "rbac", "types", "zod"]
projectId:       <à fournir>
type:            config
generic:         true

role:            Source unique de vérité pour les rôles plateforme ET les
                 rôles applicatifs (par commerce). Exporte :
                 - PLATFORM_ROLES (as const), PlatformRole, labels,
                   descriptions, rangs, hasPlatformRank, isPlatformRole,
                   assertPlatformRole, platformRoleSchema ;
                 - APP_ROLES (as const : owner, admin, staff, courier,
                   client), AppRole, labels, descriptions, rangs,
                   hasAppRank, isAppRole, assertAppRole, appRoleSchema,
                   appRolesSchema (tableau) ;
                 - APP_ROLE_STATUSES (as const : pending, active, banned),
                   AppRoleStatus, labels, isAppRoleStatus,
                   appRoleStatusSchema.
                 Utilisé par les schémas Zod, le Header (menus), les
                 Server Actions (gardes d'accès), les pages, et les
                 formulaires d'onboarding/embauche. Aucun accès fichier,
                 aucun effet, importable client ET serveur.

                 Hiérarchie plateforme :
                   superAdmin (4) > dev (3) > admin (2) > user (1) > visitor (0).
                 "dev" est un rôle technique placé sous superAdmin (qui
                 garde la main sur les rôles plateforme) mais au-dessus
                 d'admin (accès outils techniques > administration métier).

                 Hiérarchie app (par commerce) :
                   owner (4) > admin (3) > staff (2) > courier (1) > client (0).
                 "owner" détient la propriété du commerce (transfert,
                 facturation) ; "admin" gère catalogue/stock/commandes/staff
                 sans pouvoir transférer la propriété ; "staff" opère le
                 POS et le stock ; "courier" (V2) voit uniquement ses
                 courses assignées ; "client" commande et cumule des points.

flow:            Module TypeScript pur → constantes as const + types
                 dérivés + schémas Zod + guards/assertions. Aucun état,
                 aucun effet.

ecosystem:       AuthRoles = [
                   "@/config/roles.ts",
                   "@/lib/validations/auth.ts",
                   "@/lib/auth/rbac.ts",
                   "@/config/navigation.ts",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/Header.tsx",
                   "@/app/super-admin/user-manager/actions.ts",
                   "@/app/super-admin/user-manager/page.tsx",
                   "@/app/super-admin/page.tsx",
                 ]

relatedFiles:    ["@/lib/validations/auth.ts",
                  "@/lib/auth/rbac.ts",
                  "@/config/navigation.ts",
                  "@/components/layout/header/MainNav.tsx",
                  "@/components/layout/header/Header.tsx",
                  "@/app/super-admin/user-manager/actions.ts"]

imports:         ["zod"]

exports:         ["PLATFORM_ROLES", "PlatformRole",
                  "PLATFORM_ROLE_LABELS", "PLATFORM_ROLE_DESCRIPTIONS",
                  "PLATFORM_ROLE_RANK", "hasPlatformRank",
                  "isPlatformRole", "assertPlatformRole",
                  "platformRoleSchema",
                  "APP_ROLES", "AppRole",
                  "APP_ROLE_LABELS", "APP_ROLE_DESCRIPTIONS",
                  "APP_ROLE_RANK", "hasAppRank",
                  "isAppRole", "assertAppRole",
                  "appRoleSchema", "appRolesSchema",
                  "APP_ROLE_STATUSES", "AppRoleStatus",
                  "APP_ROLE_STATUS_LABELS", "isAppRoleStatus",
                  "appRoleStatusSchema"]

useBy:           ["@/lib/validations/auth.ts",
                  "@/lib/auth/rbac.ts",
                  "@/config/navigation.ts",
                  "@/components/layout/header/MainNav.tsx",
                  "@/components/layout/header/Header.tsx",
                  "@/app/super-admin/user-manager/actions.ts",
                  "@/app/super-admin/user-manager/page.tsx",
                  "@/app/super-admin/page.tsx"]

userStories:     ["*en tant que développeur je veux une source unique pour les rôles plateforme et les rôles par commerce"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Rôles plateforme (niveau compte)                                   */
/* ------------------------------------------------------------------ */

export const PLATFORM_ROLES = [
  "visitor",
  "user",
  "admin",
  "dev",
  "superAdmin",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/**
 * Valide qu'une valeur est un PlatformRole valide.
 * Utilisé dans les Server Actions (parse), les formulaires (resolver
 * Zod), les seeds (parse), et les API (parse).
 */
export const platformRoleSchema = z.enum(PLATFORM_ROLES);

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  visitor: "Visiteur",
  user: "Utilisateur",
  admin: "Administrateur",
  dev: "Développeur",
  superAdmin: "Super-administrateur",
};

export const PLATFORM_ROLE_DESCRIPTIONS: Record<PlatformRole, string> = {
  visitor: "Visiteur : accès public, pas de compte, pas de commandes.",
  user: "Utilisateur standard : peut commander, laisser des avis, cumuler des points.",
  admin:
    "Administrateur metier : valide les commerces, gère les utilisateurs et leurs rôles par commerce, arbitre les litiges.",
  dev: "Développeur : accès aux outils techniques (Genesis, diagnostics, feature flags, logs). Ne peut pas gérer les rôles plateforme.",
  superAdmin:
    "Super-administrateur : gère les admins, les règles globales de la plateforme et l'audit. Accès en lecture à toutes les données.",
};

/**
 * Rang de chaque rôle plateforme. Utilisé pour les comparaisons
 * hiérarchiques. Plus le rang est élevé, plus les permissions sont
 * larges.
 *
 * Hiérarchie : superAdmin (4) > dev (3) > admin (2) > user (1) > visitor (0).
 */
export const PLATFORM_ROLE_RANK: Record<PlatformRole, number> = {
  visitor: 0,
  user: 1,
  admin: 2,
  dev: 3,
  superAdmin: 4,
};

/**
 * Vrai si `role` a un rang ≥ au rang de `minimum`.
 * Exemple : hasPlatformRank("dev", "admin") → true
 *          hasPlatformRank("admin", "dev") → false
 */
export function hasPlatformRank(
  role: PlatformRole,
  minimum: PlatformRole,
): boolean {
  return PLATFORM_ROLE_RANK[role] >= PLATFORM_ROLE_RANK[minimum];
}

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

/* ------------------------------------------------------------------ */
/*  Rôles applicatifs (par commerce / tenant)                          */
/* ------------------------------------------------------------------ */

/**
 * Rôles applicatifs portés par la table de jointure commerce_members.
 * Un utilisateur peut cumuler plusieurs rôles par commerce ET être
 * client du commerce A tout en étant staff du commerce B — jamais
 * les deux sur le même commerce.
 *
 * Hiérarchie : owner (4) > admin (3) > staff (2) > courier (1) > client (0).
 */
export const APP_ROLES = [
  "owner",
  "admin",
  "staff",
  "courier",
  "client",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const appRoleSchema = z.enum(APP_ROLES);

/**
 * Valide un tableau de rôles applicatifs (formulaires multi-rôles,
 * seeds, invitations). Refuse les doublons par défaut via le refine.
 */
export const appRolesSchema = z
  .array(appRoleSchema)
  .refine((roles) => new Set(roles).size === roles.length, {
    message: "Un rôle applicatif ne peut pas apparaître deux fois.",
  });

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur du commerce",
  staff: "Personnel",
  courier: "Livreur",
  client: "Client",
};

export const APP_ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  owner:
    "Propriétaire du commerce : configuration, prix, fidélité, embauche du staff, KPI, facturation et transfert de propriété.",
  admin:
    "Administrateur délégué du commerce : gère catalogue, stock, commandes et personnel, sans pouvoir transférer la propriété ni facturer.",
  staff:
    "Personnel terrain : prend les commandes au POS, ajuste le stock opérationnel. Pas d'accès aux prix ni à la configuration.",
  courier:
    "Livreur indépendant (V2) : voit uniquement les commandes qui lui sont assignées, met à jour les statuts de livraison et consulte sa rémunération.",
  client:
    "Client du commerce : parcourt le catalogue, commande, cumule et consomme des points de fidélité, consulte son historique.",
};

/**
 * Rang de chaque rôle applicatif. Plus le rang est élevé, plus les
 * permissions sur le commerce sont larges. `courier` est placé
 * au-dessus de `client` (accès opérationnel à ses courses assignées)
 * mais sous `staff` (pas d'accès au catalogue complet ni au stock).
 */
export const APP_ROLE_RANK: Record<AppRole, number> = {
  client: 0,
  courier: 1,
  staff: 2,
  admin: 3,
  owner: 4,
};

/**
 * Vrai si `role` a un rang ≥ au rang de `minimum`.
 * Exemple : hasAppRank("admin", "staff") → true
 *          hasAppRank("staff", "admin") → false
 */
export function hasAppRank(role: AppRole, minimum: AppRole): boolean {
  return APP_ROLE_RANK[role] >= APP_ROLE_RANK[minimum];
}

export function isAppRole(value: unknown): value is AppRole {
  return (
    typeof value === "string" &&
    (APP_ROLES as readonly string[]).includes(value)
  );
}

export function assertAppRole(
  value: unknown,
  context = "rôle applicatif",
): asserts value is AppRole {
  if (!isAppRole(value)) {
    throw new Error(
      `${context} invalide : "${String(value)}". Valeurs autorisées : ${APP_ROLES.join(", ")}.`,
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Statuts d'appartenance à un commerce (commerce_members.status)     */
/* ------------------------------------------------------------------ */

/**
 * Statut d'un membre dans un commerce. Un membre `pending` n'a pas
 * encore été validé (invitation en attente), `active` est opérationnel,
 * `banned` est suspendu (accès refusé, mais le lien est conservé pour
 * l'audit).
 */
export const APP_ROLE_STATUSES = ["pending", "active", "banned"] as const;
export type AppRoleStatus = (typeof APP_ROLE_STATUSES)[number];

export const appRoleStatusSchema = z.enum(APP_ROLE_STATUSES);

export const APP_ROLE_STATUS_LABELS: Record<AppRoleStatus, string> = {
  pending: "En attente",
  active: "Actif",
  banned: "Suspendu",
};

export function isAppRoleStatus(value: unknown): value is AppRoleStatus {
  return (
    typeof value === "string" &&
    (APP_ROLE_STATUSES as readonly string[]).includes(value)
  );
}
