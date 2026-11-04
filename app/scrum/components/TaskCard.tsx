/*
path :           app/scrum/components/TaskCard.tsx
tag :            ["scrum", "task", "card", "ui"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Carte de présentation d'une task. Affiche le titre, le
                 badge de statut (todo/in_progress/done), la description,
                 la UserStory parente résolue côté List (fallback sur
                 storyId si orpheline) et l'estimation. Boutons Éditer /
                 Supprimer fournis par props. Une prop `readOnly` (défaut
                 false) permet de masquer le footer d'actions lorsque la
                 carte est utilisée dans un contexte purement présentationnel
                 (ex. TaskBoard en mode drag-only). Sans `readOnly`, le
                 footer est rendu ; avec `readOnly`, il est omis — ce qui
                 évite les boutons morts (règle 8 : états UX).

flow:            Reçoit task + storyTitle + callbacks (onEdit, onDelete)
                 + readOnly? → rend une carte avec icône, badge de statut,
                 contenu et actions. Si readOnly === true, le footer
                 d'actions est omis (les callbacks sont ignorés).

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
                  "@/app/scrum/components/TaskList.tsx",
                  "@/app/scrum/components/TaskBoard.tsx"]

imports:         ["lucide-react",
                  "@/app/scrum/lib/types",
                  "@/components/ui/button"]

exports:         ["TaskCard", "TaskCardProps"]

useBy:           ["@/app/scrum/components/TaskList.tsx",
                  "@/app/scrum/components/TaskBoard.tsx"]

userStories:     ["*en tant que développeur je veux afficher une task sous forme de carte"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
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
  /**
   * Mode lecture seule : masque le footer d'actions. Utilisé par TaskBoard
   * (drag-only) pour éviter des boutons morts (règle 8 : états UX).
   * Défaut : false.
   */
  readonly readOnly?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function TaskCard({
  task,
  storyTitle,
  onEdit,
  onDelete,
  readOnly = false,
}: TaskCardProps) {
  // Affichage de l'US : titre si résolu, sinon l'id brut (orphelin).
  const storyLabel = storyTitle ?? task.storyId ?? "Non rattachée";

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

      {!readOnly && (
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
      )}
    </article>
  );
}