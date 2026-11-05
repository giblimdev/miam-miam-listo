/*
path :           app/scrum/components/UserStoryMiniCard.tsx
tag :            ["scrum", "user-story", "mini", "card", "dnd", "ui", "cross-container", "design"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Carte compacte d'une user story pour les boards DnD.
                 Utilisée dans UserStoryBoard (US ↔ Epic) et dans
                 SprintStoriesBoard (US ↔ Sprint).

                 DESIGN : carte à bande colorée (chart-1 en haut),
                 icône ListChecks dans un carré dégradé, titre en
                 font-semibold line-clamp-2, badges colorés (epic en
                 chart-4, estimation en muted, "Non rattachée" en
                 chart-5 si pas d'epic). Poignée de drag MASQUÉE par
                 défaut, révélée au hover/focus pour ne pas polluer
                 visuellement. Padding p-3, hover:shadow-md pour un
                 feedback net.

                 ⚠️ CROSS-CONTAINER DND : la prop `containerId` est
                 transmise à useSortable({ data: { containerId } }).
                 Indispensable pour que le cross-container DnD
                 fonctionne (Chantier D).

flow:            Reçoit story + epicName + containerId + disabled →
                 useSortable({ id, disabled, data: { containerId } })
                 → wrapper div + bande colorée + poignée (hover) +
                 icône + contenu + badges.

ecosystem:       Scrum = [
                   "@/app/scrum/components/UserStoryMiniCard.tsx",
                   "@/app/scrum/components/UserStoryBoard.tsx",
                   "@/app/scrum/components/SprintStoriesBoard.tsx",
                   "@/app/scrum/components/BoardColumn.tsx",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/types.ts",
                  "@/app/scrum/components/UserStoryBoard.tsx",
                  "@/app/scrum/components/SprintStoriesBoard.tsx"]

imports:         ["@dnd-kit/sortable", "@dnd-kit/utilities",
                  "lucide-react",
                  "@/app/scrum/lib/types"]

exports:         ["UserStoryMiniCard", "UserStoryMiniCardProps"]

useBy:           ["@/app/scrum/components/UserStoryBoard.tsx",
                  "@/app/scrum/components/SprintStoriesBoard.tsx"]

userStories:     ["*en tant qu'utilisateur je veux glisser une US entre deux colonnes"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useSortable (interaction DnD côté client).

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ListChecks } from "lucide-react";

import type { UserStory } from "@/app/scrum/lib/types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface UserStoryMiniCardProps {
  readonly story: UserStory;
  /**
   * Nom de l'Epic résolu côté parent. undefined si la carte est dans
   * le Backlog (aucun epic) OU si l'epicId est orphelin (epic
   * supprimé). Dans ce cas un badge "Non rattachée" est affiché.
   */
  readonly epicName?: string;
  /**
   * ID du container parent (backlog-column ou epic.id).
   * Transmis à useSortable({ data: { containerId } }) pour que le
   * DndContext puisse identifier le container source lors du drag.
   * INDISPENSABLE pour le cross-container DnD.
   */
  readonly containerId: string;
  readonly disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function UserStoryMiniCard({
  story,
  epicName,
  containerId,
  disabled = false,
}: UserStoryMiniCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: story.id,
    disabled,
    data: { containerId },
  });

  /* Une US sans epicName = pas rattachée (ou epic supprimé). */
  const isUnassigned = !epicName;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 20 : undefined,
        "--accent": isUnassigned ? "var(--muted)" : "var(--chart-1)",
      } as React.CSSProperties}
      className="group relative flex items-start gap-2.5 overflow-hidden rounded-xl border border-border/60 bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Bande colorée en haut — chart-1 si rattachée, muted sinon */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-80"
        style={{
          background: isUnassigned
            ? "linear-gradient(90deg, var(--muted-foreground), transparent)"
            : "linear-gradient(90deg, var(--chart-1), transparent)",
        }}
      />

      {/* Poignée de drag — masquée par défaut, révélée au hover/focus */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label="Glisser la user story"
        className="mt-1 grid size-6 shrink-0 cursor-grab place-items-center rounded-md text-muted-foreground/40 opacity-0 transition-all hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 active:cursor-grabbing disabled:cursor-not-allowed"
      >
        <GripVertical className="size-3.5" aria-hidden />
      </button>

      {/* Icône ListChecks — carré dégradé chart-1 ou muted */}
      <div
        className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-white shadow-sm"
        style={{
          background: isUnassigned
            ? "linear-gradient(135deg, var(--muted-foreground), color-mix(in oklab, var(--muted-foreground) 60%, black))"
            : "linear-gradient(135deg, var(--chart-1), color-mix(in oklab, var(--chart-1) 60%, black))",
        }}
      >
        <ListChecks className="size-3.5" aria-hidden />
      </div>

      {/* Contenu : titre + badges */}
      <div className="min-w-0 flex-1">
        <p
          className="line-clamp-2 text-sm font-semibold leading-snug text-foreground"
          title={story.title}
        >
          {story.title}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {epicName && (
            <span className="inline-flex max-w-full items-center truncate rounded-full bg-chart-4/15 px-2 py-0.5 text-[11px] font-medium text-chart-4">
              {epicName}
            </span>
          )}
          {isUnassigned && (
            <span className="inline-flex items-center rounded-full bg-chart-5/15 px-2 py-0.5 text-[11px] font-medium text-chart-5">
              Non rattachée
            </span>
          )}
          {story.estimate && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {story.estimate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}