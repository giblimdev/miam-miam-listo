/*
path :           app/core/components/SprintStoriesBoard.tsx
tag :            ["scrum", "sprint", "board", "dnd", "ui"]
projectId:       new-genesis
type:            component
generic:         false

role:            Board DnD à deux colonnes (Backlog ↔ Sprint). La colonne
                 Backlog contient les US sans sprint (ordre global, non
                 réordonnable). La colonne Sprint contient les US du sprint
                 courant, réordonnables par glisser-déposer. Une US peut
                 passer d'une colonne à l'autre par drag. Le composant est
                 purement présentationnel : il remonte les changements via
                 onChange(inSprintIds). Le sous-composant Column reçoit une
                 prop `empty: boolean` explicite (plus fiable que tester
                 `children` car SortableContext rend un Fragment).

flow:            Reçoit backlog (US) + inSprint (US ordonnées) + onChange
                 → DndContext + 2 * SortableContext + useDroppable par
                 colonne → handleDragEnd calcule : réordonnancement (source
                 = dest = sprint), ajout (backlog → sprint), retrait
                 (sprint → backlog) → onChange(newIds).

ecosystem:       ScrumUI = [
                   "@/app/core/components/scrum/EpicCard.tsx",
                   "@/app/core/components/scrum/EpicForm.tsx",
                   "@/app/core/components/scrum/EpicList.tsx",
                   "@/app/core/components/scrum/FeatureCard.tsx",
                   "@/app/core/components/scrum/FeatureForm.tsx",
                   "@/app/core/components/scrum/FeatureList.tsx",
                   "@/app/core/components/scrum/FlowSelector.tsx",
                   "@/app/core/components/scrum/GlobalJsonExport.tsx",
                   "@/app/core/components/scrum/IdeeCard.tsx",
                   "@/app/core/components/scrum/IdeeDetailDialog.tsx",
                   "@/app/core/components/scrum/IdeeForm.tsx",
                   "@/app/core/components/scrum/IdeeList.tsx",
                   "@/app/core/components/scrum/PersonaCard.tsx",
                   "@/app/core/components/scrum/PersonaForm.tsx",
                   "@/app/core/components/scrum/PersonaList.tsx",
                   "@/app/core/components/scrum/ScrumNav.tsx",
                   "@/app/core/components/scrum/SortableItem.tsx",
                   "@/app/core/components/scrum/SortableList.tsx",
                   "@/app/core/components/scrum/SprintCard.tsx",
                   "@/app/core/components/scrum/SprintEditor.tsx",
                   "@/app/core/components/scrum/SprintForm.tsx",
                   "@/app/core/components/scrum/SprintList.tsx",
                   "@/app/core/components/scrum/SprintStoriesBoard.tsx",
                   "@/app/core/components/scrum/UserStoryCard.tsx",
                   "@/app/core/components/scrum/UserStoryForm.tsx",
                   "@/app/core/components/scrum/UserStoryList.tsx",
                   "@/app/core/components/scrum/UserStoryMiniCard.tsx",
                 ]

relatedFiles:    ["@/app/core/lib/scrum/types.ts",
                  "@/app/core/components/scrum/UserStoryMiniCard.tsx",
                  "@/app/core/components/scrum/SprintEditor.tsx"]

imports:         ["react", "@dnd-kit/core", "@dnd-kit/sortable",
                  "@/app/core/lib/scrum/types",
                  "@/app/core/components/scrum/UserStoryMiniCard"]

exports:         ["SprintStoriesBoard", "SprintStoriesBoardProps"]

useBy:           ["@/app/core/components/scrum/SprintEditor.tsx"]

userStories:     ["*en tant qu'utilisateur je veux déplacer les US entre backlog et sprint par DnD"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : DndContext + useDroppable (interaction DnD côté client).

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { UserStory } from "@/app/scrum/lib/types";
import { UserStoryMiniCard } from "@/app/scrum/components/UserStoryMiniCard";

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const BACKLOG_ID = "backlog-column";
const SPRINT_ID = "sprint-column";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface SprintStoriesBoardProps {
  /** US du flow qui ne sont dans aucun sprint (colonne gauche). */
  readonly backlog: readonly UserStory[];
  /** US du sprint courant, dans l'ordre courant (colonne droite). */
  readonly inSprint: readonly UserStory[];
  /** Map epicId → epicName pour l'affichage dans les mini-cartes. */
  readonly epicNames: ReadonlyMap<string, string>;
  /** Remonte la nouvelle liste ordonnée d'ids du sprint après un drop. */
  readonly onChange: (inSprintIds: string[]) => void;
  /** Désactive le drag (pendant une mutation en cours). */
  readonly disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function SprintStoriesBoard({
  backlog,
  inSprint,
  epicNames,
  onChange,
  disabled = false,
}: SprintStoriesBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sprintIds = inSprint.map((s) => s.id);
  const backlogIds = backlog.map((s) => s.id);
  const allStoryIds = new Set([...sprintIds, ...backlogIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function findContainer(id: string): "backlog" | "sprint" | null {
    if (id === BACKLOG_ID) return "backlog";
    if (id === SPRINT_ID) return "sprint";
    if (sprintIds.includes(id)) return "sprint";
    if (backlogIds.includes(id)) return "backlog";
    return null;
  }

  /* ------------------------------------------------------------------ */
  /*  Handlers                                                           */
  /* ------------------------------------------------------------------ */

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeIdStr = String(event.active.id);
    const overIdStr = event.over ? String(event.over.id) : null;
    setActiveId(null);

    if (!overIdStr || disabled) return;

    const from = findContainer(activeIdStr);
    const to = findContainer(overIdStr);
    if (!from || !to) return;

    // Cas 1 : réordonnancement dans le sprint
    if (from === "sprint" && to === "sprint") {
      const oldIndex = sprintIds.indexOf(activeIdStr);
      const newIndex = sprintIds.indexOf(overIdStr);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      onChange(arrayMove(sprintIds, oldIndex, newIndex));
      return;
    }

    // Cas 2 : ajout (backlog → sprint)
    if (from === "backlog" && to === "sprint") {
      const atIndex = sprintIds.indexOf(overIdStr);
      const next =
        atIndex === -1
          ? [...sprintIds, activeIdStr] // drop sur le container vide
          : [
              ...sprintIds.slice(0, atIndex),
              activeIdStr,
              ...sprintIds.slice(atIndex),
            ];
      onChange(next);
      return;
    }

    // Cas 3 : retrait (sprint → backlog)
    if (from === "sprint" && to === "backlog") {
      onChange(sprintIds.filter((id) => id !== activeIdStr));
      return;
    }

    // Cas 4 : réordonnancement dans le backlog → ignoré (ordre global).
    // Le backlog garde l'ordre `order` des US du flow.
  }

  function handleDragOver(_event: DragOverEvent) {
    // Rien à faire : le calcul du changement de container se fait dans
    // handleDragEnd. handleDragOver resterait utile pour une prévisualisation
    // avancée (déplacement visuel en direct entre colonnes), reportée v2.
  }

  /* ------------------------------------------------------------------ */
  /*  Rendu                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Colonne gauche : Backlog */}
        <Column
          id={BACKLOG_ID}
          title="Backlog"
          subtitle={`${backlog.length} US sans sprint`}
          empty={backlog.length === 0}
          emptyMessage="Toutes les US du flux sont assignées à un sprint."
        >
          <SortableContext
            items={backlogIds}
            strategy={verticalListSortingStrategy}
            disabled={disabled}
          >
            {backlog.map((story) => (
              <UserStoryMiniCard
                key={story.id}
                story={story}
                epicName={
                  story.epicId ? epicNames.get(story.epicId) : undefined
                }
                disabled={disabled}
              />
            ))}
          </SortableContext>
        </Column>

        {/* Colonne droite : Sprint */}
        <Column
          id={SPRINT_ID}
          title="Sprint"
          subtitle={`${inSprint.length} US dans le sprint`}
          empty={inSprint.length === 0}
          emptyMessage="Glissez une US ici pour l'ajouter au sprint."
        >
          <SortableContext
            items={sprintIds}
            strategy={verticalListSortingStrategy}
            disabled={disabled}
          >
            {inSprint.map((story) => (
              <UserStoryMiniCard
                key={story.id}
                story={story}
                epicName={
                  story.epicId ? epicNames.get(story.epicId) : undefined
                }
                disabled={disabled}
              />
            ))}
          </SortableContext>
        </Column>
      </div>

      {/* Indicateur de drag actif (feedback discret en bas du board) */}
      {activeId && allStoryIds.has(activeId) && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Relâchez pour déplacer…
        </p>
      )}
    </DndContext>
  );
}

/* ------------------------------------------------------------------ */
/*  Sous-composant : colonne droppable                                 */
/* ------------------------------------------------------------------ */

interface ColumnProps {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  /** True si la colonne est vide (prop explicite, plus fiable que children). */
  readonly empty: boolean;
  readonly emptyMessage: string;
  readonly children: React.ReactNode;
}

function Column({
  id,
  title,
  subtitle,
  empty,
  emptyMessage,
  children,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between">
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </header>

      <div
        ref={setNodeRef}
        className={`flex min-h-[240px] flex-col gap-2 rounded-2xl border-2 border-dashed p-3 transition-colors ${
          isOver
            ? "border-chart-1/60 bg-chart-1/5"
            : "border-border/60 bg-muted/10"
        }`}
      >
        {children}
        {empty && (
          <p className="grid flex-1 place-items-center py-8 text-center text-xs text-muted-foreground">
            {emptyMessage}
          </p>
        )}
      </div>
    </section>
  );
}
