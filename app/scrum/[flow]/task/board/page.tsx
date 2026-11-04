/*
path :           app/scrum/[flow]/task/board/page.tsx
tag :            ["help", "task", "board", "page", "scrum", "dnd"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page du board DnD Task ↔ UserStory. Sync page + Suspense ;
                 validation du flow et lecture des tasks + US dans un
                 composant async. Le board permet de rattacher/détacher
                 une task à une US par glisser-déposer (backlog implicite :
                 task sans US = colonne "Non rattachées"). Le pattern Cache
                 Components est respecté : composant page synchrone qui
                 monte un <Suspense>, tout l'accès runtime (await params,
                 validation, lecture des données) isolé dans le composant
                 async <TaskBoardSection />.

flow:            Sync page → <Suspense fallback=<TaskBoardSkeleton />> →
                 <TaskBoardSection params /> async → await params →
                 isScrumFlow → Promise.all([listTasks, listUserStories])
                 → <TaskBoard flow tasks stories />.

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

relatedFiles:    ["@/app/scrum/components/TaskBoard.tsx",
                  "@/app/scrum/lib/services/task.ts",
                  "@/app/scrum/lib/services/user-story.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/task",
                  "@/app/scrum/lib/services/user-story",
                  "@/app/scrum/components/TaskBoard",
                  "@/components/ui/skeleton"]

exports:         ["default TaskBoardPage"]

useBy:           ["@/app/scrum/[flow]/task/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux rattacher des tasks à des US par DnD"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listTasks } from "@/app/scrum/lib/services/task";
import { listUserStories } from "@/app/scrum/lib/services/user-story";
import { TaskBoard } from "@/app/scrum/components/TaskBoard";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<{ flow: string }>;

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

export default function TaskBoardPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<TaskBoardSkeleton />}>
      <TaskBoardSection params={params} />
    </Suspense>
  );
}

async function TaskBoardSection({
  params,
}: {
  readonly params: PageParams;
}) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const [tasks, stories] = await Promise.all([
    listTasks(flow),
    listUserStories(flow),
  ]);

  return <TaskBoard flow={flow} tasks={tasks} stories={stories} />;
}

function TaskBoardSkeleton() {
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