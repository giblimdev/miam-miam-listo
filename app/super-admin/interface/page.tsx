/*
path :           app/super-admin/interface/page.tsx
tag :            ["super-admin", "catalog", "page", "persistence"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de gestion des catalogues de types (commerçant,
                 produit, cuisine).

                 ⚠️ PERSISTANCE : en DEV, lecture depuis
                 data/catalog-types.json via le service. En PROD,
                 lecture depuis les constantes `.ts` (fallback en
                 dur). Le composant client ne sait pas d'où viennent
                 les données.

flow:            Sync page → header → Suspense → <DataSection />
                 async → Promise.all([
                   listCatalog("merchant"),
                   listCatalog("product"),
                   listCatalog("food")
                 ]) → <DataCatalogManager /> avec les 3 listes.

ecosystem:       SuperAdminCatalog = [
                   "@/app/super-admin/data/catalog/actions.ts",
                   "@/app/super-admin/data/catalog/service.ts",
                   "@/app/super-admin/data/catalog/storage.ts",
                   "@/app/super-admin/data/catalog/types.ts",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
                   "@/app/super-admin/interface/page.tsx",
                 ]

relatedFiles:    ["@/app/super-admin/data/catalog/service.ts",
                  "@/app/super-admin/data/DataCatalogManager.tsx"]

imports:         ["next", "react",
                  "@/app/super-admin/data/catalog/service",
                  "@/app/super-admin/data/DataCatalogManager",
                  "@/components/ui/skeleton"]

exports:         ["default SuperAdminInterfacePage", "metadata"]

useBy:           []

userStories:     ["*en tant que super-admin je veux gérer les catalogues de types"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import type { Metadata } from "next";
import { Suspense } from "react";

import { listCatalog } from "@/app/super-admin/data/catalog/service";
import { DataCatalogManager } from "@/app/super-admin/data/DataCatalogManager";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Catalogues — Super-admin",
  description:
    "Gestion des types de commerçant, types de produit et types de cuisine.",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SuperAdminInterfacePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-2">
          Super-admin · Données
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Catalogues
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Gérez les types de commerçant, de produit et de cuisine utilisés
          dans les formulaires et les filtres du catalogue public.
        </p>
      </header>

      <Suspense fallback={<DataSkeleton />}>
        <DataSection />
      </Suspense>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section async                                                      */
/* ------------------------------------------------------------------ */

async function DataSection() {
  const [merchant, product, food] = await Promise.all([
    listCatalog("merchant"),
    listCatalog("product"),
    listCatalog("food"),
  ]);

  return (
    <DataCatalogManager merchant={merchant} product={product} food={food} />
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function DataSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}