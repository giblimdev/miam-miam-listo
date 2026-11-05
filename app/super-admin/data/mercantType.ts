/*
path :           app/super-admin/data/mercantType.ts
tag :            ["super-admin", "data", "merchant-type", "config", "catalog", "rsc"]
projectId:       <à fournir>
type:            config
generic:         true

role:            Source de vérité statique des types de commerçant.

                 ⚠️ AUCUNE ICÔNE LUCIDE : chaque entrée porte un
                 `imageSrc` (chemin public) au lieu d'un composant.
                 Le module reste purement sérialisable.

                 ⚠️ AJOUT `imageSrc` : merchant et product disposent
                 désormais d'une image comme les food, pour un rendu
                 cohérent dans DataCatalogManager (image + overlay
                 accent).

flow:            Module TypeScript pur → export du type MerchantType
                 et de la constante MERCHANT_TYPES (readonly).

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
                  "/app/super-admin/data/catalog/storage.ts"]

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
  readonly id: string;
  readonly label: string;
  /** Chemin public de l'image (ex. "/merchanttype/restaurant.webp"). */
  readonly imageSrc: string;
  /** Couleur d'accent Tailwind (overlay). */
  readonly accent: string;
  readonly visibility: boolean;
}

/* ------------------------------------------------------------------ */
/*  Données                                                            */
/* ------------------------------------------------------------------ */

export const MERCHANT_TYPES: readonly MerchantType[] = [
  { id: "restaurant", label: "Restaurant", imageSrc: "/merchanttype/restaurant.webp", accent: "chart-1", visibility: true },
  { id: "food-truck", label: "Food-truck", imageSrc: "/merchanttype/food-truck.webp", accent: "chart-2", visibility: true },
  { id: "superette", label: "Supérette", imageSrc: "/merchanttype/superette.webp", accent: "chart-3", visibility: true },
  { id: "epicerie", label: "Épicerie", imageSrc: "/merchanttype/epicerie.webp", accent: "chart-4", visibility: true },
  { id: "primeur", label: "Primeur", imageSrc: "/merchanttype/primeur.webp", accent: "chart-5", visibility: true },
  { id: "marche", label: "Marché", imageSrc: "/merchanttype/marche.webp", accent: "chart-1", visibility: true },
];