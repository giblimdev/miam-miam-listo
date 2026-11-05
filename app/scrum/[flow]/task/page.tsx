/*
path :           app/scrum/[flow]/task/page.tsx
tag :            ["help", "task", "page", "scrum", "section-json"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de gestion des tasks pour un flux Scrum. Sync page +
                 Suspense ; validation et lecture des tasks ET des US dans
                 un composant async (Promise.all). Sous TaskList, un éditeur
                 JSON (SectionJsonEditor) permet d'éditer en masse le
                 tableau "task" et de l'enregistrer via
                 updateSectionJsonAction.

flow:            Sync page → <Suspense fallback=<TaskListSkeleton />> →
                 <TaskSection params /> async → await params → validation →
                 Promise.all([listTasks, listUserStories]) →
                 JSON.stringify(tasks) → <TaskList /> +
                 <SectionJsonEditor section="task" />.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/task/page.tsx",
                   "@/app/scrum/lib/actions/section-json.ts",
                   "@/app/scrum/lib/services/task.ts",
                   "@/app/scrum/lib/services/user-story.ts",
                   "@/app/scrum/lib/types.ts",
                   "@/app/scrum/lib/validations/sections.ts",
                   "@/components/scrum/SectionJsonEditor.tsx",
                   "@/components/scrum/TaskList.tsx",
                   "@/components/ui/skeleton.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/task.ts",
                  "@/app/scrum/lib/services/user-story.ts",
                  "@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/actions/section-json.ts",
                  "@/components/scrum/TaskList.tsx",
                  "@/components/scrum/SectionJsonEditor.tsx"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/task",
                  "@/app/scrum/lib/services/user-story",
                  "@/app/scrum/components/TaskList",
                  "@/components/scrum/SectionJsonEditor",
                  "@/components/ui/skeleton"]

exports:         ["default TaskPage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux gérer les tasks d'un flux Scrum",
                  "*en tant qu'utilisateur je veux éditer le JSON de la section task"]

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
import { TaskList } from "@/app/scrum/components/TaskList";
import { SectionJsonEditor } from "@/app/scrum/components/SectionJsonEditor";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<{ flow: string }>;

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

export default function TaskPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<TaskListSkeleton />}>
      <TaskSection params={params} />
    </Suspense>
  );
}

async function TaskSection({ params }: { readonly params: PageParams }) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const [tasks, stories] = await Promise.all([
    listTasks(flow),
    listUserStories(flow),
  ]);
  const tasksJson = JSON.stringify(tasks, null, 2);

  return (
    <div className="space-y-10">
      <TaskList flow={flow} tasks={tasks} stories={stories} />
      <SectionJsonEditor flow={flow} section="task" initialJson={tasksJson} />
    </div>
  );
}

function TaskListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
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
