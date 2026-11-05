/*
path :           app/scrum/[flow]/epic/page.tsx
tag :            ["help", "epic", "page", "scrum", "section-json"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de gestion des epics pour un flux Scrum. Sync page +
                 Suspense ; validation et lecture dans un composant async.
                 Sous EpicList, un éditeur JSON (SectionJsonEditor) permet
                 d'éditer en masse le tableau "epic" et de l'enregistrer via
                 updateSectionJsonAction.

flow:            Sync page → <Suspense fallback=<EpicListSkeleton />> →
                 <EpicSection params /> async → await params → validation →
                 listEpics(flow) → JSON.stringify → <EpicList /> +
                 <SectionJsonEditor section="epic" />.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/epic/page.tsx",
                   "@/app/scrum/lib/actions/section-json.ts",
                   "@/app/scrum/lib/services/epic.ts",
                   "@/app/scrum/lib/types.ts",
                   "@/app/scrum/lib/validations/sections.ts",
                   "@/components/scrum/EpicList.tsx",
                   "@/components/scrum/SectionJsonEditor.tsx",
                   "@/components/ui/skeleton.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/epic.ts",
                  "@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/actions/section-json.ts",
                  "@/components/scrum/EpicList.tsx",
                  "@/components/scrum/SectionJsonEditor.tsx"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/epic",
                  "@/app/scrum/components/EpicList",
                  "@/components/scrum/SectionJsonEditor",
                  "@/components/ui/skeleton"]

exports:         ["default EpicPage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux gérer les epics d'un flux Scrum",
                  "*en tant qu'utilisateur je veux éditer le JSON de la section epic"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listEpics } from "@/app/scrum/lib/services/epic";
import { EpicList } from "@/app/scrum/components/EpicList";
import { SectionJsonEditor } from "@/app/scrum/components/SectionJsonEditor";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<{ flow: string }>;

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

export default function EpicPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<EpicListSkeleton />}>
      <EpicSection params={params} />
    </Suspense>
  );
}

async function EpicSection({ params }: { readonly params: PageParams }) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const epics = await listEpics(flow);
  const epicsJson = JSON.stringify(epics, null, 2);

  return (
    <div className="space-y-10">
      <EpicList flow={flow} epics={epics} />
      <SectionJsonEditor flow={flow} section="epic" initialJson={epicsJson} />
    </div>
  );
}

function EpicListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-36" />
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
