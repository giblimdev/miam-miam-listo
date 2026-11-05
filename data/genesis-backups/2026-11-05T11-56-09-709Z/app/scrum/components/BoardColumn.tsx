/*
path :           app/scrum/components/BoardColumn.tsx
tag :            ["scrum", "board", "column", "dnd", "ui", "generic", "design"]
projectId:       <à fournir>
type:            component
generic:         true

role:            Colonne droppable générique pour les boards DnD du
                 module Scrum.

                 DESIGN : le header est en 2 zones (icône dégradée +
                 titre + badge compteur). Le conteneur a une bordure
                 colorée selon `accent` et un fond légèrement teinté.
                 En drag-over, la bordure et le fond passent en
                 chart-1/60 et chart-1/8 bien visibles.

                 VARIANT : deux modes de rendu.
                 - "grid" (défaut) : colonne classique, hauteur
                   min 260px, message vide centré. Utilisé pour les
                   colonnes Epic.
                 - "sidebar" : colonne sticky, hauteur 100% du
                   parent, header plus compact, scroll interne
                   indépendant. Utilisé pour le Backlog (toujours
                   visible, ne scrolle pas avec les Epics).

flow:            Reçoit id, title, subtitle, empty, emptyMessage,
                 children + icon? + accent? + variant? → useDroppable
                 ({ id }) → rendu adapté au variant.

ecosystem:       Scrum = [
                   "@/app/scrum/components/BoardColumn.tsx",
                   "@/app/scrum/components/UserStoryBoard.tsx",
                   "@/app/scrum/components/TaskBoard.tsx",
                   "@/app/scrum/components/SprintStoriesBoard.tsx",
                 ]

relatedFiles:    ["@/app/scrum/components/UserStoryBoard.tsx",
                  "@/app/scrum/components/TaskBoard.tsx",
                  "@/app/scrum/components/SprintStoriesBoard.tsx"]

imports:         ["@dnd-kit/core", "lucide-react",
                  "type LucideIcon"]

exports:         ["BoardColumn", "BoardColumnProps", "BoardColumnVariant"]

useBy:           ["@/app/scrum/components/UserStoryBoard.tsx",
                  "@/app/scrum/components/TaskBoard.tsx",
                  "@/app/scrum/components/SprintStoriesBoard.tsx"]

userStories:     ["*en tant que développeur je veux une colonne droppable réutilisable et lisible"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useDroppable (interaction DnD côté client).

import { useDroppable } from "@dnd-kit/core";
import { Inbox, type LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type BoardColumnVariant = "grid" | "sidebar";

export interface BoardColumnProps {
  /** Id unique de la zone droppable (utilisé par findContainer). */
  readonly id: string;
  /** Titre affiché en haut de colonne. */
  readonly title: string;
  /** Sous-titre (ex. "3 US"). Affiché comme badge compteur. */
  readonly subtitle: string;
  /** True si la colonne est vide (message affiché à la place). */
  readonly empty: boolean;
  /** Message affiché quand empty === true. */
  readonly emptyMessage: string;
  /** Cartes à rendre dans la colonne. */
  readonly children: React.ReactNode;
  /** Icône optionnelle du header (ex. Inbox, Layers). Défaut : Inbox. */
  readonly icon?: LucideIcon;
  /** Couleur d'accent Tailwind (ex. "chart-4"). Défaut : "chart-1". */
  readonly accent?: string;
  /**
   * Mode de rendu :
   * - "grid" (défaut) : colonne classique dans une grille.
   * - "sidebar" : colonne sticky qui occupe 100% de la hauteur du
   *   parent, avec scroll interne indépendant. Utilisé pour le
   *   Backlog dans UserStoryBoard.
   */
  readonly variant?: BoardColumnVariant;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function BoardColumn({
  id,
  title,
  subtitle,
  empty,
  emptyMessage,
  children,
  icon,
  accent = "chart-1",
  variant = "grid",
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const Icon = icon ?? Inbox;
  const isSidebar = variant === "sidebar";

  return (
    <section
      className={`flex min-w-0 flex-col gap-2 ${
        isSidebar ? "h-full" : ""
      }`}
      style={{ "--accent": `var(--${accent})` } as React.CSSProperties}
    >
      {/* ======================= HEADER ======================= */}
      <header
        className={`flex items-center gap-2.5 rounded-xl bg-card/80 shadow-sm ring-1 ring-border/60 backdrop-blur ${
          isSidebar ? "px-2.5 py-1.5" : "px-3 py-2"
        }`}
      >
        <span
          className={`grid shrink-0 place-items-center rounded-lg text-white shadow-md ${
            isSidebar ? "size-7" : "size-8"
          }`}
          style={{
            background: `linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 60%, black))`,
          }}
        >
          <Icon className={isSidebar ? "size-3.5" : "size-4"} aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <h3
            className={`truncate font-bold tracking-tight text-foreground ${
              isSidebar ? "text-sm" : "text-sm"
            }`}
          >
            {title}
          </h3>
          <p
            className="truncate text-[11px] font-medium uppercase tracking-wider"
            style={{ color: `var(--accent)` }}
          >
            {subtitle}
          </p>
        </div>

        <span
          className={`grid shrink-0 place-items-center rounded-full px-2 text-xs font-bold tabular-nums text-white shadow-sm ${
            isSidebar ? "h-6 min-w-6" : "h-7 min-w-7"
          }`}
          style={{
            background: `linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 60%, black))`,
          }}
          aria-label={subtitle}
        >
          {empty ? "0" : subtitle.match(/\d+/)?.[0] ?? "0"}
        </span>
      </header>

      {/* ======================= CONTENEUR ======================= */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2.5 rounded-2xl border-2 border-dashed p-3 transition-all ${
          isSidebar
            ? "min-h-0 flex-1 overflow-y-auto overscroll-contain"
            : "min-h-[260px]"
        }`}
        style={{
          borderColor: isOver
            ? "color-mix(in oklab, var(--chart-1) 60%, transparent)"
            : `color-mix(in oklab, var(--accent) 25%, transparent)`,
          backgroundColor: isOver
            ? "color-mix(in oklab, var(--chart-1) 8%, transparent)"
            : `color-mix(in oklab, var(--accent) 4%, transparent)`,
        }}
      >
        {children}

        {empty && (
          <div className="grid flex-1 place-items-center py-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <span
                className="grid size-10 place-items-center rounded-full"
                style={{
                  backgroundColor: `color-mix(in oklab, var(--accent) 12%, transparent)`,
                  color: `var(--accent)`,
                }}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">
                {emptyMessage}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}