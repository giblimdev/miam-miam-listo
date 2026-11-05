/*
path :           app/super-admin/data/catalog/service.ts
tag :            ["super-admin", "catalog", "service", "in-memory", "source-of-truth"]

role:            Service CRUD pour les catalogues, sans AUCUNE I/O.
                 La source de vérité est :
                   - merchant : MERCHANT_TYPES  (mercantType.ts)
                   - product  : PRODUCT_TYPES   (productType.ts)
                   - food     : FOOD_TYPES      (foodType.ts)

                 ⚠️ Les mutations (create / update / delete / toggle)
                 sont IN-MEMORY : elles modifient un cache module-scoped
                 initialisé depuis les constantes. Elles sont perdues
                 au redémarrage du serveur. Aucun fichier, aucun JSON.

flow:            listCatalog(category) → getStore()[category]
                 createCatalogItem → calcule slug unique → push
                 updateCatalogItem → merge
                 deleteCatalogItem → filter
                 toggleCatalogVisibility → patch visibility
*/

import { MERCHANT_TYPES } from "@/app/super-admin/data/mercantType";
import { PRODUCT_TYPES } from "@/app/super-admin/data/productType";
import { FOOD_TYPES } from "@/app/super-admin/data/foodType";
import type {
  CatalogCategory,
  CatalogData,
  CatalogItem,
} from "@/app/super-admin/data/catalog/types";

/* ------------------------------------------------------------------ */
/*  Input                                                              */
/* ------------------------------------------------------------------ */

export interface CatalogInput {
  readonly label: string;
  readonly accent?: string;
  readonly imageSrc?: string;
}

/* ------------------------------------------------------------------ */
/*  Seeds depuis les constantes .ts                                    */
/* ------------------------------------------------------------------ */

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildInitialData(): CatalogData {
  const merchant: CatalogItem[] = MERCHANT_TYPES.map((item, index) => ({
    slug: item.id,
    label: item.label,
    accent: item.accent,
    imageSrc: item.imageSrc,
    visibility: item.visibility,
    order: index,
  }));

  const product: CatalogItem[] = PRODUCT_TYPES.map((item, index) => ({
    slug: item.id,
    label: item.label,
    accent: item.accent,
    imageSrc: item.imageSrc,
    visibility: item.visibility,
    order: index,
  }));

  const food: CatalogItem[] = FOOD_TYPES.map((item, index) => ({
    slug: slugify(item.text),
    label: item.text,
    imageSrc: item.src,
    visibility: item.visibility,
    order: index,
  }));

  return { merchant, product, food };
}

/* ------------------------------------------------------------------ */
/*  Store in-memory (module-scoped)                                    */
/* ------------------------------------------------------------------ */

// Initialisé paresseusement au premier accès, puis muté par les
// opérations d'écriture. Aucune persistance disque.
let store: CatalogData | null = null;

function getStore(): CatalogData {
  if (store === null) {
    store = buildInitialData();
  }
  return store;
}

function replaceCategory(
  data: CatalogData,
  category: CatalogCategory,
  items: readonly CatalogItem[],
): CatalogData {
  return { ...data, [category]: items };
}

function uniqueSlug(
  label: string,
  existing: ReadonlySet<string>,
): string {
  const base = slugify(label) || "item";
  if (!existing.has(base)) return base;
  for (let i = 2; i <= 999; i++) {
    const candidate = `${base}-${i}`;
    if (!existing.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/* ------------------------------------------------------------------ */
/*  Lecture                                                            */
/* ------------------------------------------------------------------ */

export async function listCatalog(
  category: CatalogCategory,
): Promise<readonly CatalogItem[]> {
  return getStore()[category];
}

/* ------------------------------------------------------------------ */
/*  Création                                                           */
/* ------------------------------------------------------------------ */

export async function createCatalogItem(
  category: CatalogCategory,
  input: CatalogInput,
): Promise<CatalogItem> {
  const trimmed = input.label.trim();
  if (!trimmed) {
    throw new Error("Le libellé est requis.");
  }

  const data = getStore();
  const items = data[category];
  const existing = new Set(items.map((i) => i.slug));

  const item: CatalogItem = {
    slug: uniqueSlug(trimmed, existing),
    label: trimmed,
    accent: input.accent,
    imageSrc: input.imageSrc,
    visibility: true,
    order: items.length,
  };

  store = replaceCategory(data, category, [...items, item]);
  return item;
}

/* ------------------------------------------------------------------ */
/*  Mise à jour                                                        */
/* ------------------------------------------------------------------ */

export async function updateCatalogItem(
  category: CatalogCategory,
  slug: string,
  patch: Partial<CatalogInput>,
): Promise<CatalogItem> {
  const data = getStore();
  const items = data[category];
  const existing = items.find((i) => i.slug === slug);
  if (!existing) {
    throw new Error(`Item introuvable : ${slug}`);
  }

  const updated: CatalogItem = {
    ...existing,
    ...(patch.label !== undefined ? { label: patch.label.trim() } : {}),
    ...(patch.accent !== undefined ? { accent: patch.accent } : {}),
    ...(patch.imageSrc !== undefined ? { imageSrc: patch.imageSrc } : {}),
  };

  store = replaceCategory(
    data,
    category,
    items.map((i) => (i.slug === slug ? updated : i)),
  );
  return updated;
}

/* ------------------------------------------------------------------ */
/*  Suppression                                                        */
/* ------------------------------------------------------------------ */

export async function deleteCatalogItem(
  category: CatalogCategory,
  slug: string,
): Promise<void> {
  const data = getStore();
  const items = data[category];
  const exists = items.some((i) => i.slug === slug);
  if (!exists) {
    throw new Error(`Item introuvable : ${slug}`);
  }

  store = replaceCategory(
    data,
    category,
    items.filter((i) => i.slug !== slug),
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle visibilité                                                  */
/* ------------------------------------------------------------------ */

export async function toggleCatalogVisibility(
  category: CatalogCategory,
  slug: string,
  visible: boolean,
): Promise<CatalogItem> {
  const data = getStore();
  const items = data[category];
  const existing = items.find((i) => i.slug === slug);
  if (!existing) {
    throw new Error(`Item introuvable : ${slug}`);
  }

  const updated: CatalogItem = { ...existing, visibility: visible };
  store = replaceCategory(
    data,
    category,
    items.map((i) => (i.slug === slug ? updated : i)),
  );
  return updated;
}