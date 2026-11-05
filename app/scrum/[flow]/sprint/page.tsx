/*
path :           app/scrum/[flow]/sprint/page.tsx
tag :            ["help", "sprint", "page", "scrum", "section-json"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de gestion des sprints pour un flux Scrum. Sync page
                 + Suspense ; validation et lecture des sprints ET des US
                 dans un composant async (Promise.all). Sous SprintList, un
                 éditeur JSON (SectionJsonEditor) permet d'éditer en masse
                 le tableau "sprint" et de l'enregistrer via
                 updateSectionJsonAction.

flow:            Sync page → <Suspense fallback=<SprintListSkeleton />> →
                 <SprintSection params /> async → await params → validation
                 → Promise.all([listSprints, listUserStories]) →
                 JSON.stringify(sprints) → <SprintList /> +
                 <SectionJsonEditor section="sprint" />.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/sprint/page.tsx",
                   "@/app/scrum/lib/actions/section-json.ts",
                   "@/app/scrum/lib/services/sprint.ts",
                   "@/app/scrum/lib/services/user-story.ts",
                   "@/app/scrum/lib/types.ts",
                   "@/app/scrum/lib/validations/sections.ts",
                   "@/components/scrum/SectionJsonEditor.tsx",
                   "@/components/scrum/SprintList.tsx",
                   "@/components/ui/skeleton.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/sprint.ts",
                  "@/app/scrum/lib/services/user-story.ts",
                  "@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/actions/section-json.ts",
                  "@/components/scrum/SprintList.tsx",
                  "@/components/scrum/SectionJsonEditor.tsx"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/sprint",
                  "@/app/scrum/lib/services/user-story",
                  "@/app/scrum/components/SprintList",
                  "@/components/scrum/SectionJsonEditor",
                  "@/components/ui/skeleton"]

exports:         ["default SprintPage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux gérer les sprints d'un flux Scrum",
                  "*en tant qu'utilisateur je veux éditer le JSON de la section sprint"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listSprints } from "@/app/scrum/lib/services/sprint";
import { listUserStories } from "@/app/scrum/lib/services/user-story";
import { SprintList } from "@/app/scrum/components/SprintList";
import { SectionJsonEditor } from "@/app/scrum/components/SectionJsonEditor";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<{ flow: string }>;

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

export default function SprintPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<SprintListSkeleton />}>
      <SprintSection params={params} />
    </Suspense>
  );
}

async function SprintSection({ params }: { readonly params: PageParams }) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const [sprints, userStories] = await Promise.all([
    listSprints(flow),
    listUserStories(flow),
  ]);
  const sprintsJson = JSON.stringify(sprints, null, 2);

  return (
    <div className="space-y-10">
      <SprintList flow={flow} sprints={sprints} userStories={userStories} />
      <SectionJsonEditor
        flow={flow}
        section="sprint"
        initialJson={sprintsJson}
      />
    </div>
  );
}

function SprintListSkeleton() {
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
