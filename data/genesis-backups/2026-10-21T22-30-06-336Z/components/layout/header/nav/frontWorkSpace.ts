/*
path :           components/layout/header/nav/frontWorkSpace.ts
projectId:       new-genesis
type:            config
generic:         false

role:            Source unique de navigation de l'application. Exporte
                 mainNavData, consommé exclusivement par Header.tsx.
                 Branche les pages d'entrée Blog (/blog, /blog/search,
                 /blog/community, /blog/playlists, /blog/playlists/manage,
                 /blog/user/favorites, /blog/notifications, /blog/help)
                 sous l'entrée « Blog », les pages Scrum
                 (/scrum/scrum-business, /scrum/scrum-app,
                 /scrum/scrum-genesis, /scrum/help) sous l'entrée
                 « Conception », et les pages Admin (/admin, /admin/users)
                 sous l'entrée « Admin ». Les entrées Admin et « Gérer
                 les playlists » portent roles: ["admin"] ou
                 roles: ["admin", "author"] — elles ne sont affichées
                 qu'aux utilisateurs ayant le rôle correspondant
                 (filtrage effectué dans MainNav via la prop userRole).

                 Depuis la migration core → scrum : les segments
                 physiques sont /scrum/* (au lieu de /core/*). Les
                 valeurs de flux (ScrumFlow) restent inchangées :
                 "scrum-business" | "scrum-app" | "scrum-genesis".

flow:            Module TypeScript pur → export d'un tableau readonly
                 de NavItem. Aucun état, aucun effet.

ecosystem:       Layout = [
                   "@/components/layout/header/nav/frontWorkSpace.ts",
                   "@/components/layout/header/navTypes.ts",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/NavActiveLink.tsx",
                   "@/components/layout/header/Header.tsx",
                   "@/components/layout/header/Logo.tsx",
                   "@/components/layout/header/UserMenu.tsx",
                 ]

relatedFiles:    ["@/components/layout/header/navTypes.ts",
                  "@/components/layout/header/Header.tsx"]

imports:         ["@/components/layout/header/navTypes"]

exports:         ["mainNavData"]

useBy:           ["@/components/layout/header/Header.tsx"]

userStories:     ["*en tant que développeur je veux naviguer dans l'app"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import type { NavItem } from "../navTypes";

export const mainNavData: readonly NavItem[] = [
  {
    id: "nav-home",
    label: "Accueil",
    href: "/",
    displayOrder: 10,
    visible: true,
    disabled: false,
    external: false,
    roles: undefined,
  },
  {
    id: "nav-blog",
    label: "Blog",
    href: "/blog",
    description:
      "Articles, recherche, communauté, playlists, favoris et notifications",
    displayOrder: 20,
    visible: true,
    disabled: false,
    external: false,
    roles: undefined,
    children: [
      {
        id: "nav-blog-index",
        label: "Articles",
        href: "/blog",
        displayOrder: 10,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
      {
        id: "nav-blog-search",
        label: "Rechercher",
        href: "/blog/search",
        displayOrder: 20,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
      {
        id: "nav-blog-community",
        label: "Communauté",
        href: "/blog/community",
        displayOrder: 30,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
      {
        id: "nav-blog-playlists",
        label: "Playlists",
        href: "/blog/playlists",
        displayOrder: 35,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
      {
        id: "nav-blog-playlists-manage",
        label: "Gérer les playlists",
        href: "/blog/playlists/manage",
        displayOrder: 36,
        visible: true,
        disabled: false,
        external: false,
        roles: ["admin"],
      },
      {
        id: "nav-blog-favorites",
        label: "Mes favoris",
        href: "/blog/user/favorites",
        displayOrder: 40,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
      {
        id: "nav-blog-notifications",
        label: "Notifications",
        href: "/blog/notifications",
        displayOrder: 50,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
      {
        id: "nav-blog-help",
        label: "Aide Blog",
        href: "/blog/help",
        displayOrder: 60,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
    ],
  },
  {
    id: "nav-scrum",
    label: "Conception",
    href: "",
    description: "Conception du projet",
    displayOrder: 30,
    visible: true,
    disabled: false,
    external: false,
    roles: undefined,
    children: [
      {
        id: "nav-scrum-business",
        label: "ScrumBusiness",
        href: "/scrum/scrum-business",
        displayOrder: 10,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
      {
        id: "nav-scrum-app",
        label: "ScrumApp",
        href: "/scrum/scrum-app",
        displayOrder: 20,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
      {
        id: "nav-scrum-genesis",
        label: "Scrum-Genesis",
        href: "/scrum/scrum-genesis",
        displayOrder: 30,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
      {
        id: "nav-scrum-help",
        label: "Aide Scrum",
        href: "/scrum/help",
        displayOrder: 40,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
    ],
  },
  {
    id: "nav-genesis",
    label: "DEV",
    href: "/genesis",
    description: "Outils de développement",
    displayOrder: 40,
    visible: true,
    disabled: false,
    external: false,
    roles: undefined,
    children: [
      {
        id: "nav-genesis-copy-to-ia",
        label: "Copy to IA",
        href: "/genesis/copy-to-ia",
        displayOrder: 10,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
      {
        id: "nav-genesis-create-files",
        label: "CreateFiles",
        href: "/genesis/create-files",
        displayOrder: 20,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
      {
        id: "nav-genesis-read-files",
        label: "SelectFiles",
        href: "/genesis/read-files",
        displayOrder: 30,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
      {
        id: "nav-genesis-cmd",
        label: "Commandes",
        href: "/genesis/cmd",
        displayOrder: 35,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
      {
        id: "nav-genesis-help",
        label: "Genesis Help",
        href: "/genesis/help",
        displayOrder: 40,
        visible: true,
        disabled: false,
        external: false,
        roles: undefined,
      },
    ],
  },
  {
    id: "nav-admin",
    label: "Admin",
    href: "/admin",
    description: "Administration de l'application",
    displayOrder: 50,
    visible: true,
    disabled: false,
    external: false,
    roles: ["admin"],
    children: [
      {
        id: "nav-admin-users",
        label: "Utilisateurs",
        href: "/admin/users",
        displayOrder: 10,
        visible: true,
        disabled: false,
        external: false,
        roles: ["admin"],
      },
    ],
  },
];
