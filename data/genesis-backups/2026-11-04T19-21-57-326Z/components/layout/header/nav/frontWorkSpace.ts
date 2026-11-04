/*
path :           components/layout/header/nav/frontWorkSpace.ts
tag :            ["navigation", "config", "platform-role", "header"]
projectId:       new-genesis
type:            config
generic:         false

role:            Source unique de navigation de l'application. Exporte
                 mainNavData, consommé exclusivement par Header.tsx.
                 Chaque item porte un champ minPlatformRole (PlatformRole)
                 qui détermine le SEUIL hiérarchique pour voir l'item.
                 La hiérarchie est stricte : superAdmin (3) > dev (2) >
                 admin (1) > user (0). Un superAdmin voit donc TOUS les
                 items, quel que soit leur minPlatformRole.

                 Le filtrage effectif est délégué à canSee(item,
                 platformRole) exporté par navTypes.ts (source unique de
                 vérité, partagée par Header.tsx et MainNav.tsx).

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

userStories:     ["*en tant que développeur je veux naviguer dans l'app",
                  "*en tant que superAdmin je veux voir tous les items de navigation"]

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
    id: "nav-client",
    label: "Client",
    href: "/client",
    displayOrder: 20,
    visible: true,
    disabled: false,
    external: false,
    minPlatformRole: "user",
  },
  {
    id: "nav-merchant",
    label: "Merchant",
    href: "/merchant",
    displayOrder: 30,
    visible: true,
    disabled: false,
    external: false,
    minPlatformRole: "user",
  },
  {
    id: "nav-courier",
    label: "Courier",
    href: "/courier",
    displayOrder: 40,
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
    minPlatformRole: "admin",
    children: [
      {
        id: "nav-sup-admin-legal",
        label: "Legal",
        href: "/admin/legal",
        displayOrder: 510,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "admin",
        children: [
          {
            id: "nav-sup-admin-legal-privacy",
            label: "Privacy",
            href: "/admin/legal/privacy",
            displayOrder: 5101,
            visible: true,
            disabled: false,
            external: false,
            minPlatformRole: "admin",
          },
          {
            id: "nav-sup-admin-legal-terms",
            label: "Terms",
            href: "/admin/legal/terms",
            displayOrder: 5102,
            visible: true,
            disabled: false,
            external: false,
            minPlatformRole: "admin",
          },
        ],
      },
    ],
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
    minPlatformRole: "superAdmin",
    children: [
      {
        id: "nav-super-admin-rbca",
        label: "RBCA Role-Based Access Control",
        href: "/super-admin/rbca",
        displayOrder: 610,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "superAdmin",
      },
      {
        id: "nav-admin-users",
        label: "Utilisateurs",
        href: "/super-admin/user-manager",
        displayOrder: 620,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "superAdmin",
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
    minPlatformRole: "dev",
    children: [
      {
        id: "nav-genesis-copy-to-ia",
        label: "Copy to IA",
        href: "/genesis/copy-to-ia",
        displayOrder: 810,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "dev",
      },
      {
        id: "nav-genesis-create-files",
        label: "CreateFiles",
        href: "/genesis/create-files",
        displayOrder: 820,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "dev",
      },
      {
        id: "nav-genesis-read-files",
        label: "SelectFiles",
        href: "/genesis/read-files",
        displayOrder: 830,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "dev",
      },
      {
        id: "nav-genesis-cmd",
        label: "Commandes",
        href: "/genesis/cmd",
        displayOrder: 840,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "dev",
      },
      {
        id: "nav-genesis-help",
        label: "Genesis Help",
        href: "/genesis/help",
        displayOrder: 850,
        visible: true,
        disabled: false,
        external: false,
        minPlatformRole: "dev",
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
