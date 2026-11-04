/*
path :           app/scrum/components/TaskBoard.tsx
tag :            ["scrum", "task", "board", "dnd", "ui", "hydration"]
projectId:       <à fournir>
type :           component
generic:         false

role:            Board DnD à N colonnes : "Non rattachées" (task sans
                 storyId) + 1 colonne par UserStory. Permet de rattacher
                 / détacher une task d'une US par glisser-déposer. Le
                 backlog est IMPLICITE (storyId === undefined) : ce n'est
                 pas une entité, c'est une vue. Une task sans storyId
                 apparaît dans la colonne "Non rattachées" ; une task avec
                 storyId apparaît dans la colonne de son US. La colonne
                 "Non rattachées" est en première position (id UNASSIGNED_ID)
                 et accepte les drops. Les colonnes US ont pour id l'id de
                 l'US.

                 ⚠️ CORRECTIF HYDRATATION : un `id` stable produit par
                 `useId()` est passé à <DndContext> (même raison que
                 UserStoryBoard et SprintStoriesBoard).

flow:            Reçoit flow + tasks + stories → useId() → dndId stable →
                 useMemo :
                 - unassignedTasks = tasks.filter(t => !t.storyId)
                 - tasksByStory = Map<storyId, Task[]>
                 → DndContext(id=dndId) + 1 BoardColumn("unassigned") + N
                 BoardColumn(story.id) avec SortableContext → handleDragEnd
                 calcule (source, dest) → moveTaskToStoryAction(
                 flow, taskId, destStoryId | null) → toast + router.refresh().

ecosystem:       Scrum = [
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
                 ]

relatedFiles:    ["@/app/scrum/components/BoardColumn.tsx",
                  "@/app/scrum/components/TaskCard.tsx",
                  "@/app/scrum/lib/actions/task.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation", "sonner",
                  "@dnd-kit/core", "@dnd-kit/sortable",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/actions/task",
                  "@/app/scrum/components/BoardColumn",
                  "@/app/scrum/components/TaskCard"]

exports:         ["TaskBoard", "TaskBoardProps"]

useBy:           ["@/app/scrum/[flow]/task/board/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux rattacher des tasks à des US par DnD"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : DndContext + useDroppable (interaction DnD côté client).

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { ScrumFlow, Task, UserStory } from "@/app/scrum/lib/types";
import { moveTaskToStoryAction } from "@/app/scrum/lib/actions/task";
import { BoardColumn } from "@/app/scrum/components/BoardColumn";
import { TaskCard } from "@/app/scrum/components/TaskCard";

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const UNASSIGNED_ID = "unassigned-column";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface TaskBoardProps {
  readonly flow: ScrumFlow;
  /** Toutes les tasks du flux (avec ou sans storyId). */
  readonly tasks: readonly Task[];
  /** Toutes les US du flux (colonnes cibles). */
  readonly stories: readonly UserStory[];
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function TaskBoard({ flow, tasks, stories }: TaskBoardProps) {
  const router = useRouter();
  const dndId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /* Backlog implicite : tasks sans storyId. */
  const unassignedTasks = useMemo(
    () => tasks.filter((t) => !t.storyId),
    [tasks],
  );

  /* Map storyId → Task[]. */
  const tasksByStory = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const story of stories) map.set(story.id, []);
    for (const task of tasks) {
      if (task.storyId && map.has(task.storyId)) {
        map.get(task.storyId)!.push(task);
      }
    }
    return map;
  }, [tasks, stories]);

  /* Map storyId → storyTitle (pour l'affichage sur les TaskCard). */
  const storyTitleById = useMemo(
    () => new Map(stories.map((s) => [s.id, s.title])),
    [stories],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function findContainer(id: string): string | null {
    if (id === UNASSIGNED_ID) return UNASSIGNED_ID;
    if (stories.some((s) => s.id === id)) return id;
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;
    return task.storyId && stories.some((s) => s.id === task.storyId)
      ? task.storyId
      : UNASSIGNED_ID;
  }

  /* ------------------------------------------------------------------ */
  /*  Handlers                                                           */
  /* ------------------------------------------------------------------ */

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    setActiveId(null);

    if (!overId || pending) return;

    const from = findContainer(taskId);
    const to = findContainer(overId);
    if (!from || !to || from === to) return;

    const targetStoryId = to === UNASSIGNED_ID ? null : to;

    setPending(true);
    const result = await moveTaskToStoryAction(flow, taskId, targetStoryId);
    setPending(false);

    if (result.ok) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Rendu                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {/* Colonne Non rattachées (toujours en 1er, virtuelle) */}
        <BoardColumn
          id={UNASSIGNED_ID}
          title="Non rattachées"
          subtitle={`${unassignedTasks.length} task${unassignedTasks.length > 1 ? "s" : ""} sans US`}
          empty={unassignedTasks.length === 0}
          emptyMessage="Toutes les tasks sont rattachées à une US."
        >
          <SortableContext
            items={unassignedTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
            disabled={pending}
          >
            {unassignedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                storyTitle={undefined}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </SortableContext>
        </BoardColumn>

        {/* 1 colonne par US */}
        {stories.map((story) => {
          const storyTasks = tasksByStory.get(story.id) ?? [];
          return (
            <BoardColumn
              key={story.id}
              id={story.id}
              title={story.title}
              subtitle={`${storyTasks.length} task${storyTasks.length > 1 ? "s" : ""}`}
              empty={storyTasks.length === 0}
              emptyMessage="Glissez une task ici pour la rattacher à cette US."
            >
              <SortableContext
                items={storyTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
                disabled={pending}
              >
                {storyTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    storyTitle={storyTitleById.get(task.storyId ?? "")}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                ))}
              </SortableContext>
            </BoardColumn>
          );
        })}
      </div>

      {activeId && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Relâchez pour déplacer…
        </p>
      )}
    </DndContext>
  );
}