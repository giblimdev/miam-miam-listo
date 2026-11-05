/*
path :           app/super-admin/data/catalog/storage.ts
tag :            ["super-admin", "catalog", "storage", "json", "dev-only", "server-only"]
projectId:       <à fournir>
type:            helper
generic:         false

role:            Persistance LOCALE des catalogues (dev uniquement).
                 Lit et écrit un seul fichier JSON
                 (data/catalog-types.json) contenant les 3 tableaux
                 (merchant, product, food).

                 ⚠️ GARDE PRODUCTION : toutes les fonctions d'écriture
                 lèvent une erreur si NODE_ENV === "production".
                 Toutes les fonctions de lecture retournent les
                 constantes `.ts` en prod (jamais le JSON). C'est le
                 fallback en dur exigé.

                 ⚠️ FALLBACK DEV : si le JSON n'existe pas encore,
                 la première lecture SEED le fichier à partir des
                 constantes `.ts` (MERCHANT_TYPES, PRODUCT_TYPES,
                 FOOD_TYPES) et le retourne.

                 ⚠️ ÉCRITURE ATOMIQUE : tmp + rename pour éviter la
                 corruption en cas d'interruption.

                 Importable UNIQUEMENT côté serveur (server-only).

flow:            readCatalogData() → si prod : buildCatalogDataFromSeeds()
                 → sinon : lit data/catalog-types.json → si absent :
                 seed + write → retourne. writeCatalogData(data) → si
                 prod : throw → sinon : écrit tmp puis rename.
                 buildCatalogDataFromSeeds() → importe les constantes
                 `.ts` et les mappe en CatalogData.

ecosystem:       SuperAdminCatalog = [
                   "@/app/super-admin/data/catalog/actions.ts",
                   "@/app/super-admin/data/catalog/service.ts",
                   "@/app/super-admin/data/catalog/storage.ts",
                   "@/app/super-admin/data/catalog/types.ts",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
                   "@/app/super-admin/interface/page.tsx",
                 ]

relatedFiles:    ["@/app/super-admin/data/catalog/types.ts",
                  "@/app/super-admin/data/mercantType.ts",
                  "@/app/super-admin/data/productType.ts",
                  "@/app/super-admin/data/foodTypeData.ts"]

imports:         ["server-only", "node:fs/promises", "node:path",
                  "@/app/super-admin/data/catalog/types",
                  "@/app/super-admin/data/mercantType",
                  "@/app/super-admin/data/productType",
                  "@/app/super-admin/data/foodTypeData"]

exports:         ["readCatalogData", "writeCatalogData",
                  "buildCatalogDataFromSeeds", "isCatalogPersistenceEnabled"]

useBy:           ["/app/super-admin/data/catalog/service.ts"]

userStories:     ["*en tant que développeur je veux persister les catalogues en local et fallback en dur en prod"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type {
  CatalogData,
  CatalogItem,
} from "@/app/super-admin/data/catalog/types";
import { MERCHANT_TYPES } from "@/app/super-admin/data/mercantType";
import { PRODUCT_TYPES } from "@/app/super-admin/data/productType";
import { FOOD_TYPES } from "@/app/super-admin/data/foodTypeData";

/* ------------------------------------------------------------------ */
/*  Chemins                                                            */
/* ------------------------------------------------------------------ */

const DATA_DIR = join(process.cwd(), "data");
const CATALOG_FILE = join(DATA_DIR, "catalog-types.json");

/* ------------------------------------------------------------------ */
/*  Garde production                                                   */
/* ------------------------------------------------------------------ */

export function isCatalogPersistenceEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

function assertDev(): void {
  if (!isCatalogPersistenceEnabled()) {
    throw new Error(
      "[catalog/storage] Écriture désactivée en production. Les catalogues sont en dur.",
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Conversion seeds → CatalogData                                     */
/* ------------------------------------------------------------------ */

export function buildCatalogDataFromSeeds(): CatalogData {
  const merchant: CatalogItem[] = MERCHANT_TYPES.map((item, index) => ({
    slug: item.id,
    label: item.label,
    accent: item.accent,
    visibility: item.visibility,
    order: index,
  }));

  const product: CatalogItem[] = PRODUCT_TYPES.map((item, index) => ({
    slug: item.id,
    label: item.label,
    accent: item.accent,
    visibility: item.visibility,
    order: index,
  }));

  const food: CatalogItem[] = FOOD_TYPES.map((item, index) => ({
    slug: item.text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    label: item.text,
    imageSrc: item.src,
    visibility: item.visibility,
    order: index,
  }));

  return { merchant, product, food };
}

/* ------------------------------------------------------------------ */
/*  Lecture                                                            */
/* ------------------------------------------------------------------ */

export async function readCatalogData(): Promise<CatalogData> {
  /* En production : pas de fs, on retourne les constantes `.ts`. */
  if (!isCatalogPersistenceEnabled()) {
    return buildCatalogDataFromSeeds();
  }

  try {
    const raw = await readFile(CATALOG_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<CatalogData>;

    /* Validation minimale : chaque catégorie doit être un tableau. */
    if (
      !Array.isArray(parsed.merchant) ||
      !Array.isArray(parsed.product) ||
      !Array.isArray(parsed.food)
    ) {
      throw new Error("JSON mal formé.");
    }

    return {
      merchant: parsed.merchant,
      product: parsed.product,
      food: parsed.food,
    };
  } catch (error) {
    /* ENOENT (fichier absent) → seed à partir des constantes `.ts`. */
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      const seeded = buildCatalogDataFromSeeds();
      await writeCatalogData(seeded);
      return seeded;
    }

    /* Autre erreur (JSON corrompu, etc.) → on remonte. */
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/*  Écriture atomique                                                  */
/* ------------------------------------------------------------------ */

export async function writeCatalogData(data: CatalogData): Promise<void> {
  assertDev();

  const tmp = `${CATALOG_FILE}.tmp`;

  await mkdir(dirname(CATALOG_FILE), { recursive: true });
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await rename(tmp, CATALOG_FILE);
}