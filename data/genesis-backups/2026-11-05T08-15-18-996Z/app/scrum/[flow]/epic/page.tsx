/*
path :           app/scrum/[flow]/epic/page.tsx
tag :            ["help", "epic", "page", "scrum"]
projectId:       new-genesis
type:            page
generic:         false

role:            Page de gestion des epics pour un flux Scrum. Composant page
                 synchrone + Suspense ; validation et lecture dans un composant async.
                 Le skeleton reproduit la grille 1 / 2 / 3 / 4 colonnes de EpicList.

flow:            Sync page → <Suspense fallback=<EpicListSkeleton />> →
                 <EpicSection params /> async → await params → validation →
                 listEpics(flow) → <EpicList />.

ecosystem:       Scrum = [
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

relatedFiles:    ["@/app/scrum/components/EpicList.tsx",
                  "@/app/scrum/lib/services/epic.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/epic",
                  "@/app/scrum/components/EpicList",
                  "@/components/ui/skeleton"]

exports:         ["default EpicPage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux gérer les epics d'un flux Scrum"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listEpics } from "@/app/scrum/lib/services/epic";
import { EpicList } from "@/app/scrum/components/EpicList";
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
  return <EpicList flow={flow} epics={epics} />;
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
