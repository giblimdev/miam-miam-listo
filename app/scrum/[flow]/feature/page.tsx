/*
path :           app/scrum/[flow]/feature/page.tsx
tag :            ["help", "feature", "page", "scrum", "section-json"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de gestion des features pour un flux Scrum. Sync page
                 + Suspense ; validation et lecture dans un composant async.
                 Sous la liste CRUD existante (FeatureList), un éditeur JSON
                 (SectionJsonEditor) permet d'éditer en masse le tableau
                 "feature" du flux et de l'enregistrer via
                 updateSectionJsonAction. Les deux modes coexistent.

flow:            Sync page → <Suspense fallback=<FeatureListSkeleton />> →
                 <FeatureSection params /> async → await params → validation
                 → listFeatures(flow) → JSON.stringify → <FeatureList /> +
                 <SectionJsonEditor section="feature" />.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/feature/page.tsx",
                   "@/app/scrum/lib/actions/section-json.ts",
                   "@/app/scrum/lib/services/feature.ts",
                   "@/app/scrum/lib/types.ts",
                   "@/app/scrum/lib/validations/sections.ts",
                   "@/components/scrum/FeatureList.tsx",
                   "@/components/scrum/SectionJsonEditor.tsx",
                   "@/components/ui/skeleton.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/feature.ts",
                  "@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/actions/section-json.ts",
                  "@/components/scrum/FeatureList.tsx",
                  "@/components/scrum/SectionJsonEditor.tsx"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/feature",
                  "@/app/scrum/components/FeatureList",
                  "@/components/scrum/SectionJsonEditor",
                  "@/components/ui/skeleton"]

exports:         ["default FeaturePage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux gérer les features d'un flux Scrum",
                  "*en tant qu'utilisateur je veux éditer le JSON de la section feature"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listFeatures } from "@/app/scrum/lib/services/feature";
import { FeatureList } from "@/app/scrum/components/FeatureList";
import { SectionJsonEditor } from "@/app/scrum/components/SectionJsonEditor";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<{ flow: string }>;

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

export default function FeaturePage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<FeatureListSkeleton />}>
      <FeatureSection params={params} />
    </Suspense>
  );
}

async function FeatureSection({ params }: { readonly params: PageParams }) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const features = await listFeatures(flow);
  const featuresJson = JSON.stringify(features, null, 2);

  return (
    <div className="space-y-10">
      <FeatureList flow={flow} features={features} />
      <SectionJsonEditor
        flow={flow}
        section="feature"
        initialJson={featuresJson}
      />
    </div>
  );
}

function FeatureListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}
