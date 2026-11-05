/*
path :           app/scrum/[flow]/sprint/board/page.tsx
tag :            ["scrum", "sprint", "board", "hub", "page", "dnd"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page hub du board US ↔ Sprint. Sync page + Suspense ;
                 validation du flow et lecture des sprints dans un
                 composant async. N'affiche PAS de DnD directement (le
                 DnD US ↔ Sprint vit dans /sprint/[sprintId]/edit) :
                 cette page liste les sprints du flux sous forme de
                 cartes cliquables qui mènent vers l'éditeur DnD du
                 sprint choisi. C'est le point d'entrée "board" de la
                 nav ScrumNav pour l'association US ↔ Sprint.

flow:            Sync page → <Suspense fallback=<Skeleton />> →
                 <SprintBoardSection params /> async → await params →
                 isScrumFlow → listSprints(flow) → <SprintBoardHub
                 flow sprints />.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/sprint/board/page.tsx",
                   "@/app/scrum/components/SprintBoardHub.tsx",
                   "@/app/scrum/lib/services/sprint.ts",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/components/SprintBoardHub.tsx",
                  "@/app/scrum/lib/services/sprint.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/sprint",
                  "@/app/scrum/components/SprintBoardHub",
                  "@/components/ui/skeleton"]

exports:         ["default SprintBoardPage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux choisir un sprint pour associer des US"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listSprints } from "@/app/scrum/lib/services/sprint";
import { SprintBoardHub } from "@/app/scrum/components/SprintBoardHub";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<{ flow: string }>;

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

export default function SprintBoardPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<SprintBoardSkeleton />}>
      <SprintBoardSection params={params} />
    </Suspense>
  );
}

async function SprintBoardSection({
  params,
}: {
  readonly params: PageParams;
}) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const sprints = await listSprints(flow);

  return <SprintBoardHub flow={flow} sprints={sprints} />;
}

function SprintBoardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}