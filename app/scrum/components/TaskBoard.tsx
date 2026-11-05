/*
path :           app/scrum/components/TaskBoard.tsx
tag :            ["scrum", "task", "board", "dnd", "ui", "hydration", "cross-container", "design", "sidebar", "flex", "scroll"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Board DnD à N colonnes : "Non rattachées" (task sans
                 storyId) + 1 colonne par UserStory. Permet de
                 rattacher / détacher une task d'une US par
                 glisser-déposer. Le backlog est IMPLICITE
                 (storyId === undefined).

                 ALIGNEMENT UI/UX SUR UserStoryBoard (Epic Board) :
                 - Layout flex horizontal sur desktop : sidebar
                   "Non rattachées" (320px, hauteur fixe, scroll
                   interne) + zone US (grille 1/2 colonnes).
                 - Mobile (< lg) : flex-col → "Non rattachées" en
                   haut, US en dessous.
                 - BoardColumn variant="sidebar" pour la colonne
                   virtuelle, variant="grid" pour les colonnes US.
                 - TaskMiniCard (drag-only, compact) au lieu de
                   TaskCard complet → cohérence visuelle avec
                   UserStoryMiniCard.

                 ⚠️ CROSS-CONTAINER DND : un SEUL <SortableContext>
                 global englobe toutes les cartes.

                 ⚠️ CORRECTIF HYDRATATION : `useId()` fournit un id
                 stable SSR/client à <DndContext>.

                 ⚠️ CORRECTIF FIN DE DRAG : le conteneur source est
                 RECALCULÉ à partir des props `tasks` + `storyIds`
                 au lieu de `event.active.data.current?.containerId`
                 (peu fiable en fin de drag si le composant source
                 est re-rendu pendant le drag).

flow:            Reçoit flow + tasks + stories → useId() → dndId
                 stable → useMemo :
                 - unassignedTasks = tasks.filter(t => !t.storyId)
                 - tasksByStory = Map<storyId, Task[]>
                 - storyTitleById = Map<storyId, title>
                 → DndContext(id=dndId) + 1 BoardColumn("unassigned")
                 + N BoardColumn(story.id) avec SortableContext
                 global → handleDragEnd calcule (source, dest) →
                 moveTaskToStoryAction(flow, taskId, destStoryId |
                 null) → toast + router.refresh(). Les TaskMiniCard
                 sont rendues dans les colonnes.

ecosystem:       Scrum = [
                   "@/app/scrum/components/BoardColumn.tsx",
                   "@/app/scrum/components/TaskBoard.tsx",
                   "@/app/scrum/components/TaskMiniCard.tsx",
                   "@/app/scrum/lib/actions/task.ts",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/components/BoardColumn.tsx",
                  "@/app/scrum/components/TaskMiniCard.tsx",
                  "@/app/scrum/lib/actions/task.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation", "sonner", "lucide-react",
                  "@dnd-kit/core", "@dnd-kit/sortable",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/actions/task",
                  "@/app/scrum/components/BoardColumn",
                  "@/app/scrum/components/TaskMiniCard"]

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
import { Inbox, ListTodo } from "lucide-react";
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
import { TaskMiniCard } from "@/app/scrum/components/TaskMiniCard";

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

  /* Source de vérité pour la résolution des storyId. */
  const knownStoryIds = useMemo(
    () => new Set(stories.map((s) => s.id)),
    [stories],
  );

  /* Backlog implicite : tasks sans storyId OU avec storyId invalide. */
  const unassignedTasks = useMemo(
    () =>
      tasks.filter((t) => !t.storyId || !knownStoryIds.has(t.storyId)),
    [tasks, knownStoryIds],
  );

  /* Map storyId → Task[]. */
  const tasksByStory = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const story of stories) map.set(story.id, []);
    for (const task of tasks) {
      if (task.storyId && knownStoryIds.has(task.storyId)) {
        map.get(task.storyId)!.push(task);
      }
    }
    return map;
  }, [tasks, stories, knownStoryIds]);

  /* Map storyId → storyTitle (pour l'affichage sur les TaskMiniCard). */
  const storyTitleById = useMemo(
    () => new Map(stories.map((s) => [s.id, s.title])),
    [stories],
  );

  /* Liste plate de tous les IDs (pour le SortableContext global). */
  const allTaskIds = useMemo(() => {
    const ids: string[] = unassignedTasks.map((t) => t.id);
    for (const storyTasks of tasksByStory.values()) {
      for (const t of storyTasks) ids.push(t.id);
    }
    return ids;
  }, [unassignedTasks, tasksByStory]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Résout le conteneur d'un id donné. L'id peut être :
   * - UNASSIGNED_ID          → colonne virtuelle
   * - un id de UserStory     → cette colonne US
   * - un id de Task          → le conteneur de rattachement de cette
   *                            task (storyId valide → colonne US,
   *                            sinon colonne virtuelle)
   */
  function findContainer(id: string): string | null {
    if (id === UNASSIGNED_ID) return UNASSIGNED_ID;
    if (knownStoryIds.has(id)) return id;
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;
    return task.storyId && knownStoryIds.has(task.storyId)
      ? task.storyId
      : UNASSIGNED_ID;
  }

  /**
   * Recalcule le conteneur SOURCE d'une task à partir des props
   * serveur (`tasks` + `knownStoryIds`). Remplace l'usage de
   * `event.active.data.current?.containerId`.
   */
  function resolveSourceContainer(taskId: string): string | null {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;
    return task.storyId && knownStoryIds.has(task.storyId)
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

    /* 1. Conteneur source : recalcul déterministe. */
    const fromContainer = resolveSourceContainer(taskId);
    if (!fromContainer) return;

    /* 2. Conteneur cible : résolution robuste. */
    const toContainer = findContainer(overId);
    if (!toContainer || fromContainer === toContainer) return;

    /* 3. Cible finale. */
    const targetStoryId = toContainer === UNASSIGNED_ID ? null : toContainer;

    /* 4. Garde : si la story cible n'existe pas, on refuse. */
    if (targetStoryId !== null && !knownStoryIds.has(targetStoryId)) {
      toast.error("UserStory introuvable : impossible de rattacher la task.");
      return;
    }

    /* 5. Mutation. */
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
      <SortableContext
        items={allTaskIds}
        strategy={verticalListSortingStrategy}
        disabled={pending}
      >
        {/* Layout flex : sidebar 320px (Non rattachées) + zone US
            min-w-0 flex-1. Sur mobile (< lg), stack vertical. */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* =================== SIDEBAR UNASSIGNED =================== */}
          <aside
            className="lg:sticky lg:top-16 lg:flex lg:h-[calc(100svh-5rem)] lg:w-[320px] lg:shrink-0 lg:flex-col"
            aria-label="Tasks non rattachées"
          >
            <BoardColumn
              id={UNASSIGNED_ID}
              title="Non rattachées"
              subtitle={`${unassignedTasks.length} task${
                unassignedTasks.length > 1 ? "s" : ""
              } sans US`}
              empty={unassignedTasks.length === 0}
              emptyMessage="Toutes les tasks sont rattachées à une US."
              icon={Inbox}
              accent="chart-5"
              variant="sidebar"
            >
              {unassignedTasks.map((task) => (
                <TaskMiniCard
                  key={task.id}
                  task={task}
                  storyTitle={undefined}
                  containerId={UNASSIGNED_ID}
                  disabled={pending}
                />
              ))}
            </BoardColumn>
          </aside>

          {/* =================== GRILLE US =================== */}
          <div className="min-w-0 flex-1">
            {stories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                Aucune UserStory pour l&apos;instant. Créez au moins une US
                pour pouvoir organiser les tasks.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
                {stories.map((story) => {
                  const storyTasks = tasksByStory.get(story.id) ?? [];
                  return (
                    <BoardColumn
                      key={story.id}
                      id={story.id}
                      title={story.title}
                      subtitle={`${storyTasks.length} task${
                        storyTasks.length > 1 ? "s" : ""
                      }`}
                      empty={storyTasks.length === 0}
                      emptyMessage="Glissez une task ici pour la rattacher à cette US."
                      icon={ListTodo}
                      accent="chart-2"
                      variant="grid"
                    >
                      {storyTasks.map((task) => (
                        <TaskMiniCard
                          key={task.id}
                          task={task}
                          storyTitle={storyTitleById.get(task.storyId ?? "")}
                          containerId={story.id}
                          disabled={pending}
                        />
                      ))}
                    </BoardColumn>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SortableContext>

      {activeId && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Relâchez pour déplacer…
        </p>
      )}
    </DndContext>
  );
}