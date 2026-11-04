/*
path :           app/scrum/components/UserStoryBoard.tsx
tag :            ["scrum", "user-story", "board", "dnd", "ui", "hydration"]
projectId:       <à fournir>
type :           component
generic:         false

role:            Board DnD à N colonnes : Backlog (US sans epic) + 1
                 colonne par epic. Permet de rattacher / détacher une US
                 d'un epic par glisser-déposer. Le backlog est IMPLICITE
                 (epicId === undefined) : ce n'est pas une entité, c'est
                 une vue. Une US sans epic apparaît dans la colonne
                 "Backlog" ; une US avec epicId apparaît dans la colonne
                 de son epic. La colonne Backlog est en première position
                 (id BACKLOG_ID) et accepte les drops. Les colonnes epic
                 ont pour id l'id de l'epic.

                 ⚠️ CORRECTIF HYDRATATION : un `id` stable produit par
                 `useId()` est passé à <DndContext>. Sans cet id, dnd-kit
                 génère un identifiant via un compteur global
                 (`DndDescribedBy-N`), qui diverge entre le serveur et le
                 client → React lève « tree hydrated but some attributes
                 of the server rendered HTML didn't match the client ».
                 `useId()` garantit la même valeur SSR/client.

flow:            Reçoit flow + stories (toutes les US) + epics (tous les
                 epics) → useId() → dndId stable → useMemo :
                 - backlogStories = stories.filter(us => !us.epicId)
                 - storiesByEpic = Map<epicId, UserStory[]>
                 → DndContext(id=dndId) + 1 BoardColumn("backlog") + N
                 BoardColumn(epic.id) avec SortableContext → handleDragEnd
                 calcule (source, dest) → moveUserStoryToEpicAction(
                 flow, storyId, destEpicId | null) → toast + router.refresh().

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
                  "@/app/scrum/components/UserStoryMiniCard.tsx",
                  "@/app/scrum/lib/actions/user-story.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation", "sonner",
                  "@dnd-kit/core", "@dnd-kit/sortable",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/actions/user-story",
                  "@/app/scrum/components/BoardColumn",
                  "@/app/scrum/components/UserStoryMiniCard"]

exports:         ["UserStoryBoard", "UserStoryBoardProps"]

useBy:           ["@/app/scrum/[flow]/epic/board/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux rattacher des US à des epics par DnD"]

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

import type { Epic, ScrumFlow, UserStory } from "@/app/scrum/lib/types";
import { moveUserStoryToEpicAction } from "@/app/scrum/lib/actions/user-story";
import { BoardColumn } from "@/app/scrum/components/BoardColumn";
import { UserStoryMiniCard } from "@/app/scrum/components/UserStoryMiniCard";

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const BACKLOG_ID = "backlog-column";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface UserStoryBoardProps {
  readonly flow: ScrumFlow;
  /** Toutes les US du flux (avec ou sans epicId). */
  readonly stories: readonly UserStory[];
  /** Tous les epics du flux (colonnes cibles). */
  readonly epics: readonly Epic[];
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function UserStoryBoard({ flow, stories, epics }: UserStoryBoardProps) {
  const router = useRouter();
  const dndId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /* Backlog implicite : US sans epicId. */
  const backlogStories = useMemo(
    () => stories.filter((us) => !us.epicId),
    [stories],
  );

  /* Map epicId → UserStory[] (dans l'ordre de stories). */
  const storiesByEpic = useMemo(() => {
    const map = new Map<string, UserStory[]>();
    for (const epic of epics) map.set(epic.id, []);
    for (const us of stories) {
      if (us.epicId && map.has(us.epicId)) {
        map.get(us.epicId)!.push(us);
      }
    }
    return map;
  }, [stories, epics]);

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
    if (id === BACKLOG_ID) return BACKLOG_ID;
    if (epics.some((e) => e.id === id)) return id;
    /* Sinon : chercher à quel container appartient la story. */
    const story = stories.find((us) => us.id === id);
    if (!story) return null;
    return story.epicId && epics.some((e) => e.id === story.epicId)
      ? story.epicId
      : BACKLOG_ID;
  }

  /* ------------------------------------------------------------------ */
  /*  Handlers                                                           */
  /* ------------------------------------------------------------------ */

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const storyId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    setActiveId(null);

    if (!overId || pending) return;

    const from = findContainer(storyId);
    const to = findContainer(overId);
    if (!from || !to || from === to) return;

    const targetEpicId = to === BACKLOG_ID ? null : to;

    setPending(true);
    const result = await moveUserStoryToEpicAction(
      flow,
      storyId,
      targetEpicId,
    );
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
        {/* Colonne Backlog (toujours en 1er, virtuelle) */}
        <BoardColumn
          id={BACKLOG_ID}
          title="Backlog"
          subtitle={`${backlogStories.length} US non classée${backlogStories.length > 1 ? "s" : ""}`}
          empty={backlogStories.length === 0}
          emptyMessage="Toutes les US sont rattachées à un epic."
        >
          <SortableContext
            items={backlogStories.map((us) => us.id)}
            strategy={verticalListSortingStrategy}
            disabled={pending}
          >
            {backlogStories.map((us) => (
              <UserStoryMiniCard
                key={us.id}
                story={us}
                epicName={undefined}
                disabled={pending}
              />
            ))}
          </SortableContext>
        </BoardColumn>

        {/* 1 colonne par epic */}
        {epics.map((epic) => {
          const epicStories = storiesByEpic.get(epic.id) ?? [];
          return (
            <BoardColumn
              key={epic.id}
              id={epic.id}
              title={epic.name}
              subtitle={`${epicStories.length} US`}
              empty={epicStories.length === 0}
              emptyMessage="Glissez une US ici pour la rattacher à cet epic."
            >
              <SortableContext
                items={epicStories.map((us) => us.id)}
                strategy={verticalListSortingStrategy}
                disabled={pending}
              >
                {epicStories.map((us) => (
                  <UserStoryMiniCard
                    key={us.id}
                    story={us}
                    epicName={epic.name}
                    disabled={pending}
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