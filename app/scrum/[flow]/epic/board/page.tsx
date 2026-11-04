/*
path :           app/scrum/[flow]/epic/board/page.tsx
tag :            ["help", "epic", "board", "page", "scrum", "dnd"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page du board DnD UserStory ↔ Epic. Sync page + Suspense ;
                 validation du flow et lecture des US + epics dans un
                 composant async. Le board permet de rattacher/détacher
                 une US à un epic par glisser-déposer (backlog implicite :
                 US sans epic = colonne "Backlog"). Le pattern Cache
                 Components est respecté : composant page synchrone qui
                 monte un <Suspense>, tout l'accès runtime (await params,
                 validation, lecture des données) isolé dans le composant
                 async <UserStoryBoardSection />.

flow:            Sync page → <Suspense fallback=<UserStoryBoardSkeleton />> →
                 <UserStoryBoardSection params /> async → await params →
                 isScrumFlow → Promise.all([listUserStories, listEpics])
                 → <UserStoryBoard flow stories epics />.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/epic/board/page.tsx",
                   "@/app/scrum/[flow]/epic/page.tsx",
                   "@/app/scrum/[flow]/feature/page.tsx",
                   "@/app/scrum/[flow]/global-json/page.tsx",
                   "@/app/scrum/[flow]/idee/page.tsx",
                   "@/app/scrum/[flow]/layout.tsx",
                   "@/app/scrum/[flow]/page.tsx",
                   "@/app/scrum/[flow]/persona/page.tsx",
                   "@/app/scrum/[flow]/sprint/[sprintId]/edit/page.tsx",
                   "@/app/scrum/[flow]/sprint/page.tsx",
                   "@/app/scrum/[flow]/task/board/page.tsx",
                   "@/app/scrum/[flow]/task/page.tsx",
                   "@/app/scrum/[flow]/user-story/page.tsx",
                   "@/app/scrum/components/BoardColumn.tsx",
                   "@/app/scrum/components/EpicCard.tsx",
                   "@/app/scrum/components/EpicForm.tsx",
                   "@/app/scrum/components/EpicList.tsx",
                   "@/app/scrum/components/FeatureCard.tsx",
                   "@/app/scrum/components/FeatureForm.tsx",
                   "@/app/scrum/components/FeatureList.tsx",
                   "@/app/scrum/components/FlowSelector.tsx",
                   "@/app/scrum/components/GlobalJsonExport.tsx",
                   "@/app/scrum/components/IdeeCard.tsx",
                   "@/app/scrum/components/IdeeDetailDialog.tsx",
                   "@/app/scrum/components/IdeeForm.tsx",
                   "@/app/scrum/components/IdeeList.tsx",
                   "@/app/scrum/components/PersonaCard.tsx",
                   "@/app/scrum/components/PersonaForm.tsx",
                   "@/app/scrum/components/PersonaList.tsx",
                   "@/app/scrum/components/ScrumNav.tsx",
                   "@/app/scrum/components/SortableItem.tsx",
                   "@/app/scrum/components/SortableList.tsx",
                   "@/app/scrum/components/SprintCard.tsx",
                   "@/app/scrum/components/SprintEditor.tsx",
                   "@/app/scrum/components/SprintForm.tsx",
                   "@/app/scrum/components/SprintList.tsx",
                   "@/app/scrum/components/SprintStoriesBoard.tsx",
                   "@/app/scrum/components/TaskBoard.tsx",
                   "@/app/scrum/components/TaskCard.tsx",
                   "@/app/scrum/components/TaskForm.tsx",
                   "@/app/scrum/components/TaskList.tsx",
                   "@/app/scrum/components/UserStoryBoard.tsx",
                   "@/app/scrum/components/UserStoryCard.tsx",
                   "@/app/scrum/components/UserStoryForm.tsx",
                   "@/app/scrum/components/UserStoryList.tsx",
                   "@/app/scrum/components/UserStoryMiniCard.tsx",
                   "@/app/scrum/layout.tsx",
                   "@/app/scrum/page.tsx",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/components/UserStoryBoard.tsx",
                  "@/app/scrum/lib/services/user-story.ts",
                  "@/app/scrum/lib/services/epic.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/user-story",
                  "@/app/scrum/lib/services/epic",
                  "@/app/scrum/components/UserStoryBoard",
                  "@/components/ui/skeleton"]

exports:         ["default EpicBoardPage"]

useBy:           ["@/app/scrum/[flow]/epic/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux rattacher des US à des epics par DnD"]

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
import { UserStoryBoard } from "@/app/scrum/components/UserStoryBoard";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<{ flow: string }>;

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

export default function EpicBoardPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<UserStoryBoardSkeleton />}>
      <UserStoryBoardSection params={params} />
    </Suspense>
  );
}

async function UserStoryBoardSection({
  params,
}: {
  readonly params: PageParams;
}) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const [stories, epics] = await Promise.all([
    listUserStories(flow),
    listEpics(flow),
  ]);

  return <UserStoryBoard flow={flow} stories={stories} epics={epics} />;
}

function UserStoryBoardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}