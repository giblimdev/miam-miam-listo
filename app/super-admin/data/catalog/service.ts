/*
path :           app/super-admin/data/catalog/service.ts
tag :            ["super-admin", "catalog", "service", "crud", "dev-only"]
projectId:       <à fournir>
type:            helper
generic:         false

role:            Service CRUD pour les catalogues. Un seul service
                 pour les 3 catégories (merchant, product, food),
                 discriminé par `category`. Chaque opération
                 d'écriture est gardée par la garde production
                 (storage.assertDev) : en prod, elle lève une erreur,
                 l'action la convertit en ActionResult.

                 Le service ne connaît PAS les composants React ni
                 les Server Actions : il ne manipule que CatalogData
                 via storage. C'est l'unique point de lecture/écriture
                 des catalogues côté serveur.

flow:            listCatalog(category) → readCatalogData() →
                 retourne data[category].
                 createCatalogItem(category, input) → read → calcule
                 l'id unique (slug) → push → write → retourne l'item.
                 updateCatalogItem(category, slug, patch) → read →
                 find + merge → write → retourne l'item mis à jour.
                 deleteCatalogItem(category, slug) → read → filter
                 → write.
                 toggleCatalogVisibility(category, slug, visible) →
                 read → map + patch visibility → write → retourne
                 l'item.

ecosystem:       SuperAdminCatalog = [
                   "@/app/super-admin/data/catalog/actions.ts",
                   "@/app/super-admin/data/catalog/service.ts",
                   "@/app/super-admin/data/catalog/storage.ts",
                   "@/app/super-admin/data/catalog/types.ts",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
                   "@/app/super-admin/interface/page.tsx",
                 ]

relatedFiles:    ["@/app/super-admin/data/catalog/storage.ts",
                  "@/app/super-admin/data/catalog/types.ts"]

imports:         ["@/app/super-admin/data/catalog/storage",
                  "@/app/super-admin/data/catalog/types"]

exports:         ["listCatalog", "createCatalogItem",
                  "updateCatalogItem", "deleteCatalogItem",
                  "toggleCatalogVisibility", "CatalogInput"]

useBy:           ["/app/super-admin/data/catalog/actions.ts",
                  "/app/super-admin/interface/page.tsx"]

userStories:     ["*en tant que super-admin je veux gérer les catalogues de types"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import {
  readCatalogData,
  writeCatalogData,
} from "@/app/super-admin/data/catalog/storage";
import type {
  CatalogCategory,
  CatalogData,
  CatalogItem,
} from "@/app/super-admin/data/catalog/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CatalogInput {
  readonly label: string;
  readonly accent?: string;
  readonly imageSrc?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function replaceCategory(
  data: CatalogData,
  category: CatalogCategory,
  items: readonly CatalogItem[],
): CatalogData {
  return { ...data, [category]: items };
}

/* ------------------------------------------------------------------ */
/*  Lecture                                                            */
/* ------------------------------------------------------------------ */

export async function listCatalog(
  category: CatalogCategory,
): Promise<readonly CatalogItem[]> {
  const data = await readCatalogData();
  return data[category];
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

  const data = await readCatalogData();
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

  await writeCatalogData(replaceCategory(data, category, [...items, item]));
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
  const data = await readCatalogData();
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

  await writeCatalogData(
    replaceCategory(
      data,
      category,
      items.map((i) => (i.slug === slug ? updated : i)),
    ),
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
  const data = await readCatalogData();
  const items = data[category];
  const exists = items.some((i) => i.slug === slug);
  if (!exists) {
    throw new Error(`Item introuvable : ${slug}`);
  }

  await writeCatalogData(
    replaceCategory(
      data,
      category,
      items.filter((i) => i.slug !== slug),
    ),
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
  const data = await readCatalogData();
  const items = data[category];
  const existing = items.find((i) => i.slug === slug);
  if (!existing) {
    throw new Error(`Item introuvable : ${slug}`);
  }

  const updated: CatalogItem = { ...existing, visibility: visible };
  await writeCatalogData(
    replaceCategory(
      data,
      category,
      items.map((i) => (i.slug === slug ? updated : i)),
    ),
  );
  return updated;
}