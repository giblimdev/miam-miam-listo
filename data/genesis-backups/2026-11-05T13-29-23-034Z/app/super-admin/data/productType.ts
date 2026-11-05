/*
path :           app/super-admin/data/productType.ts
tag :            ["super-admin", "data", "product-type", "config", "catalog"]
projectId:       <à fournir>
type:            config
generic:         true

role:            Source de vérité statique des types de produit
                 (repas, boisson, dessert, snack, ingrédient, lot).
                 Chaque entrée porte un identifiant stable (id), un
                 libellé (label), une icône Lucide (icon), une couleur
                 d'accent Tailwind (accent) et une visibilité
                 (visibility) qui pilote l'affichage dans les
                 formulaires de création de produit.

                 Aucune I/O, aucun état. La gestion (toggle visibility,
                 ajout, suppression) est déléguée au composant client
                 DataCatalogManager. Pour une persistance réelle, il
                 faudra un modèle Prisma + validation Zod + Server
                 Actions.

flow:            Module TypeScript pur → export du type ProductType
                 et de la constante PRODUCT_TYPES (readonly). Aucun
                 effet.

ecosystem:       SuperAdminData = [
                   "@/app/super-admin/data/foodTypeData.ts",
                   "@/app/super-admin/data/mercantType.ts",
                   "@/app/super-admin/data/productType.ts",
                   "@/app/super-admin/data/page.tsx",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
                 ]

relatedFiles:    ["@/app/super-admin/data/foodTypeData.ts",
                  "@/app/super-admin/data/mercantType.ts",
                  "@/app/super-admin/data/DataCatalogManager.tsx"]

imports:         ["lucide-react"]

exports:         ["ProductType", "PRODUCT_TYPES"]

useBy:           ["@/app/super-admin/data/page.tsx"]

userStories:     ["*en tant que super-admin je veux gérer les types de produit"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import {
  ChefHat,
  CupSoda,
  Cake,
  Cookie,
  Wheat,
  Package,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ProductType {
  /** Identifiant stable (slug kebab-case, unique). */
  readonly id: string;
  /** Libellé affiché. */
  readonly label: string;
  /** Icône Lucide affichée à gauche du libellé. */
  readonly icon: LucideIcon;
  /** Couleur d'accent Tailwind (ex. "chart-1"). */
  readonly accent: string;
  /** Visible dans les formulaires de création de produit. */
  readonly visibility: boolean;
}

/* ------------------------------------------------------------------ */
/*  Données                                                            */
/* ------------------------------------------------------------------ */

export const PRODUCT_TYPES: readonly ProductType[] = [
  {
    id: "repas",
    label: "Repas",
    icon: ChefHat,
    accent: "chart-1",
    visibility: true,
  },
  {
    id: "boisson",
    label: "Boisson",
    icon: CupSoda,
    accent: "chart-2",
    visibility: true,
  },
  {
    id: "dessert",
    label: "Dessert",
    icon: Cake,
    accent: "chart-3",
    visibility: true,
  },
  {
    id: "snack",
    label: "Snack",
    icon: Cookie,
    accent: "chart-4",
    visibility: true,
  },
  {
    id: "ingredient",
    label: "Ingrédient",
    icon: Wheat,
    accent: "chart-5",
    visibility: true,
  },
  {
    id: "lot",
    label: "Lot",
    icon: Package,
    accent: "chart-1",
    visibility: true,
  },
];