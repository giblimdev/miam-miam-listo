/*
path :           app/super-admin/interface/page.tsx
tag :            ["super-admin", "data", "page", "catalog"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de gestion des trois catalogues de données
                 statiques du projet :
                 - types de commerçant (MERCHANT_TYPES) ;
                 - types de produit (PRODUCT_TYPES) ;
                 - types de cuisine (FOOD_TYPES).
                 Sync page + Suspense ; la lecture des constantes est
                 isolée dans un composant async (pattern identique à
                 user-manager/page.tsx). Aucune I/O, aucune mutation
                 serveur : les trois constantes sont importées
                 directement.

                 ⚠️ GESTION EN MÉMOIRE : les modifications (toggle,
                 ajout, suppression) sont locales au composant client
                 DataCatalogManager et NE PERSISTENT PAS. Pour une
                 persistance réelle, il faudra Prisma + Zod + Server
                 Actions.

flow:            Sync page → <Suspense fallback=<DataSkeleton />> →
                 <DataSection /> async → lit MERCHANT_TYPES,
                 PRODUCT_TYPES, FOOD_TYPES → rend <DataCatalogManager />.

ecosystem:       SuperAdminData = [
                   "@/app/super-admin/data/foodTypeData.ts",
                   "@/app/super-admin/data/mercantType.ts",
                   "@/app/super-admin/data/productType.ts",
                   "@/app/super-admin/data/page.tsx",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
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

export default function SuperAdminDataPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Catalogues
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez les types de commerçant, de produit et de cuisine.
          Les modifications sont locales à cette session (aucune
          persistance pour l&apos;instant).
        </p>
      </header>

      <Suspense fallback={<DataSkeleton />}>
        <DataSection />
      </Suspense>
    </div>
  );
}

async function DataSection() {
  return (
    <DataCatalogManager
      merchantTypes={MERCHANT_TYPES}
      productTypes={PRODUCT_TYPES}
      foodTypes={FOOD_TYPES}
    />
  );
}

function DataSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}