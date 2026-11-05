/*
path :           app/scrum/components/BoardColumn.tsx
tag :            ["scrum", "board", "column", "dnd", "ui", "generic", "design", "scroll", "ux", "shrink"]
projectId:       <à fournir>
type:            component
generic:         true

role:            Colonne droppable générique pour les boards DnD du
                 module Scrum.

                 DESIGN : header en 2 zones (icône dégradée + titre +
                 badge compteur). Conteneur coloré selon `accent`.
                 En drag-over, bordure et fond passent en chart-1.

                 VARIANT :
                 - "grid" (défaut) : colonne classique, min-h 260px,
                   pas de scroll interne. Utilisé pour les colonnes
                   Epic (la page scrolle).
                 - "sidebar" : colonne à hauteur 100% du parent,
                   header shrink-0, conteneur flex-1 min-h-0
                   overflow-y-auto overflow-x-hidden. Le scroll est
                   VERTICAL uniquement — jamais horizontal — sinon
                   les cartes seraient écrasées à l'horizontale.

                 ⚠️ CHAÎNE DE SCROLL (indispensable) :
                 - parent (h-[...] flex flex-col)
                 - section (h-full min-h-0 flex flex-col) — PAS
                   d'overflow-hidden sur la section, sinon les cartes
                   sont coupées.
                 - header (shrink-0)
                 - conteneur (flex-1 min-h-0 overflow-y-auto
                   overflow-x-hidden).
                 - ET `[&>*]:shrink-0` sur le conteneur : sans ça,
                   les cartes se compressent verticalement (flex-shrink
                   1 par défaut) et deviennent illisibles. `shrink-0`
                   les force à garder leur hauteur naturelle, ce qui
                   déclenche enfin le scroll.

                 ⚠️ LISIBILITÉ : les cartes ont `min-w-0` et le
                 conteneur `overflow-x-hidden` → les cartes ne peuvent
                 pas s'élargir au-delà de la largeur de la sidebar. Le
                 texte est en `break-words` (voir UserStoryMiniCard),
                 les badges passent à la ligne.

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

userStories:     ["*en tant que développeur je veux une colonne droppable réutilisable et scrollable"]

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
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly empty: boolean;
  readonly emptyMessage: string;
  readonly children: React.ReactNode;
  readonly icon?: LucideIcon;
  readonly accent?: string;
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
        isSidebar ? "h-full min-h-0" : ""
      }`}
      style={{ "--accent": `var(--${accent})` } as React.CSSProperties}
    >
      {/* ======================= HEADER ======================= */}
      {/* shrink-0 : ne rétrécit pas quand le conteneur scrolle. */}
      <header
        className={`flex shrink-0 items-center gap-2.5 rounded-xl bg-card/80 shadow-sm ring-1 ring-border/60 backdrop-blur ${
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
      {/* flex-1 min-h-0 : indispensable pour que overflow-y-auto
          fonctionne en contexte flexbox.
          overflow-y-auto : scroll vertical.
          overflow-x-hidden : empêche le conteneur de s'élargir en
          horizontal (sinon les cartes seraient écrasées).
          [&>*]:shrink-0 : empêche les cartes de se compresser
          VERTICALEMENT (sinon le texte devient illisible et le
          scroll ne se déclenche jamais). */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2.5 rounded-2xl border-2 border-dashed p-3 transition-all ${
          isSidebar
            ? "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [&>*]:shrink-0"
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