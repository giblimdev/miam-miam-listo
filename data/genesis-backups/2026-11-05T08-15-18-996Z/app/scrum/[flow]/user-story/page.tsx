/*
path :           app/core/[flow]/user-story/page.tsx
tag :            [ "user-story", "page", "scrum"]
projectId:       new-genesis
type:            page
generic:         false

role:            Page de gestion des user stories pour un flux Scrum. Sync page +
                 Suspense ; validation et lecture des user stories ET des epics
                 dans un composant async (Promise.all) pour permettre l'affichage
                 du nom d'epic sur chaque carte. Le skeleton reproduit la grille
                 1 / 2 / 3 / 4 colonnes de UserStoryList.

flow:            Sync page → <Suspense fallback=<UserStoryListSkeleton />> →
                 <UserStorySection params /> async → await params → validation →
                 Promise.all([listUserStories(flow), listEpics(flow)]) →
                 <UserStoryList flow stories epics />.

ecosystem:       Help = [
                   "@/app/core/[flow]/epic/page.tsx",
                   "@/app/core/[flow]/feature/page.tsx",
                   "@/app/core/[flow]/global-json/page.tsx",
                   "@/app/core/[flow]/idee/page.tsx",
                   "@/app/core/[flow]/layout.tsx",
                   "@/app/core/[flow]/page.tsx",
                   "@/app/core/[flow]/persona/page.tsx",
                   "@/app/core/[flow]/sprint/page.tsx",
                   "@/app/core/[flow]/user-story/page.tsx",
                   "@/app/core/layout.tsx",
                   "@/app/core/page.tsx",
                 ]

relatedFiles:    ["@/app/core/components/scrum/UserStoryList.tsx",
                  "@/app/core/lib/scrum/services/user-story.ts",
                  "@/app/core/lib/scrum/services/epic.ts",
                  "@/app/core/lib/scrum/types.ts"]

imports:         ["react", "next/navigation",
                  "@/app/core/lib/scrum/types",
                  "@/app/core/lib/scrum/services/user-story",
                  "@/app/core/lib/scrum/services/epic",
                  "@/app/core/components/scrum/UserStoryList",
                  "@/components/ui/skeleton"]

exports:         ["default UserStoryPage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux gérer les user stories d'un flux Scrum"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listUserStories } from "@/app/scrum/lib/services/user-story";
import { listEpics } from "@/app/scrum/lib/services/epic";
import { UserStoryList } from "@/app/scrum/components/UserStoryList";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<{ flow: string }>;

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

export default function UserStoryPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<UserStoryListSkeleton />}>
      <UserStorySection params={params} />
    </Suspense>
  );
}

async function UserStorySection({ params }: { readonly params: PageParams }) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const [stories, epics] = await Promise.all([
    listUserStories(flow),
    listEpics(flow),
  ]);

  return <UserStoryList flow={flow} stories={stories} epics={epics} />;
}

function UserStoryListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-48" />
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
