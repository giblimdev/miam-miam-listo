/*
path :           app/scrum/components/UserStoryBoard.tsx
tag :            ["scrum", "user-story", "board", "dnd", "ui", "hydration", "cross-container", "design", "sidebar", "flex", "scroll", "fix", "epic-name"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Board DnD à N colonnes : Backlog (US sans epic) + 1
                 colonne par epic.

                 LAYOUT : flex horizontal sur desktop.
                 - Sidebar Backlog : `lg:h-[calc(100svh-5rem)]
                   lg:w-[320px] lg:shrink-0` + `lg:flex lg:flex-col`
                   (hauteur FIXE → contexte flex pour le scroll
                   interne) + sticky top-16.
                 - Zone Epics : `min-w-0 flex-1` — peut rétrécir
                   sans déborder. Grille 1/2 colonnes (xl:grid-cols-2)
                   pour que chaque carte Epic ait plus de largeur.
                 - Mobile (< lg) : flex-col → Backlog en haut (hauteur
                   auto, pas de scroll interne), Epics en dessous.

                 Le scroll interne du Backlog est assuré par
                 BoardColumn variant="sidebar" (flex-1 min-h-0
                 overflow-y-auto overflow-x-hidden [&>*]:shrink-0).

                 ⚠️ CROSS-CONTAINER DND : un SEUL <SortableContext>
                 global englobe TOUTES les cartes.

                 ⚠️ CORRECTIF HYDRATATION : `useId()` fournit un id
                 stable SSR/client à <DndContext>.

                 ⚠️ CORRECTIF FIN DE DRAG : le conteneur source est
                 RECALCULÉ à partir des props `stories` + `knownEpicIds`
                 au lieu de `event.active.data.current?.containerId`.
                 Cette donnée interne à dnd-kit est peu fiable en fin
                 de drag (perdue si le composant source est re-rendu
                 pendant le drag, ce qui arrive avec router.refresh()
                 ou un state pending). Le recalcul rend le handler
                 déterministe.

                 ⚠️ GARDE TARGETEPICID : si l'utilisateur lâche une
                 US sur une colonne Epic, on vérifie que
                 `targetEpicId` existe bien dans `knownEpicIds` AVANT
                 d'appeler l'action serveur.

                 ⚠️ CORRECTIF « EPIC INTROUVABLE » (affichage) : la
                 colonne Epic doit transmettre `epicName={epic.name}`
                 à <UserStoryMiniCard>. Sans cette prop,
                 resolveVariant() retourne "orphan" dès que
                 story.epicId est défini → badge « Epic introuvable »
                 affiché à tort après un drop réussi. C'était un bug
                 d'AFFICHAGE, pas de DnD : la mutation serveur avait
                 bien eu lieu, seule la carte re-rendue ne recevait
                 pas le nom de l'Epic.

flow:            Reçoit flow + stories + epics → useId() → dndId
                 stable → useMemo (backlogStories, storiesByEpic,
                 allStoryIds) → DndContext(id=dndId) → SortableContext
                 (global) → layout flex avec sidebar h- fixe.
                 handleDragEnd :
                 1. Récupère storyId + overId.
                 2. Recalcule fromContainer depuis `stories` (source
                    de vérité serveur) : epicId valide → epicId, sinon
                    BACKLOG_ID.
                 3. Calcule toContainer via findContainer(overId).
                 4. Si fromContainer === toContainer → no-op.
                 5. targetEpicId = toContainer === BACKLOG_ID ? null :
                    toContainer. Si non-null et absent de
                    knownEpicIds → toast.error + return (garde).
                 6. moveUserStoryToEpicAction(flow, storyId,
                    targetEpicId) → router.refresh() ou toast.error.

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

  /* Source de vérité pour la résolution des epicId. */
  const knownEpicIds = useMemo(
    () => new Set(epics.map((e) => e.id)),
    [epics],
  );

  /* Backlog : US sans epicId OU avec un epicId invalide (epic supprimé). */
  const backlogStories = useMemo(
    () =>
      stories.filter(
        (us) => !us.epicId || !knownEpicIds.has(us.epicId),
      ),
    [stories, knownEpicIds],
  );

  /* Map epicId → UserStory[] (uniquement les US rattachées à un epic existant). */
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

  /* Liste plate de tous les IDs (pour le SortableContext global). */
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

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Résout le conteneur d'un id donné. L'id peut être :
   * - BACKLOG_ID            → backlog
   * - un id d'Epic          → cet Epic
   * - un id de UserStory    → le conteneur de rattachement de cette US
   *                           (epicId valide → Epic, sinon backlog)
   *
   * ⚠️ Ce helper est la SEULE source de vérité pour `toContainer`.
   * Il ne dépend PAS de `event.active.data.current`.
   */
  function findContainer(id: string): string | null {
    if (id === BACKLOG_ID) return BACKLOG_ID;
    if (knownEpicIds.has(id)) return id;
    const story = stories.find((us) => us.id === id);
    if (!story) return null;
    return story.epicId && knownEpicIds.has(story.epicId)
      ? story.epicId
      : BACKLOG_ID;
  }

  /**
   * Recalcule le conteneur SOURCE d'une story à partir des props
   * serveur (`stories` + `knownEpicIds`). Remplace l'usage de
   * `event.active.data.current?.containerId`.
   */
  function resolveSourceContainer(storyId: string): string | null {
    const story = stories.find((us) => us.id === storyId);
    if (!story) return null;
    return story.epicId && knownEpicIds.has(story.epicId)
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

    /* 1. Conteneur source : recalcul déterministe depuis les props. */
    const fromContainer = resolveSourceContainer(storyId);
    if (!fromContainer) return;

    /* 2. Conteneur cible : résolution robuste via findContainer. */
    const toContainer = findContainer(overId);
    if (!toContainer || fromContainer === toContainer) return;

    /* 3. Cible finale. */
    const targetEpicId = toContainer === BACKLOG_ID ? null : toContainer;

    /* 4. Garde : si l'epic cible n'existe pas, on refuse AVANT
          l'appel serveur. Évite "Epic introuvable" côté UI après
          refresh. */
    if (targetEpicId !== null && !knownEpicIds.has(targetEpicId)) {
      toast.error("Epic introuvable : impossible de rattacher l'US.");
      return;
    }

    /* 5. Mutation. */
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
      <SortableContext
        items={allStoryIds}
        strategy={verticalListSortingStrategy}
        disabled={pending}
      >
        {/* Layout flex : sidebar 320px (Backlog) + zone Epics
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
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
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
                        epicName={epic.name}
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