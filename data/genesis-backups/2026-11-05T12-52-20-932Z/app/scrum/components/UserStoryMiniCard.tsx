/*
path :           app/scrum/components/UserStoryMiniCard.tsx
tag :            ["scrum", "user-story", "mini", "card", "dnd", "ui", "cross-container", "design", "readability", "edit"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Carte compacte d'une user story pour les boards DnD.
                 Utilisée dans UserStoryBoard (US ↔ Epic),
                 SprintBoardDnd (US ↔ Sprint) et SprintStoriesBoard
                 (éditeur de sprint contrôlé).

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

                 ⚠️ CROSS-CONTAINER DND : `containerId` est REQUIS et
                 transmis à useSortable({ data: { containerId } }).
                 C'est ce qui permet au DndContext parent de savoir
                 dans quel container se trouve la carte au moment du
                 drag. Sans cette prop, le cross-container ne
                 fonctionne pas.

                 ⚠️ CLIC POUR ÉDITER : si `onEdit` est fourni, le
                 CORPS de la carte (hors poignée de drag) devient
                 cliquable et appelle onEdit(story). La poignée de
                 drag reste la SEULE zone qui démarre un drag —
                 le clic sur le corps n'interfère pas avec dnd-kit
                 (aucun listener sur le wrapper, le clic est un
                 simple <button role="button">). Pendant un drag
                 (isDragging), le clic est neutralisé pour éviter
                 une édition fantôme.

flow:            Reçoit story + epicName + containerId + disabled +
                 onEdit? → détermine le variant → useSortable({ id,
                 disabled, data: { containerId } }) → rendu adapté :
                 bande colorée + poignée absolute (hover, seule zone
                 DnD) + zone cliquable (corps) + icône alignée top
                 + titre non tronqué + badges.

ecosystem:       Scrum = [
                   "@/app/scrum/components/UserStoryMiniCard.tsx",
                   "@/app/scrum/components/UserStoryBoard.tsx",
                   "@/app/scrum/components/SprintStoriesBoard.tsx",
                   "@/app/scrum/components/SprintBoardDnd.tsx",
                   "@/app/scrum/components/BoardColumn.tsx",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/types.ts",
                  "@/app/scrum/components/UserStoryBoard.tsx",
                  "@/app/scrum/components/SprintStoriesBoard.tsx",
                  "@/app/scrum/components/SprintBoardDnd.tsx"]

imports:         ["@dnd-kit/sortable", "@dnd-kit/utilities",
                  "lucide-react",
                  "@/app/scrum/lib/types"]

exports:         ["UserStoryMiniCard", "UserStoryMiniCardProps"]

useBy:           ["@/app/scrum/components/UserStoryBoard.tsx",
                  "@/app/scrum/components/SprintStoriesBoard.tsx",
                  "@/app/scrum/components/SprintBoardDnd.tsx"]

userStories:     ["*en tant qu'utilisateur je veux glisser une US entre deux colonnes",
                  "*en tant qu'utilisateur je veux cliquer sur une US pour l'éditer"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useSortable (interaction DnD côté client) + onClick.

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
  /**
   * Nom de l'Epic résolu côté parent.
   * - undefined + story.epicId absent → carte en Backlog.
   * - undefined + story.epicId présent → carte orpheline (Epic
   *   supprimé ou epicId invalide).
   * - string → carte dans une colonne Epic.
   */
  readonly epicName?: string;
  /**
   * ID du container parent (backlog-column, epic.id, ou
   * sprint-column). Transmis à useSortable({ data: { containerId } })
   * pour que le DndContext puisse identifier le container source lors
   * du drag. INDISPENSABLE pour le cross-container DnD.
   */
  readonly containerId: string;
  readonly disabled?: boolean;
  /**
   * Callback de clic sur le corps de la carte (hors poignée de drag).
   * Si fourni, la carte devient un bouton cliquable (clavier + Entrée/
   * Espace supportés) qui appelle onEdit(story). Le clic est neutralisé
   * pendant un drag actif.
   */
  readonly onEdit?: (story: UserStory) => void;
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
  onEdit,
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
  const interactive = Boolean(onEdit);

  function handleClick() {
    /* Pendant un drag actif, on ignore le clic (évite l'édition
       fantôme après un drop). */
    if (isDragging || disabled) return;
    onEdit?.(story);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!interactive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  }

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

      {/* Poignée de drag — ABSOLUE, révélée au hover. Seule zone
          qui démarre un drag. */}
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

      {/* Corps cliquable (si onEdit fourni). Le rôle et tabIndex
          sont posés uniquement dans ce cas pour ne pas polluer
          l'arbre d'accessibilité des boards read-only. */}
      <div
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={interactive ? handleClick : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        aria-label={interactive ? `Éditer ${story.title}` : undefined}
        className={
          interactive
            ? "flex cursor-pointer items-start gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            : "flex items-start gap-2"
        }
      >
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