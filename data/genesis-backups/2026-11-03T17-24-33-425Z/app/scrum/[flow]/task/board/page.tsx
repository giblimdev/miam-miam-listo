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
                 task sans US = colonne "Non rattachées").

flow:            Sync page → <Suspense fallback=<TaskBoardSkeleton />> →
                 <TaskBoardSection params /> async → await params →
                 validation → Promise.all([listTasks, listUserStories])
                 → <TaskBoard flow tasks stories />.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/task/board/page.tsx",
                   ... (tous les fichiers Scrum)
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