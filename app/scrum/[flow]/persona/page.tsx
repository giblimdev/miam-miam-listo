/*
path :           app/scrum/[flow]/persona/page.tsx
tag :            ["help", "persona", "page", "scrum", "section-json"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de gestion des personas pour un flux Scrum. Sync page
                 + Suspense ; validation et lecture dans un composant async.
                 Sous PersonaList, un éditeur JSON (SectionJsonEditor) permet
                 d'éditer en masse le tableau "persona" du flux et de
                 l'enregistrer via updateSectionJsonAction.

flow:            Sync page → <Suspense fallback=<PersonaListSkeleton />> →
                 <PersonaSection params /> async → await params → validation
                 → listPersonas(flow) → JSON.stringify → <PersonaList /> +
                 <SectionJsonEditor section="persona" />.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/persona/page.tsx",
                   "@/app/scrum/lib/actions/section-json.ts",
                   "@/app/scrum/lib/services/persona.ts",
                   "@/app/scrum/lib/types.ts",
                   "@/app/scrum/lib/validations/sections.ts",
                   "@/components/scrum/PersonaList.tsx",
                   "@/components/scrum/SectionJsonEditor.tsx",
                   "@/components/ui/skeleton.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/persona.ts",
                  "@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/actions/section-json.ts",
                  "@/components/scrum/PersonaList.tsx",
                  "@/components/scrum/SectionJsonEditor.tsx"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/persona",
                  "@/app/scrum/components/PersonaList",
                  "@/components/scrum/SectionJsonEditor",
                  "@/components/ui/skeleton"]

exports:         ["default PersonaPage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux gérer les personas d'un flux Scrum",
                  "*en tant qu'utilisateur je veux éditer le JSON de la section persona"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listPersonas } from "@/app/scrum/lib/services/persona";
import { PersonaList } from "@/app/scrum/components/PersonaList";
import { SectionJsonEditor } from "@/app/scrum/components/SectionJsonEditor";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<{ flow: string }>;

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

export default function PersonaPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<PersonaListSkeleton />}>
      <PersonaSection params={params} />
    </Suspense>
  );
}

async function PersonaSection({ params }: { readonly params: PageParams }) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const personas = await listPersonas(flow);
  const personasJson = JSON.stringify(personas, null, 2);

  return (
    <div className="space-y-10">
      <PersonaList flow={flow} personas={personas} />
      <SectionJsonEditor
        flow={flow}
        section="persona"
        initialJson={personasJson}
      />
    </div>
  );
}

function PersonaListSkeleton() {
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
