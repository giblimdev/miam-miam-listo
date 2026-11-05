/*
path :           app/scrum/components/SprintBoardDnd.tsx
tag :            ["scrum", "sprint", "board", "dnd", "ui", "hydration", "cross-container", "design", "sidebar", "flex", "scroll"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Board DnD US ↔ Sprint, ALIGNÉ SUR L'UI/UX de
                 UserStoryBoard (epic/board) et TaskBoard
                 (task/board). Layout flex horizontal sur desktop :
                 - Sidebar "Backlog" (320px, hauteur fixe, scroll
                   interne) : US sans sprint.
                 - Zone Sprints : grille 1/2 colonnes, une colonne
                   par sprint.
                 - Mobile (< lg) : stack vertical.

                 ⚠️ NE PAS CONFONDRE AVEC SprintStoriesBoard.tsx :
                 ce dernier est un board CONTRÔLÉ (state local + API
                 onChange) utilisé par SprintEditor.tsx dans
                 l'éditeur d'un sprint unique. SprintBoardDnd est
                 AUTONOME : il appelle directement la Server Action
                 moveUserStoryToSprintAction et fait
                 router.refresh(). Il remplace SprintBoardHub comme
                 contenu de /sprint/board.

                 ⚠️ CROSS-CONTAINER DND : un SEUL <SortableContext>
                 global englobe toutes les cartes.

                 ⚠️ CORRECTIF HYDRATATION : `useId()` fournit un id
                 stable SSR/client à <DndContext>.

                 ⚠️ CORRECTIF FIN DE DRAG : le conteneur source est
                 RECALCULÉ à partir des props `sprints` + `stories`
                 au lieu de `event.active.data.current?.containerId`
                 (peu fiable en fin de drag).

flow:            Reçoit flow + sprints + stories → useId() → dndId
                 stable → useMemo :
                 - backlogStories = stories non présentes dans un
                   storyIds de sprint.
                 - storiesBySprint = Map<sprintId, UserStory[]>.
                 - sprintTitleById (si besoin plus tard).
                 → DndContext(id=dndId) + 1 BoardColumn("backlog")
                 + N BoardColumn(sprint.id) avec SortableContext
                 global → handleDragEnd calcule (source, dest) →
                 moveUserStoryToSprintAction(flow, storyId,
                 destSprintId | null) → router.refresh() ou
                 toast.error.

ecosystem:       Scrum = [
                   "@/app/scrum/components/BoardColumn.tsx",
                   "@/app/scrum/components/SprintBoardDnd.tsx",
                   "@/app/scrum/components/UserStoryMiniCard.tsx",
                   "@/app/scrum/lib/actions/sprint.ts",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/components/BoardColumn.tsx",
                  "@/app/scrum/components/UserStoryMiniCard.tsx",
                  "@/app/scrum/lib/actions/sprint.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation", "sonner", "lucide-react",
                  "@dnd-kit/core", "@dnd-kit/sortable",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/actions/sprint",
                  "@/app/scrum/components/BoardColumn",
                  "@/app/scrum/components/UserStoryMiniCard"]

exports:         ["SprintBoardDnd", "SprintBoardDndProps"]

useBy:           ["@/app/scrum/[flow]/sprint/board/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux glisser une US entre backlog et sprint"]

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
import { Inbox, Rocket } from "lucide-react";
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

import type { ScrumFlow, Sprint, UserStory } from "@/app/scrum/lib/types";
import { moveUserStoryToSprintAction } from "@/app/scrum/lib/actions/sprint";
import { BoardColumn } from "@/app/scrum/components/BoardColumn";
import { UserStoryMiniCard } from "@/app/scrum/components/UserStoryMiniCard";

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const BACKLOG_ID = "backlog-column";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface SprintBoardDndProps {
  readonly flow: ScrumFlow;
  readonly sprints: readonly Sprint[];
  readonly stories: readonly UserStory[];
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function SprintBoardDnd({
  flow,
  sprints,
  stories,
}: SprintBoardDndProps) {
  const router = useRouter();
  const dndId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /* Source de vérité pour la résolution des sprintId. */
  const knownSprintIds = useMemo(
    () => new Set(sprints.map((s) => s.id)),
    [sprints],
  );

  /* Map storyId → sprintId (résolution inverse pour findContainer). */
  const sprintIdByStoryId = useMemo(() => {
    const map = new Map<string, string>();
    for (const sprint of sprints) {
      for (const storyId of sprint.storyIds) {
        map.set(storyId, sprint.id);
      }
    }
    return map;
  }, [sprints]);

  /* Map sprintId → UserStory[] (dans l'ordre des storyIds). */
  const storiesBySprint = useMemo(() => {
    const map = new Map<string, UserStory[]>();
    const storyById = new Map(stories.map((us) => [us.id, us]));
    for (const sprint of sprints) {
      const list: UserStory[] = [];
      for (const storyId of sprint.storyIds) {
        const story = storyById.get(storyId);
        if (story) list.push(story);
      }
      map.set(sprint.id, list);
    }
    return map;
  }, [sprints, stories]);

  /* Backlog : US non présentes dans un sprint valide. */
  const backlogStories = useMemo(
    () =>
      stories.filter((us) => {
        const sprintId = sprintIdByStoryId.get(us.id);
        return !sprintId || !knownSprintIds.has(sprintId);
      }),
    [stories, sprintIdByStoryId, knownSprintIds],
  );

  /* Liste plate de tous les IDs (pour le SortableContext global). */
  const allStoryIds = useMemo(() => {
    const ids: string[] = backlogStories.map((us) => us.id);
    for (const sprintStories of storiesBySprint.values()) {
      for (const us of sprintStories) ids.push(us.id);
    }
    return ids;
  }, [backlogStories, storiesBySprint]);

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
   * - BACKLOG_ID        → backlog
   * - un id de Sprint   → ce sprint
   * - un id de US       → le sprint de rattachement de cette US
   *                       (ou backlog si aucune)
   */
  function findContainer(id: string): string | null {
    if (id === BACKLOG_ID) return BACKLOG_ID;
    if (knownSprintIds.has(id)) return id;
    const story = stories.find((us) => us.id === id);
    if (!story) return null;
    const sprintId = sprintIdByStoryId.get(story.id);
    return sprintId && knownSprintIds.has(sprintId) ? sprintId : BACKLOG_ID;
  }

  /**
   * Recalcule le conteneur SOURCE d'une story depuis les props serveur.
   */
  function resolveSourceContainer(storyId: string): string | null {
    const story = stories.find((us) => us.id === storyId);
    if (!story) return null;
    const sprintId = sprintIdByStoryId.get(story.id);
    return sprintId && knownSprintIds.has(sprintId) ? sprintId : BACKLOG_ID;
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

    /* 1. Conteneur source : recalcul déterministe. */
    const fromContainer = resolveSourceContainer(storyId);
    if (!fromContainer) return;

    /* 2. Conteneur cible. */
    const toContainer = findContainer(overId);
    if (!toContainer || fromContainer === toContainer) return;

    /* 3. Cible finale. */
    const targetSprintId = toContainer === BACKLOG_ID ? null : toContainer;

    /* 4. Garde : si le sprint cible n'existe pas, on refuse. */
    if (targetSprintId !== null && !knownSprintIds.has(targetSprintId)) {
      toast.error("Sprint introuvable : impossible de rattacher l'US.");
      return;
    }

    /* 5. Mutation. */
    setPending(true);
    const result = await moveUserStoryToSprintAction(
      flow,
      storyId,
      targetSprintId,
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
      <SortableContext
        items={allStoryIds}
        strategy={verticalListSortingStrategy}
        disabled={pending}
      >
        {/* Layout flex : sidebar 320px (Backlog) + zone Sprints
            min-w-0 flex-1. Sur mobile (< lg), stack vertical. */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* =================== SIDEBAR BACKLOG =================== */}
          <aside
            className="lg:sticky lg:top-16 lg:flex lg:h-[calc(100svh-5rem)] lg:w-[320px] lg:shrink-0 lg:flex-col"
            aria-label="Backlog"
          >
            <BoardColumn
              id={BACKLOG_ID}
              title="Backlog"
              subtitle={`${backlogStories.length} US non assignée${
                backlogStories.length > 1 ? "s" : ""
              }`}
              empty={backlogStories.length === 0}
              emptyMessage="Toutes les US sont assignées à un sprint."
              icon={Inbox}
              accent="chart-5"
              variant="sidebar"
            >
              {backlogStories.map((us) => (
                <UserStoryMiniCard
                  key={us.id}
                  story={us}
                  epicName={undefined}
                  containerId={BACKLOG_ID}
                  disabled={pending}
                />
              ))}
            </BoardColumn>
          </aside>

          {/* =================== GRILLE SPRINTS =================== */}
          <div className="min-w-0 flex-1">
            {sprints.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                Aucun sprint pour l&apos;instant. Créez au moins un sprint pour
                pouvoir y assigner des user stories.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
                {sprints.map((sprint) => {
                  const sprintStories = storiesBySprint.get(sprint.id) ?? [];
                  return (
                    <BoardColumn
                      key={sprint.id}
                      id={sprint.id}
                      title={sprint.name}
                      subtitle={`${sprintStories.length} US`}
                      empty={sprintStories.length === 0}
                      emptyMessage="Glissez une US ici pour l'ajouter au sprint."
                      icon={Rocket}
                      accent="chart-1"
                      variant="grid"
                    >
                      {sprintStories.map((us) => (
                        <UserStoryMiniCard
                          key={us.id}
                          story={us}
                          epicName={undefined}
                          containerId={sprint.id}
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
