/*
path :           components/layout/header/navTypes.ts
tag :            ["navigation", "types", "config", "platform-role", "header", "rbac"]
projectId:       new-genesis
type:            config
generic:         true

role:            Type NavItem partagé par toutes les navigations du header,
                 PLUS le helper canSee(item, platformRole) — source unique
                 de vérité pour le filtrage par rôle plateforme. Décrit un
                 item de menu : liens internes/externes, sous-menus
                 récursifs, description, ordre d'affichage, visibilité,
                 état désactivé, et restriction par rôle plateforme
                 (minPlatformRole). Utilisé par la source de navigation
                 (frontWorkSpace) et les composants de rendu (MainNav,
                 Header).

                 canSee applique la hiérarchie stricte via hasPlatformRank :
                 superAdmin (3) > dev (2) > admin (1) > user (0). Un
                 superAdmin voit donc TOUS les items, quel que soit leur
                 minPlatformRole. Anonyme (platformRole null) : seuls les
                 items minPlatformRole "user" sont visibles.

flow:            Module TypeScript pur → export des types NavItem et
                 NavContext + de la fonction canSee. Importe PlatformRole
                 et hasPlatformRank depuis @/config/roles (source unique).
                 Aucun état, aucun effet.

ecosystem:       Layout = [
                   "@/components/layout/header/navTypes.ts",
                   "@/components/layout/header/nav/frontWorkSpace.ts",
                   "@/components/layout/header/Header.tsx",
                   "@/components/layout/header/MainNav.tsx",
                   "@/config/roles.ts",
                 ]

relatedFiles:    ["@/config/roles.ts",
                  "@/components/layout/header/nav/frontWorkSpace.ts",
                  "@/components/layout/header/MainNav.tsx",
                  "@/components/layout/header/Header.tsx"]

imports:         ["@/config/roles"]

exports:         ["NavItem", "NavContext", "canSee"]

useBy:           ["@/components/layout/header/nav/frontWorkSpace.ts",
                  "@/components/layout/header/MainNav.tsx",
                  "@/components/layout/header/Header.tsx"]

userStories:     ["*en tant que développeur je veux un type de navigation partagé",
                  "*en tant qu'utilisateur je veux voir un menu adapté à mon rôle plateforme",
                  "*en tant que superAdmin je veux voir tous les items de navigation"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import {
  hasPlatformRank,
  type PlatformRole,
} from "@/config/roles";

/* ------------------------------------------------------------------ */
/*  NavItem                                                            */
/* ------------------------------------------------------------------ */

/**
 * Un item de navigation du header.
 * Récursif : un item peut contenir des enfants (sous-menu).
 */
export interface NavItem {
  /** Identifiant unique (clé React, référence stable). */
  readonly id: string;

  /** Libellé affiché à l'utilisateur. */
  readonly label: string;

  /** URL cible (optionnelle : un item sans href sert de groupe). */
  readonly href?: string;

  /** Description courte (sous-menus, aria, tooltip). */
  readonly description?: string;

  /** Sous-menu récursif. */
  readonly children?: readonly NavItem[];

  /** Ordre d'affichage (tri croissant). */
  readonly displayOrder: number;

  /** Visible ou non (défaut : `true`). */
  readonly visible?: boolean;

  /** Ouvrir dans un nouvel onglet (ajoute `target="_blank"` et `rel`). */
  readonly external: boolean;

  /** Désactivé : affiché mais non cliquable. */
  readonly disabled: boolean;

  /**
   * Rôle plateforme MINIMUM requis pour voir cet item (seuil
   * hiérarchique). La hiérarchie est stricte :
   * superAdmin (3) > dev (2) > admin (1) > user (0).
   *
   * - `"user"`       : visible par tous (y compris anonymes).
   * - `"admin"`      : visible par admin, dev, superAdmin.
   * - `"dev"`        : visible par dev, superAdmin.
   * - `"superAdmin"` : visible uniquement par superAdmin.
   *
   * Un superAdmin voit donc TOUJOURS l'item, quel que soit le seuil.
   */
  readonly minPlatformRole: PlatformRole;
}

/* ------------------------------------------------------------------ */
/*  NavContext                                                         */
/* ------------------------------------------------------------------ */

/**
 * Contexte nécessaire au filtrage d'une navigation.
 * Passé aux helpers qui résolvent les items visibles.
 */
export interface NavContext {
  /** Rôle plateforme de l'utilisateur courant, ou `null` si anonyme. */
  readonly platformRole: PlatformRole | null;
}

/* ------------------------------------------------------------------ */
/*  Filtrage par rôle plateforme (source unique de vérité)             */
/* ------------------------------------------------------------------ */

/**
 * Vrai si l'utilisateur courant (identifié par son rôle plateforme)
 * peut voir l'item de navigation.
 *
 * Règles :
 * 1. `visible === false` → jamais visible (filtre éditorial).
 * 2. Anonyme (`platformRole === null`) → seuls les items
 *    `minPlatformRole: "user"` sont visibles.
 * 3. Connecté → hiérarchie stricte via hasPlatformRank :
 *    un rôle voit tous les items dont le seuil est ≤ son rang.
 *    superAdmin (rang 3) voit donc TOUS les items.
 *
 * ⚠️ Source unique : Header.tsx et MainNav.tsx doivent importer
 * CETTE fonction. Ne pas la dupliquer localement — c'est ce qui
 * causait des incohérences desktop/mobile.
 */
export function canSee(
  item: NavItem,
  platformRole: PlatformRole | null,
): boolean {
  /* 1. Filtre `visible` (défaut : true). */
  if (item.visible === false) return false;

  /* 2. Anonyme : seuls les items `user` sont visibles. */
  if (!platformRole) {
    return item.minPlatformRole === "user";
  }

  /* 3. Hiérarchie stricte : superAdmin > dev > admin > user.
     superAdmin a le rang max → hasPlatformRank retourne toujours
     true pour lui, donc il voit TOUS les items. */
  return hasPlatformRank(platformRole, item.minPlatformRole);
}