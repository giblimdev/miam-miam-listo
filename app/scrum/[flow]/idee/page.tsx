/*
path :           app/scrum/[flow]/idee/page.tsx
tag :            ["help", "idee", "page", "scrum", "section-json"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de gestion des idées pour un flux Scrum. Sync page +
                 Suspense ; validation et lecture dans un composant async.
                 Sous la liste CRUD existante (IdeeList), un éditeur JSON
                 (SectionJsonEditor) permet d'éditer en masse le tableau
                 "idee" du flux et de l'enregistrer via la Server Action
                 générique updateSectionJsonAction. Les deux modes (formulaire
                 + JSON) coexistent sur la même page.

flow:            Sync page → <Suspense fallback=<IdeeListSkeleton />> →
                 <IdeeSection params /> async → await params → validation →
                 listIdees(flow) → JSON.stringify(idees, null, 2) →
                 <IdeeList /> + <SectionJsonEditor section="idee" />.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/idee/page.tsx",
                   "@/app/scrum/lib/actions/section-json.ts",
                   "@/app/scrum/lib/services/idee.ts",
                   "@/app/scrum/lib/types.ts",
                   "@/app/scrum/lib/validations/sections.ts",
                   "@/components/scrum/IdeeList.tsx",
                   "@/components/scrum/SectionJsonEditor.tsx",
                   "@/components/ui/skeleton.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/idee.ts",
                  "@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/actions/section-json.ts",
                  "@/components/scrum/IdeeList.tsx",
                  "@/components/scrum/SectionJsonEditor.tsx"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/idee",
                  "@/app/scrum/components/IdeeList",
                  "@/components/scrum/SectionJsonEditor",
                  "@/components/ui/skeleton"]

exports:         ["default IdeePage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux gérer les idées d'un flux Scrum",
                  "*en tant qu'utilisateur je veux éditer le JSON de la section idée"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listIdees } from "@/app/scrum/lib/services/idee";
import { IdeeList } from "@/app/scrum/components/IdeeList";
import { SectionJsonEditor } from "@/app/scrum/components/SectionJsonEditor";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PageParams = Promise<{ flow: string }>;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

/* ------------------------------------------------------------------ */
/*  Page (sync)                                                        */
/* ------------------------------------------------------------------ */

export default function IdeePage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<IdeeListSkeleton />}>
      <IdeeSection params={params} />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Section async                                                      */
/* ------------------------------------------------------------------ */

async function IdeeSection({ params }: { readonly params: PageParams }) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const idees = await listIdees(flow);
  const ideesJson = JSON.stringify(idees, null, 2);

  return (
    <div className="space-y-10">
      <IdeeList flow={flow} idees={idees} />
      <SectionJsonEditor flow={flow} section="idee" initialJson={ideesJson} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function IdeeListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}
