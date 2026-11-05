/*
path :           app/super-admin/data/productType.ts
tag :            ["super-admin", "data", "product-type", "config", "catalog", "rsc"]
projectId:       <à fournir>
type:            config
generic:         true

role:            Source de vérité statique des types de produit
                 (repas, boisson, dessert, snack, ingrédient, lot).

                 ⚠️ AUCUNE ICÔNE : pas d'import lucide-react, pas de
                 composant React. Chaque entrée ne porte qu'un `id`,
                 un `label`, un `accent` et une `visibility`. Module
                 purement sérialisable.

flow:            Module TypeScript pur → export du type ProductType
                 et de la constante PRODUCT_TYPES (readonly). Aucun
                 effet.

ecosystem:       SuperAdminData = [
                   "@/app/super-admin/data/foodTypeData.ts",
                   "@/app/super-admin/data/mercantType.ts",
                   "@/app/super-admin/data/productType.ts",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
                   "@/app/super-admin/interface/page.tsx",
                 ]

relatedFiles:    ["@/app/super-admin/data/foodTypeData.ts",
                  "@/app/super-admin/data/mercantType.ts",
                  "@/app/super-admin/data/DataCatalogManager.tsx"]

imports:         []

exports:         ["ProductType", "PRODUCT_TYPES"]

useBy:           ["/app/super-admin/interface/page.tsx",
                  "/app/super-admin/data/DataCatalogManager.tsx"]

userStories:     ["*en tant que super-admin je veux gérer les types de produit"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ProductType {
  /** Identifiant stable (slug kebab-case, unique). */
  readonly id: string;
  /** Libellé affiché. */
  readonly label: string;
  /** Couleur d'accent Tailwind (pastille colorée, ex. "chart-1"). */
  readonly accent: string;
  /** Visible dans les formulaires de création de produit. */
  readonly visibility: boolean;
}

/* ------------------------------------------------------------------ */
/*  Données                                                            */
/* ------------------------------------------------------------------ */

export const PRODUCT_TYPES: readonly ProductType[] = [
  { id: "repas", label: "Repas", accent: "chart-1", visibility: true },
  { id: "boisson", label: "Boisson", accent: "chart-2", visibility: true },
  { id: "dessert", label: "Dessert", accent: "chart-3", visibility: true },
  { id: "snack", label: "Snack", accent: "chart-4", visibility: true },
  { id: "ingredient", label: "Ingrédient", accent: "chart-5", visibility: true },
  { id: "lot", label: "Lot", accent: "chart-1", visibility: true },
];