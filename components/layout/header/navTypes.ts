/*
path :           components/layout/header/navTypes.ts
tag :            ["navigation", "types", "config", "platform-role", "header"]
projectId:       new-genesis
type:            config
generic:         true

role:            Type NavItem partagé par toutes les navigations du header.
                 Décrit un item de menu : liens internes/externes, sous-menus
                 récursifs, description, ordre d'affichage, visibilité, état
                 désactivé, et restriction par rôle plateforme (minPlatformRole).
                 Utilisé par la source de navigation (frontWorkSpace) et les
                 composants de rendu (MainNav, Header).

flow:            Module TypeScript pur → export des types NavItem et
                 NavContext. Importe PlatformRole depuis @/config/roles
                 (source unique). Aucun état, aucun effet.

ecosystem:       Layout = [
                   "@/components/layout/header/frontWorkSpace.ts",
                   "@/components/layout/header/Header.tsx",
                   "@/components/layout/header/Logo.tsx",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/UserMenu.tsx",
                   "@/components/layout/header/navTypes.ts",
                   "@/config/roles.ts",
                 ]

relatedFiles:    ["@/components/layout/header/frontWorkSpace.ts",
                  "@/components/layout/header/MainNav.tsx",
                  "@/components/layout/header/Header.tsx",
                  "@/config/roles.ts"]

imports:         ["@/config/roles"]

exports:         ["NavItem", "NavContext"]

useBy:           ["@/components/layout/header/frontWorkSpace.ts",
                  "@/components/layout/header/MainNav.tsx",
                  "@/components/layout/header/Header.tsx"]

userStories:     ["*en tant que développeur je veux un type de navigation partagé",
                  "*en tant qu'utilisateur je veux voir un menu adapté à mon rôle plateforme"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import type { PlatformRole } from "@/config/roles";

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
   * Rôle plateforme minimum requis pour voir cet item.
   * La hiérarchie est stricte : superAdmin > admin > user.
   * - `"user"` : visible par tous (y compris anonymes).
   * - `"admin"` : visible par admin et superAdmin.
   * - `"superAdmin"` : visible uniquement par superAdmin.
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
