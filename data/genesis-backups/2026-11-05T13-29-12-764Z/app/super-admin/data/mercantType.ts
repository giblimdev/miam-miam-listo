/*
path :           app/super-admin/data/mercantType.ts
tag :            ["super-admin", "data", "merchant-type", "config", "catalog"]
projectId:       <à fournir>
type:            config
generic:         true

role:            Source de vérité statique des types de commerçant
                 (restaurant, food-truck, supérette, épicerie, primeur,
                 marché…). Chaque entrée porte un identifiant stable
                 (id), un libellé (label), une icône Lucide (icon),
                 une couleur d'accent Tailwind (accent) et une
                 visibilité (visibility) qui pilote l'affichage dans
                 les formulaires d'onboarding commerçant.

                 Aucune I/O, aucun état : simple tableau typé exposé
                 tel quel. La gestion (toggle visibility, ajout,
                 suppression) est déléguée au composant client
                 DataCatalogManager, qui travaille sur une copie en
                 mémoire. Pour une persistance réelle, il faudra un
                 modèle Prisma + validation Zod + Server Actions.

flow:            Module TypeScript pur → export du type MerchantType
                 et de la constante MERCHANT_TYPES (readonly). Aucun
                 effet.

ecosystem:       SuperAdminData = [
                   "@/app/super-admin/data/foodTypeData.ts",
                   "@/app/super-admin/data/mercantType.ts",
                   "@/app/super-admin/data/productType.ts",
                   "@/app/super-admin/data/page.tsx",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
                 ]

relatedFiles:    ["@/app/super-admin/data/foodTypeData.ts",
                  "@/app/super-admin/data/productType.ts",
                  "@/app/super-admin/data/DataCatalogManager.tsx"]

imports:         ["lucide-react"]

exports:         ["MerchantType", "MERCHANT_TYPES"]

useBy:           ["@/app/super-admin/data/page.tsx"]

userStories:     ["*en tant que super-admin je veux gérer les types de commerçant"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import {
  Store,
  UtensilsCrossed,
  Truck,
  ShoppingBasket,
  Apple,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface MerchantType {
  /** Identifiant stable (slug kebab-case, unique). */
  readonly id: string;
  /** Libellé affiché. */
  readonly label: string;
  /** Icône Lucide affichée à gauche du libellé. */
  readonly icon: LucideIcon;
  /** Couleur d'accent Tailwind (ex. "chart-1"). */
  readonly accent: string;
  /** Visible dans les formulaires d'onboarding. */
  readonly visibility: boolean;
}

/* ------------------------------------------------------------------ */
/*  Données                                                            */
/* ------------------------------------------------------------------ */

export const MERCHANT_TYPES: readonly MerchantType[] = [
  {
    id: "restaurant",
    label: "Restaurant",
    icon: UtensilsCrossed,
    accent: "chart-1",
    visibility: true,
  },
  {
    id: "food-truck",
    label: "Food-truck",
    icon: Truck,
    accent: "chart-2",
    visibility: true,
  },
  {
    id: "superette",
    label: "Supérette",
    icon: ShoppingBasket,
    accent: "chart-3",
    visibility: true,
  },
  {
    id: "epicerie",
    label: "Épicerie",
    icon: ShoppingCart,
    accent: "chart-4",
    visibility: true,
  },
  {
    id: "primeur",
    label: "Primeur",
    icon: Apple,
    accent: "chart-5",
    visibility: true,
  },
  {
    id: "marche",
    label: "Marché",
    icon: Store,
    accent: "chart-1",
    visibility: true,
  },
];