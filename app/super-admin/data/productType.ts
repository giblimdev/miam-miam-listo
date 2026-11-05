/*
path :           app/super-admin/data/productType.ts
tag :            ["super-admin", "data", "product-type", "config", "catalog", "rsc"]
projectId:       <à fournir>
type:            config
generic:         true

role:            Source de vérité statique des types de produit.

                 ⚠️ AUCUNE ICÔNE LUCIDE : chaque entrée porte un
                 `imageSrc` (chemin public).

flow:            Module TypeScript pur → export du type ProductType
                 et de la constante PRODUCT_TYPES (readonly).

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
                  "/app/super-admin/data/catalog/storage.ts"]

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
  readonly id: string;
  readonly label: string;
  /** Chemin public de l'image (ex. "/producttype/repas.webp"). */
  readonly imageSrc: string;
  /** Couleur d'accent Tailwind (overlay). */
  readonly accent: string;
  readonly visibility: boolean;
}

/* ------------------------------------------------------------------ */
/*  Données                                                            */
/* ------------------------------------------------------------------ */

export const PRODUCT_TYPES: readonly ProductType[] = [
  { id: "repas", label: "Repas", imageSrc: "/producttype/repas.webp", accent: "chart-1", visibility: true },
  { id: "boisson", label: "Boisson", imageSrc: "/producttype/boisson.webp", accent: "chart-2", visibility: true },
  { id: "dessert", label: "Dessert", imageSrc: "/producttype/dessert.webp", accent: "chart-3", visibility: true },
  { id: "snack", label: "Snack", imageSrc: "/producttype/snack.webp", accent: "chart-4", visibility: true },
  { id: "ingredient", label: "Ingrédient", imageSrc: "/producttype/ingredient.webp", accent: "chart-5", visibility: true },
  { id: "lot", label: "Lot", imageSrc: "/producttype/lot.webp", accent: "chart-1", visibility: true },
];