/*
path :           app/core/components/TaskCard.tsx
tag :            ["scrum", "task", "card", "ui"]
projectId:       new-genesis
type:            component
generic:         false

role:            Carte de présentation d'une task. Affiche le titre, le
                 badge de statut (todo/in_progress/done), la description,
                 la UserStory parente résolue côté List (fallback sur
                 storyId si orpheline) et l'estimation. Boutons Éditer /
                 Supprimer fournis par props.

flow:            Reçoit task + storyTitle + callbacks (onEdit, onDelete)
                 → rend une carte avec icône, badge de statut, contenu et
                 actions.

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
                   "@/app/core/components/scrum/IdeeForm.tsx",
                   "@/app/core/components/scrum/IdeeList.tsx",
                   "@/app/core/components/scrum/PersonaCard.tsx",
                   "@/app/core/components/scrum/PersonaForm.tsx",
                   "@/app/core/components/scrum/PersonaList.tsx",
                   "@/app/core/components/scrum/ScrumNav.tsx",
                   "@/app/core/components/scrum/SortableItem.tsx",
                   "@/app/core/components/scrum/SortableList.tsx",
                   "@/app/core/components/scrum/SprintCard.tsx",
                   "@/app/core/components/scrum/SprintForm.tsx",
                   "@/app/core/components/scrum/SprintList.tsx",
                   "@/app/core/components/scrum/TaskCard.tsx",
                   "@/app/core/components/scrum/TaskForm.tsx",
                   "@/app/core/components/scrum/TaskList.tsx",
                   "@/app/core/components/scrum/UserStoryCard.tsx",
                   "@/app/core/components/scrum/UserStoryForm.tsx",
                   "@/app/core/components/scrum/UserStoryList.tsx",
                 ]

relatedFiles:    ["@/app/core/lib/scrum/types.ts",
                  "@/app/core/components/scrum/TaskList.tsx"]

imports:         ["lucide-react",
                  "@/app/core/lib/scrum/types",
                  "@/components/ui/button"]

exports:         ["TaskCard", "TaskCardProps"]

useBy:           ["@/app/core/components/scrum/TaskList.tsx"]

userStories:     ["*en tant que développeur je veux afficher une task sous forme de carte"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : boutons interactifs (onEdit, onDelete).

import { ListTodo, Pencil, Trash2 } from "lucide-react";

import type { Task, TaskStatus } from "@/app/scrum/lib/types";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Mapping statut                                                     */
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
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface TaskCardProps {
  readonly task: Task;
  /**
   * Titre de la UserStory résolu côté TaskList (via Map<storyId, title>).
   * undefined si storyId est absent ou si l'US a été supprimée.
   */
  readonly storyTitle?: string;
  readonly onEdit: (task: Task) => void;
  readonly onDelete: (task: Task) => void;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function TaskCard({
  task,
  storyTitle,
  onEdit,
  onDelete,
}: TaskCardProps) {
  // Affichage de l'US : titre si résolu, sinon l'id brut (orphelin).
  const storyLabel = storyTitle ?? task.storyId;

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
          <ListTodo className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold tracking-tight text-foreground">
            {task.title}
          </h3>
          <p className="mt-0.5">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASS[task.status]}`}
            >
              {STATUS_LABEL[task.status]}
            </span>
          </p>
        </div>
      </header>

      <dl className="space-y-2.5 text-sm">
        {task.description && (
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </dt>
            <dd className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-foreground/80">
              {task.description}
            </dd>
          </div>
        )}

        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            User story
          </dt>
          <dd className="mt-0.5 truncate text-foreground/80" title={storyLabel}>
            {storyLabel}
          </dd>
        </div>

        {(task.assignee || task.estimate) && (
          <div className="flex flex-wrap gap-3 pt-1">
            {task.assignee && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigné
                </dt>
                <dd className="text-sm font-medium text-foreground/80">
                  {task.assignee}
                </dd>
              </div>
            )}
            {task.estimate && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Estimation
                </dt>
                <dd className="text-sm font-medium text-foreground/80">
                  {task.estimate}
                </dd>
              </div>
            )}
          </div>
        )}
      </dl>

      <footer className="mt-4 flex items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(task)}
        >
          <Pencil className="size-3.5" aria-hidden />
          Éditer
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(task)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Supprimer
        </Button>
      </footer>
    </article>
  );
}
