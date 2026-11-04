/*
path :           app/core/components/FeatureCard.tsx
tag :            ["scrum", "feature", "card", "ui"]
projectId:       new-genesis
type:            component
generic:         false

role:            Carte de présentation d'une feature Scrum. Affiche le titre, la
                 description, l'intérêt et la liste des personas associés. Boutons
                 d'action (éditer, supprimer) fournis par props.

flow:            Reçoit une Feature + callbacks (onEdit, onDelete) → rend une carte
                 animée avec icône, contenu et actions.

ecosystem:       ScrumUI = [
                   "@/app/components/scrum/EpicCard.tsx",
                   "@/app/components/scrum/EpicForm.tsx",
                   "@/app/components/scrum/EpicList.tsx",
                   "@/app/components/scrum/FeatureCard.tsx",
                   "@/app/components/scrum/FeatureForm.tsx",
                   "@/app/components/scrum/FeatureList.tsx",
                   "@/app/components/scrum/FlowSelector.tsx",
                   "@/app/components/scrum/GlobalJsonExport.tsx",
                   "@/app/components/scrum/IdeeCard.tsx",
                   "@/app/components/scrum/IdeeForm.tsx",
                   "@/app/components/scrum/IdeeList.tsx",
                   "@/app/components/scrum/PersonaCard.tsx",
                   "@/app/components/scrum/PersonaForm.tsx",
                   "@/app/components/scrum/PersonaList.tsx",
                   "@/app/components/scrum/ScrumNav.tsx",
                   "@/app/components/scrum/SprintCard.tsx",
                   "@/app/components/scrum/SprintForm.tsx",
                   "@/app/components/scrum/SprintList.tsx",
                   "@/app/components/scrum/UserStoryCard.tsx",
                   "@/app/components/scrum/UserStoryForm.tsx",
                   "@/app/components/scrum/UserStoryList.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/scrum/types.ts",
                  "@/app/scrum/components/FeatureList.tsx"]

imports:         ["lucide-react",
                  "@/app/scrum/lib/scrum/types",
                  "@/components/ui/button"]

exports:         ["FeatureCard", "FeatureCardProps"]

useBy:           ["@/app/scrum/components/FeatureList.tsx"]

userStories:     ["*en tant que développeur je veux afficher une feature sous forme de carte"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : boutons interactifs (onEdit, onDelete).

import { Sparkles, Pencil, Trash2 } from "lucide-react";

import type { Feature } from "@/app/scrum/lib/types";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface FeatureCardProps {
  readonly feature: Feature;
  readonly onEdit: (feature: Feature) => void;
  readonly onDelete: (feature: Feature) => void;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function FeatureCard({ feature, onEdit, onDelete }: FeatureCardProps) {
  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow duration-300 hover:shadow-xl"
      style={{ "--accent": "var(--chart-2)" } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-70"
        style={{
          background: "linear-gradient(90deg, var(--chart-2), transparent)",
        }}
      />

      <header className="mb-3 flex items-start gap-3">
        <div
          className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-md"
          style={{
            background:
              "linear-gradient(135deg, var(--chart-2), color-mix(in oklab, var(--chart-2) 60%, black))",
          }}
        >
          <Sparkles className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold tracking-tight text-foreground">
            {feature.title}
          </h3>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-2">
            Feature
          </p>
        </div>
      </header>

      <dl className="space-y-2.5 text-sm">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </dt>
          <dd className="mt-0.5 line-clamp-3 text-foreground/80">
            {feature.description}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Intérêt
          </dt>
          <dd className="mt-0.5 line-clamp-2 text-foreground/80">
            {feature.interest}
          </dd>
        </div>

        {feature.personas.length > 0 && (
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Personas
            </dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {feature.personas.map((persona) => (
                <span
                  key={persona}
                  className="inline-flex items-center rounded-full bg-chart-2/10 px-2 py-0.5 text-[11px] font-medium text-chart-2"
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
          onClick={() => onEdit(feature)}
          aria-label={`Éditer ${feature.title}`}
        >
          <Pencil className="size-3.5" aria-hidden />
          Éditer
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(feature)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Supprimer ${feature.title}`}
        >
          <Trash2 className="size-3.5" aria-hidden />
          Supprimer
        </Button>
      </footer>
    </article>
  );
}
