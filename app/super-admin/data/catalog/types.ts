/*
path :           app/super-admin/data/catalog/types.ts
tag :            ["super-admin", "catalog", "types", "config"]
projectId:       <à fournir>
type:            config
generic:         true

role:            Types partagés du système de catalogues persistés.
                 Définit l'union des 3 catégories (merchant, product,
                 food) et la forme commune d'un item de catalogue.
                 Utilisé par storage.ts, service.ts, actions.ts, la
                 page interface et le composant client.

                 Un seul modèle d'item pour les 3 catalogues :
                 - `slug` : identifiant stable (unique par catégorie).
                 - `label` : libellé affiché.
                 - `accent` : couleur Tailwind (merchant / product).
                 - `imageSrc` : chemin public (food uniquement).
                 - `visibility` : booléen.
                 - `order` : position d'affichage (réordonnancement
                   futur).

flow:            Module TypeScript pur → export des types
                 CatalogCategory, CatalogItem, CatalogData et des
                 constantes CATALOG_CATEGORIES. Aucun effet.

ecosystem:       SuperAdminCatalog = [
                   "@/app/super-admin/data/catalog/actions.ts",
                   "@/app/super-admin/data/catalog/service.ts",
                   "@/app/super-admin/data/catalog/storage.ts",
                   "@/app/super-admin/data/catalog/types.ts",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
                   "@/app/super-admin/interface/page.tsx",
                 ]

relatedFiles:    ["@/app/super-admin/data/catalog/storage.ts",
                  "@/app/super-admin/data/catalog/service.ts",
                  "@/app/super-admin/data/catalog/actions.ts"]

imports:         []

exports:         ["CatalogCategory", "CatalogItem", "CatalogData",
                  "CATALOG_CATEGORIES"]

useBy:           ["/app/super-admin/data/catalog/storage.ts",
                  "/app/super-admin/data/catalog/service.ts",
                  "/app/super-admin/data/catalog/actions.ts",
                  "/app/super-admin/data/DataCatalogManager.tsx",
                  "/app/super-admin/interface/page.tsx"]

userStories:     ["*en tant que développeur je veux des types partagés pour les catalogues persistés"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CatalogCategory = "merchant" | "product" | "food";

export const CATALOG_CATEGORIES: readonly CatalogCategory[] = [
  "merchant",
  "product",
  "food",
] as const;

/**
 * Item commun aux 3 catalogues.
 *
 * - merchant / product : `accent` est défini, `imageSrc` est undefined.
 * - food               : `imageSrc` est défini, `accent` peut être défini
 *                        (couleur de la pastille) ou undefined.
 */
export interface CatalogItem {
  readonly slug: string;
  readonly label: string;
  readonly accent?: string;
  readonly imageSrc?: string;
  readonly visibility: boolean;
  readonly order: number;
}

/**
 * Structure du fichier JSON persisté (dev uniquement).
 * Un seul fichier, trois tableaux.
 */
export interface CatalogData {
  readonly merchant: readonly CatalogItem[];
  readonly product: readonly CatalogItem[];
  readonly food: readonly CatalogItem[];
}