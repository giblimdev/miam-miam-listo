/*
path :           app/super-admin/data/mercantType.ts
tag :            ["super-admin", "data", "merchant-type", "config", "catalog", "rsc"]
projectId:       <à fournir>
type:            config
generic:         true

role:            Source de vérité statique des types de commerçant
                 (restaurant, food-truck, supérette, épicerie, primeur,
                 marché…).

                 ⚠️ AUCUNE ICÔNE : pas d'import lucide-react, pas de
                 composant React. Chaque entrée ne porte qu'un `id`,
                 un `label`, un `accent` (couleur de la pastille) et
                 une `visibility`. Le module est ainsi purement
                 sérialisable (Server → Client) sans transformation.

flow:            Module TypeScript pur → export du type MerchantType
                 et de la constante MERCHANT_TYPES (readonly). Aucun
                 effet.

ecosystem:       SuperAdminData = [
                   "@/app/super-admin/data/foodTypeData.ts",
                   "@/app/super-admin/data/mercantType.ts",
                   "@/app/super-admin/data/productType.ts",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
                   "@/app/super-admin/interface/page.tsx",
                 ]

relatedFiles:    ["@/app/super-admin/data/foodTypeData.ts",
                  "@/app/super-admin/data/productType.ts",
                  "@/app/super-admin/data/DataCatalogManager.tsx"]

imports:         []

exports:         ["MerchantType", "MERCHANT_TYPES"]

useBy:           ["/app/super-admin/interface/page.tsx",
                  "/app/super-admin/data/DataCatalogManager.tsx"]

userStories:     ["*en tant que super-admin je veux gérer les types de commerçant"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface MerchantType {
  /** Identifiant stable (slug kebab-case, unique). */
  readonly id: string;
  /** Libellé affiché. */
  readonly label: string;
  /** Couleur d'accent Tailwind (pastille colorée, ex. "chart-1"). */
  readonly accent: string;
  /** Visible dans les formulaires d'onboarding. */
  readonly visibility: boolean;
}

/* ------------------------------------------------------------------ */
/*  Données                                                            */
/* ------------------------------------------------------------------ */

export const MERCHANT_TYPES: readonly MerchantType[] = [
  { id: "restaurant", label: "Restaurant", accent: "chart-1", visibility: true },
  { id: "food-truck", label: "Food-truck", accent: "chart-2", visibility: true },
  { id: "superette", label: "Supérette", accent: "chart-3", visibility: true },
  { id: "epicerie", label: "Épicerie", accent: "chart-4", visibility: true },
  { id: "primeur", label: "Primeur", accent: "chart-5", visibility: true },
  { id: "marche", label: "Marché", accent: "chart-1", visibility: true },
];