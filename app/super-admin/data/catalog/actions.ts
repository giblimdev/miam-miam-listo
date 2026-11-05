/*
path :           app/super-admin/data/catalog/actions.ts
tag :            ["super-admin", "catalog", "actions", "server-action"]
projectId:       <à fournir>
type:            action
generic:         false

role:            Server Actions pour la gestion des catalogues. Minces
                 : chaque action valide ses entrées, appelle le
                 service correspondant, revalide /super-admin/interface
                 et retourne un ActionResult.

                 ⚠️ GARDE PRODUCTION : en prod, le service lève une
                 erreur via storage.assertDev(). L'action la convertit
                 en { ok: false, error }. Le front affiche l'erreur
                 dans un toast, ce qui est cohérent avec l'idée «
                 édition désactivée en production ».

flow:            createCatalogItemAction(category, label) →
                 parse → service.createCatalogItem → revalidatePath
                 → ActionResult.
                 updateCatalogItemAction(category, slug, patch) →
                 parse → service.updateCatalogItem → revalidatePath
                 → ActionResult.
                 deleteCatalogItemAction(category, slug) →
                 service.deleteCatalogItem → revalidatePath →
                 ActionResult.
                 toggleCatalogVisibilityAction(category, slug,
                 visible) → service.toggleCatalogVisibility →
                 revalidatePath → ActionResult.

ecosystem:       SuperAdminCatalog = [
                   "@/app/super-admin/data/catalog/actions.ts",
                   "@/app/super-admin/data/catalog/service.ts",
                   "@/app/super-admin/data/catalog/storage.ts",
                   "@/app/super-admin/data/catalog/types.ts",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
                   "@/app/super-admin/interface/page.tsx",
                 ]

relatedFiles:    ["@/app/super-admin/data/catalog/service.ts",
                  "@/app/super-admin/data/catalog/types.ts",
                  "@/lib/actions/result.ts"]

imports:         ["next/cache",
                  "@/app/super-admin/data/catalog/service",
                  "@/app/super-admin/data/catalog/types",
                  "@/lib/actions/result"]

exports:         ["createCatalogItemAction", "updateCatalogItemAction",
                  "deleteCatalogItemAction", "toggleCatalogVisibilityAction"]

useBy:           ["/app/super-admin/data/DataCatalogManager.tsx"]

userStories:     ["*en tant que super-admin je veux gérer les catalogues de types"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use server";

import { revalidatePath } from "next/cache";

import {
  createCatalogItem,
  deleteCatalogItem,
  toggleCatalogVisibility,
  updateCatalogItem,
} from "@/app/super-admin/data/catalog/service";
import type {
  CatalogCategory,
  CatalogItem,
} from "@/app/super-admin/data/catalog/types";
import {
  handleActionError,
  type ActionResult,
} from "@/lib/actions/result";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function revalidate(): void {
  revalidatePath("/super-admin/interface");
}

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

export async function createCatalogItemAction(
  category: CatalogCategory,
  label: string,
): Promise<ActionResult<CatalogItem>> {
  try {
    const item = await createCatalogItem(category, { label });
    revalidate();
    return { ok: true, data: item };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateCatalogItemAction(
  category: CatalogCategory,
  slug: string,
  patch: { readonly label?: string },
): Promise<ActionResult<CatalogItem>> {
  try {
    const item = await updateCatalogItem(category, slug, patch);
    revalidate();
    return { ok: true, data: item };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteCatalogItemAction(
  category: CatalogCategory,
  slug: string,
): Promise<ActionResult<null>> {
  try {
    await deleteCatalogItem(category, slug);
    revalidate();
    return { ok: true, data: null };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function toggleCatalogVisibilityAction(
  category: CatalogCategory,
  slug: string,
  visible: boolean,
): Promise<ActionResult<CatalogItem>> {
  try {
    const item = await toggleCatalogVisibility(category, slug, visible);
    revalidate();
    return { ok: true, data: item };
  } catch (error) {
    return handleActionError(error);
  }
}