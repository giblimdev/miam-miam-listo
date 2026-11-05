/*
path :           app/scrum/components/UserStoryMiniCard.tsx
tag :            ["scrum", "user-story", "mini", "card", "dnd", "ui", "cross-container", "design", "readability"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Carte compacte d'une user story pour les boards DnD.

                 DESIGN : la carte change d'apparence selon son
                 contexte (Backlog vs Epic vs Epic orphelin) :
                 - Backlog (epicName absent, epicId absent) :
                   icône Inbox, carré chart-5, badge "Backlog".
                 - Epic (epicName fourni) : icône Layers, carré
                   chart-4, badge "Rattachée".
                 - Epic orphelin (epicId fourni mais epicName
                   absent) : icône TriangleAlert, carré destructive,
                   badge "Epic introuvable".

                 LISIBILITÉ : le titre N'EST PLUS TRONQUÉ (pas de
                 line-clamp-2). Il peut prendre autant de lignes que
                 nécessaire. La poignée de drag est en POSITION
                 ABSOLUE (coin supérieur droit, révélée au hover) —
                 elle ne prend plus de place dans le flux, laissant
                 toute la largeur au titre. L'icône (24px) est alignée
                 en haut à gauche. Les badges sont sur une ligne
                 séparée, en dessous du titre.

                 ⚠️ CROSS-CONTAINER DND : `containerId` transmis à
                 useSortable({ data: { containerId } }).

flow:            Reçoit story + epicName + containerId + disabled →
                 détermine le variant → useSortable → rendu adapté :
                 bande colorée + poignée absolute (hover) + icône
                 alignée top + titre non tronqué + badges.

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
import {
  GripVertical,
  Inbox,
  Layers,
  TriangleAlert,
} from "lucide-react";

import type { UserStory } from "@/app/scrum/lib/types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface UserStoryMiniCardProps {
  readonly story: UserStory;
  readonly epicName?: string;
  readonly containerId: string;
  readonly disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Variants                                                           */
/* ------------------------------------------------------------------ */

type Variant = "backlog" | "epic" | "orphan";

interface VariantConfig {
  readonly icon: typeof Inbox;
  readonly accent: string;
  readonly badgeLabel: string;
  readonly badgeClass: string;
}

const VARIANTS: Record<Variant, VariantConfig> = {
  backlog: {
    icon: Inbox,
    accent: "chart-5",
    badgeLabel: "Backlog",
    badgeClass: "bg-chart-5/15 text-chart-5",
  },
  epic: {
    icon: Layers,
    accent: "chart-4",
    badgeLabel: "Rattachée",
    badgeClass: "bg-chart-4/15 text-chart-4",
  },
  orphan: {
    icon: TriangleAlert,
    accent: "destructive",
    badgeLabel: "Epic introuvable",
    badgeClass: "bg-destructive/15 text-destructive",
  },
};

function resolveVariant(
  story: UserStory,
  epicName: string | undefined,
): Variant {
  if (epicName) return "epic";
  if (story.epicId) return "orphan";
  return "backlog";
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

  const variant = resolveVariant(story, epicName);
  const config = VARIANTS[variant];
  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 20 : undefined,
        "--accent": `var(--${config.accent})`,
      } as React.CSSProperties}
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Bande colorée en haut */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-80"
        style={{
          background: `linear-gradient(90deg, var(--${config.accent}), transparent)`,
        }}
      />

      {/* Poignée de drag — ABSOLUE, révélée au hover. Ne prend plus de
          place dans le flux : le titre a toute la largeur. */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label="Glisser la user story"
        className="absolute right-1.5 top-1.5 z-10 grid size-6 cursor-grab place-items-center rounded-md bg-background/80 text-muted-foreground/60 opacity-0 shadow-sm backdrop-blur transition-all hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 active:cursor-grabbing disabled:cursor-not-allowed"
      >
        <GripVertical className="size-3.5" aria-hidden />
      </button>

      {/* Contenu : icône + titre + badges */}
      <div className="flex items-start gap-2">
        {/* Icône contextuelle — 24px, alignée en haut */}
        <div
          className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md text-white shadow-sm"
          style={{
            background: `linear-gradient(135deg, var(--${config.accent}), color-mix(in oklab, var(--${config.accent}) 60%, black))`,
          }}
        >
          <Icon className="size-3" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          {/* Titre NON tronqué — peut prendre autant de lignes que
              nécessaire. word-break pour les URLs/mots longs. */}
          <p
            className="break-words text-sm font-semibold leading-snug text-foreground"
            title={story.title}
          >
            {story.title}
          </p>

          {/* Badges sur une ligne séparée */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span
              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.badgeClass}`}
            >
              {config.badgeLabel}
            </span>

            {story.estimate && (
              <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {story.estimate}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}