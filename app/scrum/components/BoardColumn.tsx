/*
path :           app/scrum/components/BoardColumn.tsx
tag :            ["scrum", "board", "column", "dnd", "ui", "generic"]
projectId:       <à fournir>
type:            component
generic:         true

role:            Colonne droppable générique pour les boards DnD du module
                 Scrum. Rend un header (titre + sous-titre) + un conteneur
                 droppable (useDroppable) + les children (cartes) + un
                 message d'état vide. Extraite de SprintStoriesBoard pour
                 être réutilisée par UserStoryBoard et TaskBoard. Le
                 tableau ecosystem est identique à tous les fichiers du
                 domaine Scrum (règle 3 : "Tous les fichiers du même
                 domaine portent EXACTEMENT le même tableau").

flow:            Reçoit id, title, subtitle, empty, emptyMessage, children
                 → useDroppable({ id }) → rend <section> avec header +
                 conteneur droppable (bordure dashed, bg chart-1/5 si isOver)
                 + children + message vide conditionnel. Utilisé par
                 SprintStoriesBoard, UserStoryBoard et TaskBoard.

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

relatedFiles:    ["@/app/scrum/components/SprintStoriesBoard.tsx",
                  "@/app/scrum/components/UserStoryBoard.tsx",
                  "@/app/scrum/components/TaskBoard.tsx"]

imports:         ["@dnd-kit/core"]

exports:         ["BoardColumn", "BoardColumnProps"]

useBy:           ["@/app/scrum/components/SprintStoriesBoard.tsx",
                  "@/app/scrum/components/UserStoryBoard.tsx",
                  "@/app/scrum/components/TaskBoard.tsx"]

userStories:     ["*en tant que développeur je veux une colonne droppable réutilisable"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useDroppable (interaction DnD côté client).

import { useDroppable } from "@dnd-kit/core";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface BoardColumnProps {
  /** Id unique de la zone droppable (utilisé par findContainer). */
  readonly id: string;
  /** Titre affiché en haut de colonne. */
  readonly title: string;
  /** Sous-titre (ex. "3 US"). */
  readonly subtitle: string;
  /** True si la colonne est vide (message affiché à la place). */
  readonly empty: boolean;
  /** Message affiché quand empty === true. */
  readonly emptyMessage: string;
  /** Cartes à rendre dans la colonne. */
  readonly children: React.ReactNode;
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
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="truncate text-sm font-bold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="shrink-0 text-xs text-muted-foreground">{subtitle}</p>
      </header>

      <div
        ref={setNodeRef}
        className={`flex min-h-[240px] flex-col gap-2 rounded-2xl border-2 border-dashed p-3 transition-colors ${
          isOver
            ? "border-chart-1/60 bg-chart-1/5"
            : "border-border/60 bg-muted/10"
        }`}
      >
        {children}
        {empty && (
          <p className="grid flex-1 place-items-center py-8 text-center text-xs text-muted-foreground">
            {emptyMessage}
          </p>
        )}
      </div>
    </section>
  );
}