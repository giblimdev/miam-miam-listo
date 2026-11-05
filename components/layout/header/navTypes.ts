/*
path :           components/layout/header/navTypes.ts
tag :            ["navigation", "types", "config", "platform-role", "header", "rbac", "dynamic-href"]
projectId:       new-genesis
type:            config
generic:         true

role:            Type NavItem partagé par toutes les navigations du header,
                 PLUS le helper canSee(item, platformRole) — source unique
                 de vérité pour le filtrage par rôle plateforme, PLUS le
                 helper resolveHrefString(href, params) — résolution
                 défensive des segments dynamiques `[xxx]` dans les hrefs
                 au moment du rendu client. Décrit un item de menu : liens
                 internes/externes, sous-menus récursifs, description,
                 ordre d'affichage, visibilité, état désactivé, et
                 restriction par rôle plateforme (minPlatformRole). Utilisé
                 par la source de navigation (frontWorkSpace) et les
                 composants de rendu (MainNav, Header).

                 canSee applique la hiérarchie stricte via hasPlatformRank :
                 superAdmin (3) > dev (2) > admin (1) > user (0). Un
                 superAdmin voit donc TOUS les items, quel que soit leur
                 minPlatformRole. Anonyme (platformRole null) : seuls les
                 items minPlatformRole "user" sont visibles.

                 resolveHrefString est DÉFENSIF : si params est absent,
                 null ou ne contient pas la clé demandée, le placeholder
                 `[xxx]` est laissé TEL QUEL (l'item est considéré comme
                 non résolvable). Cela évite le crash « Cannot read
                 properties of undefined (reading 'flow') » qui survenait
                 quand un composant appelait resolveHrefString sans
                 transmettre params. Les composants MainNav et Header
                 transmettent toujours un objet params non-undefined
                 (même vide), mais la garde reste en place pour tout futur
                 appelant.

                 RouteParams accepte explicitement `null` et `undefined`
                 pour que les helpers restent défensifs même si un
                 appelant oublie de fournir un objet.

flow:            Module TypeScript pur → export des types NavItem,
                 NavContext et RouteParams + des fonctions canSee et
                 resolveHrefString. Importe PlatformRole et
                 hasPlatformRank depuis @/config/roles (source unique).
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

exports:         ["NavItem", "NavContext", "RouteParams", "canSee",
                  "resolveHrefString"]

useBy:           ["@/components/layout/header/nav/frontWorkSpace.ts",
                  "@/components/layout/header/MainNav.tsx",
                  "@/components/layout/header/Header.tsx"]

userStories:     ["*en tant que développeur je veux un type de navigation partagé",
                  "*en tant qu'utilisateur je veux voir un menu adapté à mon rôle plateforme",
                  "*en tant que superAdmin je veux voir tous les items de navigation",
                  "*en tant que développeur je veux résoudre les hrefs dynamiques [flow] côté client"]

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

  /**
   * URL cible (optionnelle : un item sans href sert de groupe).
   * Peut contenir un segment dynamique `[flow]` (ex. /scrum/[flow]/roadmap).
   * La substitution est déléguée à resolveHrefString() qui doit être appelé
   * côté client avec les params de la route courante avant de passer le
   * href à <Link>.
   */
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
/*  RouteParams                                                        */
/* ------------------------------------------------------------------ */

/**
 * Type des paramètres de route transmis aux helpers de résolution.
 * Volontairement permissif : `undefined` et `null` sont acceptés pour
 * que les helpers restent défensifs même si un appelant oublie de
 * fournir un objet. Un objet vide `{}` est également valide (aucun
 * placeholder ne sera résolu).
 */
export type RouteParams =
  | Readonly<Record<string, string | undefined>>
  | null
  | undefined;

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

/* ------------------------------------------------------------------ */
/*  Résolution des hrefs dynamiques (App Router + next/link)           */
/* ------------------------------------------------------------------ */

/**
 * Remplace les segments dynamiques `[xxx]` d'un href par la valeur
 * courante lue depuis les params de la route. Utilisé côté client par
 * MainNav et Header mobile avant de passer le href à <Link>.
 *
 * Cas d'usage principal : `/scrum/[flow]/roadmap` doit devenir
 * `/scrum/scrum-app/roadmap` lorsque l'utilisateur navigue dans le
 * flux `scrum-app`. Sans cela, next/link lève l'erreur « Dynamic href
 * /scrum/scrum/[flow]/roadmap found in <Link> while using the /app
 * router, this is not supported ».
 *
 * Règles (défensives) :
 * 1. Aucun href → undefined retourné.
 * 2. Aucun placeholder `[` dans le href → href inchangé.
 * 3. `params` absent, null ou undefined → href inchangé (aucun crash).
 * 4. Sinon, remplacement de CHAQUE `[clé]` par `params[clé]` si fourni ;
 *    sinon le placeholder est laissé tel quel (item considéré comme
 *    non résolvable).
 *
 * @example
 *   resolveHrefString("/scrum/[flow]/roadmap", { flow: "scrum-app" })
 *     → "/scrum/scrum-app/roadmap"
 *   resolveHrefString("/scrum/[flow]/roadmap", {})
 *     → "/scrum/[flow]/roadmap" (placeholder laissé)
 *   resolveHrefString("/scrum/[flow]/roadmap", undefined)
 *     → "/scrum/[flow]/roadmap" (pas de crash)
 */
export function resolveHrefString(
  href: string | undefined,
  params: RouteParams,
): string | undefined {
  /* 1. Aucun href → rien à résoudre. */
  if (!href) return href;

  /* 2. Aucun placeholder → retour immédiat (perf). */
  if (!href.includes("[")) return href;

  /* 3. Garde défensive : params peut être absent (undefined) ou null
     si un appelant oublie de le transmettre. On retourne le href
     inchangé plutôt que de crasher sur params[key]. */
  if (!params) return href;

  /* 4. Remplacement de chaque `[clé]` par params[clé] si fourni. */
  const resolved = href.replace(
    /\[([a-zA-Z0-9_]+)\]/g,
    (match, key: string) => {
      const value = params[key];
      return typeof value === "string" && value.length > 0 ? value : match;
    },
  );

  return resolved;
}