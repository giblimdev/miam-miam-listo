/*
path :           app/scrum/components/EpicCard.tsx
tag :            ["scrum", "epic", "card", "ui"]
projectId:       new-genesis
type:            component
generic:         false

role:            Carte de présentation d'un epic Scrum. Affiche le nom, l'objectif,
                 le périmètre et les personas concernés. Boutons d'action (éditer,
                 supprimer) fournis par props.

flow:            Reçoit un Epic + callbacks (onEdit, onDelete) → rend une carte
                 animée avec icône, contenu et actions.

ecosystem:       ScrumUI = [
                   "@/app/scrum/components/EpicCard.tsx",
                   "@/app/scrum/components/EpicForm.tsx",
                   "@/app/scrum/components/EpicList.tsx",
                   "@/app/scrum/components/FeatureCard.tsx",
                   "@/app/scrum/components/FeatureForm.tsx",
                   "@/app/scrum/components/FeatureList.tsx",
                   "@/app/scrum/components/FlowSelector.tsx",
                   "@/app/scrum/components/GlobalJsonExport.tsx",
                   "@/app/scrum/components/IdeeCard.tsx",
                   "@/app/scrum/components/IdeeForm.tsx",
                   "@/app/scrum/components/IdeeList.tsx",
                   "@/app/scrum/components/PersonaCard.tsx",
                   "@/app/scrum/components/PersonaForm.tsx",
                   "@/app/scrum/components/PersonaList.tsx",
                   "@/app/scrum/components/ScrumNav.tsx",
                   "@/app/scrum/components/SprintCard.tsx",
                   "@/app/scrum/components/SprintForm.tsx",
                   "@/app/scrum/components/SprintList.tsx",
                   "@/app/scrum/components/UserStoryCard.tsx",
                   "@/app/scrum/components/UserStoryForm.tsx",
                   "@/app/scrum/components/UserStoryList.tsx",
                 ]

relatedFiles:    ["@/app/lib/scrum/types.ts",
                  "@/app/scrum/components/EpicList.tsx"]

imports:         ["lucide-react",
                  "@/app/core/lib/scrum/types",
                  "@/components/ui/button"]

exports:         ["EpicCard", "EpicCardProps"]

useBy:           ["@/components/scrum/EpicList.tsx"]

userStories:     ["*en tant que développeur je veux afficher un epic sous forme de carte"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : boutons interactifs (onEdit, onDelete).

import { Layers, Pencil, Trash2 } from "lucide-react";

import type { Epic } from "@/app/scrum/lib/types";
import { Button } from "@/components/ui/button";

export interface EpicCardProps {
  readonly epic: Epic;
  readonly onEdit: (epic: Epic) => void;
  readonly onDelete: (epic: Epic) => void;
}

export function EpicCard({ epic, onEdit, onDelete }: EpicCardProps) {
  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow duration-300 hover:shadow-xl"
      style={{ "--accent": "var(--chart-4)" } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-70"
        style={{
          background: "linear-gradient(90deg, var(--chart-4), transparent)",
        }}
      />

      <header className="mb-3 flex items-start gap-3">
        <div
          className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-md"
          style={{
            background:
              "linear-gradient(135deg, var(--chart-4), color-mix(in oklab, var(--chart-4) 60%, black))",
          }}
        >
          <Layers className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold tracking-tight text-foreground">
            {epic.name}
          </h3>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-4">
            Epic
          </p>
        </div>
      </header>

      <dl className="space-y-2.5 text-sm">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Objectif
          </dt>
          <dd className="mt-0.5 line-clamp-3 text-foreground/80">
            {epic.goal}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Périmètre
          </dt>
          <dd className="mt-0.5 line-clamp-2 text-foreground/80">
            {epic.scope}
          </dd>
        </div>

        {epic.personas.length > 0 && (
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Personas
            </dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {epic.personas.map((persona) => (
                <span
                  key={persona}
                  className="inline-flex items-center rounded-full bg-chart-4/10 px-2 py-0.5 text-[11px] font-medium text-chart-4"
                >
                  {persona}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>

      <footer className="mt-4 flex items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(epic)}
        >
          <Pencil className="size-3.5" aria-hidden />
          Éditer
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(epic)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Supprimer
        </Button>
      </footer>
    </article>
  );
}
