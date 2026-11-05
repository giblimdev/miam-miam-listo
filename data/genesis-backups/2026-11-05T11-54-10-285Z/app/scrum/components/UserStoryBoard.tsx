/*
path :           app/scrum/components/UserStoryBoard.tsx
tag :            ["scrum", "user-story", "board", "dnd", "ui", "hydration", "cross-container", "design", "sidebar", "flex"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Board DnD à N colonnes : Backlog (US sans epic) + 1
                 colonne par epic.

                 LAYOUT (version blindée) : flex horizontal sur desktop
                 — PAS un grid. Un grid parent avec une colonne `1fr`
                 peut déborder si la grille interne a un `min-content`
                 trop grand (ex. `grid-cols-3` + contenus larges), ce
                 qui pousse les cartes à la ligne suivante et les fait
                 apparaître SOUS la sidebar au lieu de rester à droite.

                 - Sidebar Backlog : `lg:w-[280px] lg:shrink-0`,
                   sticky top-16, hauteur viewport, scroll interne.
                 - Zone Epics : `min-w-0 flex-1` — peut rétrécir sans
                   déborder. Grille interne responsive 1/2/3 colonnes.
                 - Mobile (< lg) : flex-col → Backlog en haut, Epics
                   en dessous. Rien ne casse.

                 DESIGN : les cartes changent d'apparence selon leur
                 contexte (voir UserStoryMiniCard). Dans les colonnes
                 Epic, on ne passe PAS epicName à la carte — le nom
                 de l'Epic est déjà dans le header de la colonne.

                 ⚠️ CROSS-CONTAINER DND (Chantier D) : un SEUL
                 <SortableContext> global englobe TOUTES les cartes.
                 Chaque carte reçoit `containerId` via useSortable
                 ({ data }).

                 ⚠️ CORRECTIF HYDRATATION : `useId()` fournit un id
                 stable SSR/client à <DndContext>.

flow:            Reçoit flow + stories + epics → useId() → dndId
                 stable → useMemo (backlogStories, storiesByEpic,
                 allStoryIds) → DndContext(id=dndId) → SortableContext
                 (global) → layout flex :
                 - <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                 - <aside className="lg:sticky lg:top-16 lg:h-[calc(100svh-5rem)] lg:w-[280px] lg:shrink-0">
                   <BoardColumn variant="sidebar" id={BACKLOG_ID} ...>
                 - <div className="min-w-0 flex-1">
                   <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                     {epics.map(epic => <BoardColumn variant="grid" ...>)}
                 handleDragEnd gère le cross-container.

ecosystem:       Scrum = [
                   "@/app/scrum/components/BoardColumn.tsx",
                   "@/app/scrum/components/UserStoryBoard.tsx",
                   "@/app/scrum/components/UserStoryMiniCard.tsx",
                   "@/app/scrum/lib/actions/user-story.ts",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/components/BoardColumn.tsx",
                  "@/app/scrum/components/UserStoryMiniCard.tsx",
                  "@/app/scrum/lib/actions/user-story.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation", "sonner", "lucide-react",
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
import { Inbox, Layers } from "lucide-react";
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
  readonly stories: readonly UserStory[];
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

  const knownEpicIds = useMemo(
    () => new Set(epics.map((e) => e.id)),
    [epics],
  );

  const backlogStories = useMemo(
    () =>
      stories.filter(
        (us) => !us.epicId || !knownEpicIds.has(us.epicId),
      ),
    [stories, knownEpicIds],
  );

  const storiesByEpic = useMemo(() => {
    const map = new Map<string, UserStory[]>();
    for (const epic of epics) map.set(epic.id, []);
    for (const us of stories) {
      if (us.epicId && knownEpicIds.has(us.epicId)) {
        map.get(us.epicId)!.push(us);
      }
    }
    return map;
  }, [stories, knownEpicIds, epics]);

  const allStoryIds = useMemo(() => {
    const ids: string[] = backlogStories.map((us) => us.id);
    for (const epicStories of storiesByEpic.values()) {
      for (const us of epicStories) ids.push(us.id);
    }
    return ids;
  }, [backlogStories, storiesByEpic]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function findContainer(id: string): string | null {
    if (id === BACKLOG_ID) return BACKLOG_ID;
    if (epics.some((e) => e.id === id)) return id;
    const story = stories.find((us) => us.id === id);
    if (!story) return null;
    return story.epicId && knownEpicIds.has(story.epicId)
      ? story.epicId
      : BACKLOG_ID;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const storyId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    setActiveId(null);

    if (!overId || pending) return;

    const fromContainer =
      (event.active.data.current?.containerId as string | undefined) ?? null;
    const toContainer = findContainer(overId);

    if (!fromContainer || !toContainer || fromContainer === toContainer) {
      return;
    }

    const targetEpicId = toContainer === BACKLOG_ID ? null : toContainer;

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
        {/* ============================================================
            LAYOUT BLINDÉ : flex horizontal, PAS un grid.
            - Sidebar Backlog : lg:w-[280px] lg:shrink-0 (largeur fixe)
            - Zone Epics : min-w-0 flex-1 (peut rétrécir sans déborder)
            Sur mobile (< lg), flex-col → stack vertical.
            ============================================================ */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* =================== SIDEBAR BACKLOG =================== */}
          <aside
            className="lg:sticky lg:top-16 lg:h-[calc(100svh-5rem)] lg:w-[280px] lg:shrink-0"
            aria-label="Backlog"
          >
            <BoardColumn
              id={BACKLOG_ID}
              title="Backlog"
              subtitle={`${backlogStories.length} US non classée${
                backlogStories.length > 1 ? "s" : ""
              }`}
              empty={backlogStories.length === 0}
              emptyMessage="Toutes les US sont rattachées à un epic."
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

          {/* =================== GRILLE EPICS =================== */}
          {/* min-w-0 CRITIQUE : sans lui, la grille interne force sa
              largeur et déborde, poussant les cartes sous la sidebar. */}
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                    icon={Layers}
                    accent="chart-4"
                    variant="grid"
                  >
                    {epicStories.map((us) => (
                      <UserStoryMiniCard
                        key={us.id}
                        story={us}
                        /* epicName OMIS volontairement : le header de
                           la colonne porte déjà le nom de l'Epic. */
                        containerId={epic.id}
                        disabled={pending}
                      />
                    ))}
                  </BoardColumn>
                );
              })}
            </div>
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