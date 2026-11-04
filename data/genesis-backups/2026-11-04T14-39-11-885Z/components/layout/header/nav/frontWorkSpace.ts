/*
path :           components/layout/header/nav/frontWorkSpace.ts
tag :            ["navigation", "config", "platform-role", "header"]
projectId:       new-genesis
type:            config
generic:         false

role:            Source unique de navigation de l'application. Exporte
                 mainNavData, consommé exclusivement par Header.tsx.
                 Chaque item porte un champ minPlatformRole (PlatformRole)
                 qui détermine le rôle plateforme minimum pour voir l'item.
                 La hiérarchie est stricte : superAdmin > admin > user.
                 Aligné sur config/roles.ts (source unique des rôles).

flow:            Module TypeScript pur → export d'un tableau readonly
                 de NavItem. Aucun état, aucun effet.

ecosystem:       Layout = [
                   "@/components/layout/header/nav/frontWorkSpace.ts",
                   "@/components/layout/header/Header.tsx",
                   "@/components/layout/header/Logo.tsx",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/UserMenu.tsx",
                   "@/components/layout/header/navTypes.ts",
                   "@/config/roles.ts",
                 ]

relatedFiles:    ["@/components/layout/header/navTypes.ts",
                  "@/components/layout/header/Header.tsx",
                  "@/config/roles.ts"]

imports:         ["@/components/layout/header/navTypes",
                  "@/config/roles"]

exports:         ["mainNavData"]

useBy:           ["@/components/layout/header/Header.tsx"]

userStories:     ["*en tant que développeur je veux naviguer dans l'app"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import type { NavItem } from "@/components/layout/header/navTypes";

export const mainNavData: readonly NavItem[] = [
  {
    id: "nav-home",
    label: "Accueil",
    href: "/",
    displayOrder: 10,
    visible: true,
    disabled: false,
    external: false,
    minPlatformRole: "user",
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
    minPlatformRole: "user",
  },
  {
    id: "nav-super-admin",
    label: "Super-admin",
    href: "/super-admin",
    description: "Règles globales, admins, audit",
    displayOrder: 60,
    visible: true,
    disabled: false,
    external: false,
    minPlatformRole: "user",
    children: [
      {
        id: "nav-super-admin-rbca",
        label: "RBCA Role-Based Access Control",
        href: "/super-admin/rbca",
        displayOrder: 610,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "user",
      },
      {
        id: "nav-admin-users",
        label: "Utilisateurs",
        href: "/super-admin/user-manager",
        displayOrder: 620,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "user",
      },
    ],
  },
  {
    id: "nav-scrum",
    label: "Srum Concept",
    href: "",
    description: "Conception du projet",
    displayOrder: 70,
    visible: true,
    disabled: false,
    external: false,
    minPlatformRole: "user",
    children: [
      {
        id: "nav-scrum-business",
        label: "ScrumBusiness",
        href: "/scrum/scrum-business",
        displayOrder: 710,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "user",
      },
      {
        id: "nav-scrum-help",
        label: "Aide Scrum",
        href: "/scrum/help",
        displayOrder: 720,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "user",
      },
    ],
  },

  {
    id: "nav-genesis",
    label: "Genesis",
    href: "/genesis",
    description: "Outils de développement",
    displayOrder: 80,
    visible: true,
    disabled: false,
    external: false,
    minPlatformRole: "user",
    children: [
      {
        id: "nav-genesis-copy-to-ia",
        label: "Copy to IA",
        href: "/genesis/copy-to-ia",
        displayOrder: 810,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "user",
      },
      {
        id: "nav-genesis-create-files",
        label: "CreateFiles",
        href: "/genesis/create-files",
        displayOrder: 820,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "user",
      },
      {
        id: "nav-genesis-read-files",
        label: "SelectFiles",
        href: "/genesis/read-files",
        displayOrder: 830,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "user",
      },
      {
        id: "nav-genesis-cmd",
        label: "Commandes",
        href: "/genesis/cmd",
        displayOrder: 840,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "user",
      },
      {
        id: "nav-genesis-help",
        label: "Genesis Help",
        href: "/genesis/help",
        displayOrder: 850,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "user",
      },
    ],
  },
  {
    id: "nav-help",
    label: "Aide",
    href: "/help",
    description: "Administration de l'application",
    displayOrder: 90,
    visible: true,
    disabled: false,
    external: false,
    minPlatformRole: "user",
    children: [
      {
        id: "nav-help/links",
        label: "Liens utiles",
        href: "/help/links",
        displayOrder: 910,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "user",
      },
    ],
  },
];
