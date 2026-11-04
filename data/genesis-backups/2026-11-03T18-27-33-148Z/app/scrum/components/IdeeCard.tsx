/*
path :           app/core/components/IdeeCard.tsx
tag :            ["scrum", "idee", "card", "ui"]
projectId:       new-genesis
type:            component
generic:         false

role:            Carte de présentation d'une idée Scrum. Affiche le titre, le
                 problème, les hypothèses et le contexte en aperçu (line-clamp
                 avec whitespace-pre-wrap pour préserver les sauts de ligne).
                 Trois actions fournies par props : Lire (ouvre la modale de
                 lecture), Éditer, Supprimer.

flow:            Reçoit une Idee + 3 callbacks (onRead, onEdit, onDelete) →
                 rend une carte animée avec icône, titre, contenu tronqué
                 et actions.

ecosystem:       ScrumUI = [
                   "@/app/core/components/scrum/EpicCard.tsx",
                   "@/app/core/components/scrum/EpicForm.tsx",
                   "@/app/core/components/scrum/EpicList.tsx",
                   "@/app/core/components/scrum/FeatureCard.tsx",
                   "@/app/core/components/scrum/FeatureForm.tsx",
                   "@/app/core/components/scrum/FeatureList.tsx",
                   "@/app/core/components/scrum/FlowSelector.tsx",
                   "@/app/core/components/scrum/GlobalJsonExport.tsx",
                   "@/app/core/components/scrum/IdeeCard.tsx",
                   "@/app/core/components/scrum/IdeeDetailDialog.tsx",
                   "@/app/core/components/scrum/IdeeForm.tsx",
                   "@/app/core/components/scrum/IdeeList.tsx",
                   "@/app/core/components/scrum/PersonaCard.tsx",
                   "@/app/core/components/scrum/PersonaForm.tsx",
                   "@/app/core/components/scrum/PersonaList.tsx",
                   "@/app/core/components/scrum/ScrumNav.tsx",
                   "@/app/core/components/scrum/SprintCard.tsx",
                   "@/app/core/components/scrum/SprintForm.tsx",
                   "@/app/core/components/scrum/SprintList.tsx",
                   "@/app/core/components/scrum/UserStoryCard.tsx",
                   "@/app/core/components/scrum/UserStoryForm.tsx",
                   "@/app/core/components/scrum/UserStoryList.tsx",
                 ]

relatedFiles:    ["@/app/core/lib/scrum/types.ts",
                  "@/app/core/components/scrum/IdeeList.tsx"]

imports:         ["lucide-react",
                  "@/app/core/lib/scrum/types",
                  "@/components/ui/button"]

exports:         ["IdeeCard", "IdeeCardProps"]

useBy:           ["@/app/core/components/scrum/IdeeList.tsx"]

userStories:     ["*en tant que développeur je veux afficher une idée sous forme de carte"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : boutons interactifs (onRead, onEdit, onDelete).

import { BookOpen, Lightbulb, Pencil, Trash2 } from "lucide-react";

import type { Idee } from "@/app/scrum/lib/types";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface IdeeCardProps {
  readonly idee: Idee;
  readonly onRead: (idee: Idee) => void;
  readonly onEdit: (idee: Idee) => void;
  readonly onDelete: (idee: Idee) => void;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function IdeeCard({ idee, onRead, onEdit, onDelete }: IdeeCardProps) {
  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow duration-300 hover:shadow-xl"
      style={{ "--accent": "var(--chart-1)" } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-70"
        style={{
          background: "linear-gradient(90deg, var(--chart-1), transparent)",
        }}
      />

      <header className="mb-3 flex items-start gap-3">
        <div
          className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-md"
          style={{
            background:
              "linear-gradient(135deg, var(--chart-1), color-mix(in oklab, var(--chart-1) 60%, black))",
          }}
        >
          <Lightbulb className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className="cursor-pointer truncate text-base font-bold tracking-tight text-foreground hover:underline"
            onClick={() => onRead(idee)}
            title={idee.title}
          >
            {idee.title}
          </h3>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-1">
            Idée
          </p>
        </div>
      </header>

      <dl className="space-y-2.5 text-sm">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Problème
          </dt>
          <dd className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-foreground/80">
            {idee.problem}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Hypothèses
          </dt>
          <dd className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-foreground/80">
            {idee.hypotheses}
          </dd>
        </div>

        {idee.context && (
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Contexte
            </dt>
            <dd className="mt-0.5 line-clamp-2 whitespace-pre-wrap break-words text-foreground/70">
              {idee.context}
            </dd>
          </div>
        )}
      </dl>

      <footer className="mt-4 flex items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRead(idee)}
          aria-label={`Lire ${idee.title}`}
        >
          <BookOpen className="size-3.5" aria-hidden />
          Lire
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(idee)}
          aria-label={`Éditer ${idee.title}`}
        >
          <Pencil className="size-3.5" aria-hidden />
          Éditer
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(idee)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Supprimer ${idee.title}`}
        >
          <Trash2 className="size-3.5" aria-hidden />
          Supprimer
        </Button>
      </footer>
    </article>
  );
}
