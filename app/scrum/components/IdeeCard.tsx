/*
path :           app/scrum/components/IdeeCard.tsx
tag :            ["scrum", "idee", "card", "ui"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Carte de présentation d'une idée Scrum. Affiche le titre,
                 le problème, les hypothèses et le contexte en aperçu
                 (line-clamp avec whitespace-pre-wrap pour préserver les
                 sauts de ligne). Trois actions fournies par props : Lire
                 (ouvre la modale de lecture), Éditer, Supprimer. Une prop
                 `featured` (défaut false) permet un rendu éditorial plein
                 largeur quand il n'y a qu'une seule idée dans le flux :
                 titre plus grand, contenu non tronqué, layout en 2
                 colonnes sur desktop.

flow:            Reçoit une Idee + 3 callbacks (onRead, onEdit, onDelete)
                 + featured? → rend une carte animée avec icône, titre,
                 contenu tronqué (ou non si featured) et actions.

ecosystem:       Scrum = [
                   "@/app/scrum/components/BoardColumn.tsx",
                   "@/app/scrum/components/EpicCard.tsx",
                   "@/app/scrum/components/EpicForm.tsx",
                   "@/app/scrum/components/EpicList.tsx",
                   "@/app/scrum/components/FeatureCard.tsx",
                   "@/app/scrum/components/FeatureForm.tsx",
                   "@/app/scrum/components/FeatureList.tsx",
                   "@/app/scrum/components/FlowSelector.tsx",
                   "@/app/scrum/components/GlobalJsonExport.tsx",
                   "@/app/scrum/components/IdeeCard.tsx",
                   "@/app/scrum/components/IdeeDetailDialog.tsx",
                   "@/app/scrum/components/IdeeForm.tsx",
                   "@/app/scrum/components/IdeeList.tsx",
                   "@/app/scrum/components/PersonaCard.tsx",
                   "@/app/scrum/components/PersonaForm.tsx",
                   "@/app/scrum/components/PersonaList.tsx",
                   "@/app/scrum/components/ScrumNav.tsx",
                   "@/app/scrum/components/SortableItem.tsx",
                   "@/app/scrum/components/SortableList.tsx",
                   "@/app/scrum/components/SprintCard.tsx",
                   "@/app/scrum/components/SprintEditor.tsx",
                   "@/app/scrum/components/SprintForm.tsx",
                   "@/app/scrum/components/SprintList.tsx",
                   "@/app/scrum/components/SprintStoriesBoard.tsx",
                   "@/app/scrum/components/TaskBoard.tsx",
                   "@/app/scrum/components/TaskCard.tsx",
                   "@/app/scrum/components/TaskForm.tsx",
                   "@/app/scrum/components/TaskList.tsx",
                   "@/app/scrum/components/UserStoryBoard.tsx",
                   "@/app/scrum/components/UserStoryCard.tsx",
                   "@/app/scrum/components/UserStoryForm.tsx",
                   "@/app/scrum/components/UserStoryList.tsx",
                   "@/app/scrum/components/UserStoryMiniCard.tsx",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/types.ts",
                  "@/app/scrum/components/IdeeList.tsx"]

imports:         ["lucide-react",
                  "@/app/scrum/lib/types",
                  "@/components/ui/button"]

exports:         ["IdeeCard", "IdeeCardProps"]

useBy:           ["@/app/scrum/components/IdeeList.tsx"]

userStories:     ["*en tant que développeur je veux afficher une idée sous forme de carte"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
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
  /**
   * Rendu éditorial plein largeur (défaut : false). Activé quand il n'y a
   * qu'une seule idée dans le flux. Titre plus grand, contenu non tronqué,
   * layout en 2 colonnes sur desktop.
   */
  readonly featured?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function IdeeCard({
  idee,
  onRead,
  onEdit,
  onDelete,
  featured = false,
}: IdeeCardProps) {
  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow duration-300 hover:shadow-xl ${
        featured ? "p-6 sm:p-8" : "p-5"
      }`}
      style={{ "--accent": "var(--chart-1)" } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-70"
        style={{
          background: "linear-gradient(90deg, var(--chart-1), transparent)",
        }}
      />

      <header
        className={`mb-4 flex items-start gap-3 ${featured ? "sm:gap-4" : ""}`}
      >
        <div
          className={`grid shrink-0 place-items-center rounded-xl text-white shadow-md ${
            featured ? "size-12" : "size-10"
          }`}
          style={{
            background:
              "linear-gradient(135deg, var(--chart-1), color-mix(in oklab, var(--chart-1) 60%, black))",
          }}
        >
          <Lightbulb
            className={featured ? "size-6" : "size-5"}
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className={`cursor-pointer truncate font-bold tracking-tight text-foreground hover:underline ${
              featured ? "text-xl sm:text-2xl" : "text-base"
            }`}
            onClick={() => onRead(idee)}
            title={idee.title}
          >
            {idee.title}
          </h3>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-1">
            {featured ? "Idée fondatrice" : "Idée"}
          </p>
        </div>
      </header>

      {featured ? (
        <div className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-2">
          <Section label="Problème" tone="chart-1">
            {idee.problem}
          </Section>

          <Section label="Hypothèses" tone="chart-2">
            {idee.hypotheses}
          </Section>

          {idee.context && idee.context.length > 0 && (
            <div className="md:col-span-2">
              <Section label="Contexte" tone="chart-3">
                {idee.context}
              </Section>
            </div>
          )}
        </div>
      ) : (
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
      )}

      <footer
        className={`mt-4 flex items-center gap-1.5 ${
          featured ? "justify-end border-t border-border/60 pt-4" : "justify-end"
        }`}
      >
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

/* ------------------------------------------------------------------ */
/*  Sous-composant : section éditoriale                                */
/* ------------------------------------------------------------------ */

function Section({
  label,
  tone,
  children,
}: {
  readonly label: string;
  readonly tone: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section>
      <h4
        className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: `var(--${tone})` }}
      >
        {label}
      </h4>
      <div className="whitespace-pre-wrap break-words rounded-xl border border-border/60 bg-muted/20 p-4 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}