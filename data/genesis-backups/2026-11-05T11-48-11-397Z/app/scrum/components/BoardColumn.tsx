/*
path :           app/scrum/components/BoardColumn.tsx
tag :            ["scrum", "board", "column", "dnd", "ui", "generic", "design"]
projectId:       <à fournir>
type:            component
generic:         true

role:            Colonne droppable générique pour les boards DnD du
                 module Scrum.

                 DESIGN (refonte) : le header est en 2 zones —
                 (1) icône dans un carré dégradé coloré (accent) +
                 titre en text-base font-bold, (2) badge compteur
                 proéminent à droite. Le conteneur a une bordure
                 colorée selon `accent` (au lieu du gris neutre) et
                 un fond très légèrement teinté. En drag-over, la
                 bordure et le fond passent en chart-1/40 et
                 chart-1/10 bien visibles. Le message vide est
                 affiché dans un bloc centré avec une icône et un
                 texte plus lisible.

                 Rétrocompatible : `icon` et `accent` restent
                 optionnels. Sans eux, le rendu reste neutre (utile
                 pour TaskBoard et SprintStoriesBoard qui n'utilisent
                 pas encore ces props).

flow:            Reçoit id, title, subtitle, empty, emptyMessage,
                 children + icon? + accent? → useDroppable({ id }) →
                 rend <section> avec :
                 - header : carré icône dégradé (accent) + titre +
                   badge compteur (subtitle).
                 - conteneur droppable : bordure colorée 2px (accent,
                   ou chart-1/60 si isOver), fond accent/5.
                 - children.
                 - état vide : icône + message centré.

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

exports:         ["BoardColumn", "BoardColumnProps"]

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
/*  Props                                                              */
/* ------------------------------------------------------------------ */

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
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  /* Icône par défaut si non fournie. */
  const Icon = icon ?? Inbox;

  return (
    <section
      className="flex min-w-0 flex-col gap-2"
      style={{ "--accent": `var(--${accent})` } as React.CSSProperties}
    >
      {/* ======================= HEADER ======================= */}
      <header className="flex items-center gap-2.5 rounded-xl bg-card/80 px-3 py-2 shadow-sm ring-1 ring-border/60 backdrop-blur">
        {/* Icône dans un carré dégradé coloré */}
        <span
          className="grid size-8 shrink-0 place-items-center rounded-lg text-white shadow-md"
          style={{
            background: `linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 60%, black))`,
          }}
        >
          <Icon className="size-4" aria-hidden />
        </span>

        {/* Titre + sous-titre */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold tracking-tight text-foreground">
            {title}
          </h3>
          <p
            className="truncate text-[11px] font-medium uppercase tracking-wider"
            style={{ color: `var(--accent)` }}
          >
            {subtitle}
          </p>
        </div>

        {/* Badge compteur proéminent */}
        <span
          className="grid h-7 min-w-7 shrink-0 place-items-center rounded-full px-2 text-xs font-bold tabular-nums text-white shadow-sm"
          style={{
            background: `linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 60%, black))`,
          }}
          aria-label={`${subtitle}`}
        >
          {empty ? "0" : subtitle.match(/\d+/)?.[0] ?? "0"}
        </span>
      </header>

      {/* ======================= CONTENEUR ======================= */}
      <div
        ref={setNodeRef}
        className="flex min-h-[260px] flex-col gap-2.5 rounded-2xl border-2 border-dashed p-3 transition-all"
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

        {/* État vide — icône + message lisible */}
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