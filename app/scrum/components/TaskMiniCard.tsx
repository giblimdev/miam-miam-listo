/*
path :           app/scrum/components/TaskMiniCard.tsx
tag :            ["scrum", "task", "mini", "card", "dnd", "ui", "cross-container", "design", "readability"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Carte compacte d'une task pour les boards DnD.
                 Utilisée dans TaskBoard (Task ↔ US). Équivalent
                 structurel de UserStoryMiniCard, mais adaptée aux
                 champs spécifiques d'une task :

                 DESIGN : la carte change d'apparence selon son
                 contexte :
                 - Unassigned (storyTitle absent, storyId absent) :
                   icône Inbox, carré chart-5, badge "Non rattachée".
                 - Rattachée (storyTitle fourni) : icône ListTodo,
                   carré chart-2, badge "Rattachée".
                 - US orpheline (storyId fourni mais storyTitle
                   absent — US supprimée) : icône TriangleAlert,
                   carré destructive, badge "US introuvable".

                 Le badge de STATUT (todo / in_progress / done) est
                 affiché à côté du badge de rattachement, avec la
                 couleur du statut (muted / chart-3 / chart-4).

                 LISIBILITÉ : le titre N'EST PAS tronqué. Il peut
                 prendre autant de lignes que nécessaire. La poignée
                 de drag est en POSITION ABSOLUE (coin supérieur
                 droit, révélée au hover). L'icône (24px) est
                 alignée en haut à gauche. Les badges sont sur une
                 ligne séparée, en dessous du titre.

                 ⚠️ CROSS-CONTAINER DND : `containerId` est REQUIS et
                 transmis à useSortable({ data: { containerId } }).
                 Indispensable pour le cross-container DnD.

flow:            Reçoit task + storyTitle? + containerId + disabled
                 → détermine le variant → useSortable({ id, disabled,
                 data: { containerId } }) → rendu adapté : bande
                 colorée + poignée absolute (hover) + icône alignée
                 top + titre non tronqué + badges (rattachement +
                 statut + estimation).

ecosystem:       Scrum = [
                   "@/app/scrum/components/TaskBoard.tsx",
                   "@/app/scrum/components/TaskMiniCard.tsx",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/types.ts",
                  "@/app/scrum/components/TaskBoard.tsx"]

imports:         ["@dnd-kit/sortable", "@dnd-kit/utilities",
                  "lucide-react",
                  "@/app/scrum/lib/types"]

exports:         ["TaskMiniCard", "TaskMiniCardProps"]

useBy:           ["@/app/scrum/components/TaskBoard.tsx"]

userStories:     ["*en tant qu'utilisateur je veux glisser une task entre deux colonnes"]

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
  ListTodo,
  TriangleAlert,
} from "lucide-react";

import type { Task, TaskStatus } from "@/app/scrum/lib/types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface TaskMiniCardProps {
  readonly task: Task;
  /**
   * Titre de la UserStory résolu côté parent.
   * - undefined + task.storyId absent → carte "Non rattachée".
   * - undefined + task.storyId présent → carte orpheline (US
   *   supprimée ou storyId invalide).
   * - string → carte rattachée à une US.
   */
  readonly storyTitle?: string;
  /**
   * ID du container parent (unassigned-column ou story.id).
   * Transmis à useSortable({ data: { containerId } }) pour que le
   * DndContext puisse identifier le container source lors du drag.
   * INDISPENSABLE pour le cross-container DnD.
   */
  readonly containerId: string;
  readonly disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Variants                                                           */
/* ------------------------------------------------------------------ */

type Variant = "unassigned" | "attached" | "orphan";

interface VariantConfig {
  readonly icon: typeof Inbox;
  readonly accent: string;
  readonly badgeLabel: string;
  readonly badgeClass: string;
}

const VARIANTS: Record<Variant, VariantConfig> = {
  unassigned: {
    icon: Inbox,
    accent: "chart-5",
    badgeLabel: "Non rattachée",
    badgeClass: "bg-chart-5/15 text-chart-5",
  },
  attached: {
    icon: ListTodo,
    accent: "chart-2",
    badgeLabel: "Rattachée",
    badgeClass: "bg-chart-2/15 text-chart-2",
  },
  orphan: {
    icon: TriangleAlert,
    accent: "destructive",
    badgeLabel: "US introuvable",
    badgeClass: "bg-destructive/15 text-destructive",
  },
};

/* ------------------------------------------------------------------ */
/*  Statuts                                                            */
/* ------------------------------------------------------------------ */

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};

const STATUS_CLASS: Record<TaskStatus, string> = {
  todo: "bg-muted/60 text-muted-foreground",
  in_progress: "bg-chart-3/15 text-chart-3",
  done: "bg-chart-4/15 text-chart-4",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function resolveVariant(
  task: Task,
  storyTitle: string | undefined,
): Variant {
  if (storyTitle) return "attached";
  if (task.storyId) return "orphan";
  return "unassigned";
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function TaskMiniCard({
  task,
  storyTitle,
  containerId,
  disabled = false,
}: TaskMiniCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled,
    data: { containerId },
  });

  const variant = resolveVariant(task, storyTitle);
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

      {/* Poignée de drag — ABSOLUE, révélée au hover. Ne prend plus
          de place dans le flux : le titre a toute la largeur. */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label="Glisser la task"
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
          {/* Titre NON tronqué. */}
          <p
            className="break-words text-sm font-semibold leading-snug text-foreground"
            title={task.title}
          >
            {task.title}
          </p>

          {/* Badges sur une ligne séparée */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span
              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.badgeClass}`}
            >
              {config.badgeLabel}
            </span>

            <span
              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_CLASS[task.status]}`}
            >
              {STATUS_LABEL[task.status]}
            </span>

            {task.estimate && (
              <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {task.estimate}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}