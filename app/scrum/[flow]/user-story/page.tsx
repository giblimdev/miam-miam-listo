/*
path :           app/scrum/[flow]/user-story/page.tsx
tag :            ["user-story", "page", "scrum", "section-json"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de gestion des user stories pour un flux Scrum. Sync
                 page + Suspense ; validation et lecture des US ET des
                 epics dans un composant async (Promise.all). Sous
                 UserStoryList, un éditeur JSON (SectionJsonEditor) permet
                 d'éditer en masse le tableau "userStory" et de
                 l'enregistrer via updateSectionJsonAction.

flow:            Sync page → <Suspense fallback=<UserStoryListSkeleton />> →
                 <UserStorySection params /> async → await params →
                 validation → Promise.all([listUserStories, listEpics]) →
                 JSON.stringify(stories) → <UserStoryList /> +
                 <SectionJsonEditor section="userStory" />.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/user-story/page.tsx",
                   "@/app/scrum/lib/actions/section-json.ts",
                   "@/app/scrum/lib/services/epic.ts",
                   "@/app/scrum/lib/services/user-story.ts",
                   "@/app/scrum/lib/types.ts",
                   "@/app/scrum/lib/validations/sections.ts",
                   "@/components/scrum/SectionJsonEditor.tsx",
                   "@/components/scrum/UserStoryList.tsx",
                   "@/components/ui/skeleton.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/user-story.ts",
                  "@/app/scrum/lib/services/epic.ts",
                  "@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/actions/section-json.ts",
                  "@/components/scrum/UserStoryList.tsx",
                  "@/components/scrum/SectionJsonEditor.tsx"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/user-story",
                  "@/app/scrum/lib/services/epic",
                  "@/app/scrum/components/UserStoryList",
                  "@/components/scrum/SectionJsonEditor",
                  "@/components/ui/skeleton"]

exports:         ["default UserStoryPage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux gérer les user stories d'un flux Scrum",
                  "*en tant qu'utilisateur je veux éditer le JSON de la section user story"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listUserStories } from "@/app/scrum/lib/services/user-story";
import { listEpics } from "@/app/scrum/lib/services/epic";
import { UserStoryList } from "@/app/scrum/components/UserStoryList";
import { SectionJsonEditor } from "@/app/scrum/components/SectionJsonEditor";
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
  const storiesJson = JSON.stringify(stories, null, 2);

  return (
    <div className="space-y-10">
      <UserStoryList flow={flow} stories={stories} epics={epics} />
      <SectionJsonEditor
        flow={flow}
        section="userStory"
        initialJson={storiesJson}
      />
    </div>
  );
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
