/*
path :           app/scrum/components/SprintStoriesBoard.tsx
tag :            ["scrum", "sprint", "board", "dnd", "ui", "hydration", "cross-container"]
projectId:       new-genesis
type:            component
generic:         false

role:            Board DnD à deux colonnes (Backlog ↔ Sprint). La
                 colonne Backlog contient les US sans sprint (ordre
                 global, non réordonnable). La colonne Sprint contient
                 les US du sprint courant, réordonnables par
                 glisser-déposer. Une US peut passer d'une colonne à
                 l'autre par drag. Le composant est purement
                 présentationnel : il remonte les changements via
                 onChange(inSprintIds).

                 ⚠️ CROSS-CONTAINER DND : chaque UserStoryMiniCard
                 reçoit `containerId` (BACKLOG_ID ou SPRINT_ID) pour
                 que le DndContext du parent sache de quelle colonne
                 vient la carte. C'est indispensable pour que le
                 handler du parent (SprintEditor) calcule correctement
                 la cible du drop.

                 ⚠️ CORRECTIF HYDRATATION : un `id` stable produit par
                 `useId()` est passé à <DndContext>. Sans cet id,
                 dnd-kit génère un identifiant via un compteur global
                 (`DndDescribedBy-N`), qui diverge entre le serveur et
                 le client — et qui plus est, entre les multiples
                 DndContext montés dans l'app (SortableList,
                 SprintStoriesBoard) → React lève « tree hydrated but
                 some attributes of the server rendered HTML didn't
                 match the client ». `useId()` garantit la même valeur
                 SSR/client (même position dans l'arbre).

flow:            Reçoit backlog (US) + inSprint (US ordonnées) +
                 onChange → useId() → dndId stable → DndContext(id=
                 dndId) + 2 * SortableContext + useDroppable par
                 colonne → handleDragEnd calcule : réordonnancement
                 (source = dest = sprint), ajout (backlog → sprint),
                 retrait (sprint → backlog) → onChange(newIds).
                 Chaque UserStoryMiniCard reçoit containerId
                 (BACKLOG_ID ou SPRINT_ID).

ecosystem:       Scrum = [
                   "@/app/scrum/components/SprintStoriesBoard.tsx",
                   "@/app/scrum/components/UserStoryMiniCard.tsx",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/types.ts",
                  "@/app/scrum/components/UserStoryMiniCard.tsx",
                  "@/app/scrum/components/SprintEditor.tsx"]

imports:         ["react", "@dnd-kit/core", "@dnd-kit/sortable",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/components/UserStoryMiniCard"]

exports:         ["SprintStoriesBoard", "SprintStoriesBoardProps"]

useBy:           ["@/app/scrum/components/SprintEditor.tsx"]

userStories:     ["*en tant qu'utilisateur je veux déplacer les US entre backlog et sprint par DnD"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : DndContext + useDroppable (interaction DnD côté client).

import { useId, useState } from "react";
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
  /* Id stable SSR/client : évite le mismatch d'hydratation sur les
     aria-describedby générés par dnd-kit pour chaque poignée. */
  const dndId = useId();
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
      id={dndId}
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
                containerId={BACKLOG_ID}
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
                containerId={SPRINT_ID}
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