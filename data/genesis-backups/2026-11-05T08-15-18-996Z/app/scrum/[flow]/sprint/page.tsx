/*
path :           app/scrum/[flow]/sprint/page.tsx
tag :            ["help", "sprint", "page", "scrum"]
projectId:       new-genesis
type:            page
generic:         false

role:            Page de gestion des sprints pour un flux Scrum. Sync page +
                 Suspense ; validation et lecture des sprints ET des user stories
                 dans un composant async (Promise.all) pour permettre l'affichage
                 des US résolues dans chaque SprintCard. Le skeleton reproduit
                 la grille 1 / 2 / 3 / 4 colonnes de SprintList.

flow:            Sync page → <Suspense fallback=<SprintListSkeleton />> →
                 <SprintSection params /> async → await params → validation →
                 Promise.all([listSprints(flow), listUserStories(flow)]) →
                 <SprintList flow sprints userStories />.

ecosystem:       Help = [
                   "@/app/scrum/[flow]/epic/page.tsx",
                   "@/app/scrum/[flow]/feature/page.tsx",
                   "@/app/scrum/[flow]/global-json/page.tsx",
                   "@/app/scrum/[flow]/idee/page.tsx",
                   "@/app/scrum/[flow]/layout.tsx",
                   "@/app/scrum/[flow]/page.tsx",
                   "@/app/scrum/[flow]/persona/page.tsx",
                   "@/app/scrum/[flow]/sprint/page.tsx",
                   "@/app/scrum/[flow]/user-story/page.tsx",
                   "@/app/scrum/layout.tsx",
                   "@/app/scrum/page.tsx",
                 ]

relatedFiles:    ["@/app/scrum/components/scrum/SprintList.tsx",
                  "@/app/scrum/lib/services/sprint.ts",
                  "@/app/scrum/lib/services/user-story.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/sprint",
                  "@/app/scrum/lib/services/user-story",
                  "@/app/scrum/components/SprintList",
                  "@/components/ui/skeleton"]

exports:         ["default SprintPage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux gérer les sprints d'un flux Scrum"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listSprints } from "@/app/scrum/lib/services/sprint";
import { listUserStories } from "@/app/scrum/lib/services/user-story";
import { SprintList } from "@/app/scrum/components/SprintList";
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

  return <SprintList flow={flow} sprints={sprints} userStories={userStories} />;
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
