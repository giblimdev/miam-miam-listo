/*
path :           app/super-admin/interface/page.tsx
tag :            ["super-admin", "data", "page", "catalog", "responsive"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de gestion des trois catalogues de données
                 statiques du projet :
                 - types de commerçant (MERCHANT_TYPES) ;
                 - types de produit (PRODUCT_TYPES) ;
                 - types de cuisine (FOOD_TYPES).

                 Sync page + Suspense ; la lecture des constantes est
                 isolée dans un composant async. Header avec compteurs
                 par catalogue (nombre total + nombre visible).

                 ⚠️ GESTION EN MÉMOIRE : les modifications (toggle,
                 ajout, suppression) sont locales au composant client
                 DataCatalogManager et NE PERSISTENT PAS. Pour une
                 persistance réelle, il faudra Prisma + Zod + Server
                 Actions.

flow:            Sync page → header (titre + compteurs) → Suspense →
                 <DataSection /> async → lit MERCHANT_TYPES,
                 PRODUCT_TYPES, FOOD_TYPES → rend <DataCatalogManager />.

ecosystem:       SuperAdminData = [
                   "@/app/super-admin/data/foodTypeData.ts",
                   "@/app/super-admin/data/mercantType.ts",
                   "@/app/super-admin/data/productType.ts",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
                   "@/app/super-admin/interface/page.tsx",
                 ]

relatedFiles:    ["@/app/super-admin/data/mercantType.ts",
                  "@/app/super-admin/data/productType.ts",
                  "@/app/super-admin/data/foodTypeData.ts",
                  "@/app/super-admin/data/DataCatalogManager.tsx"]

imports:         ["next", "react",
                  "@/app/super-admin/data/mercantType",
                  "@/app/super-admin/data/productType",
                  "@/app/super-admin/data/foodTypeData",
                  "@/app/super-admin/data/DataCatalogManager",
                  "@/components/ui/skeleton"]

exports:         ["default SuperAdminDataPage", "metadata"]

useBy:           []

userStories:     ["*en tant que super-admin je veux gérer les catalogues de types"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import type { Metadata } from "next";
import { Suspense } from "react";

import { MERCHANT_TYPES } from "@/app/super-admin/data/mercantType";
import { PRODUCT_TYPES } from "@/app/super-admin/data/productType";
import { FOOD_TYPES } from "@/app/super-admin/data/foodTypeData";
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

export default function SuperAdminDataPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
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

        {/* Compteurs rapides */}
        <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Commerçants
            </dt>
            <dd className="text-lg font-bold tabular-nums text-foreground">
              {MERCHANT_TYPES.length}
            </dd>
          </div>
          <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Produits
            </dt>
            <dd className="text-lg font-bold tabular-nums text-foreground">
              {PRODUCT_TYPES.length}
            </dd>
          </div>
          <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cuisines
            </dt>
            <dd className="text-lg font-bold tabular-nums text-foreground">
              {FOOD_TYPES.length}
            </dd>
          </div>
        </dl>
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
  return (
    <DataCatalogManager
      merchantTypes={MERCHANT_TYPES}
      productTypes={PRODUCT_TYPES}
      foodTypes={FOOD_TYPES}
    />
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