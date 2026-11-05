/*
path :           app/core/components/UserStoryMiniCard.tsx
tag :            ["scrum", "user-story", "mini", "card", "dnd", "ui"]
projectId:       new-genesis
type:            component
generic:         false

role:            Carte compacte d'une user story pour le board DnD de
                 SprintEditor. Affiche titre, nom d'épic (si résolu),
                 estimation. La poignée de drag est intégrée à gauche de la
                 carte (le listener est attaché à la poignée uniquement).
                 Utilise useSortable pour être droppable.

flow:            Reçoit story + epicName → useSortable({ id }) → wrapper
                 div + poignée gauche + contenu. Consommé dans
                 SprintStoriesBoard.

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
                   "@/app/core/components/scrum/SortableItem.tsx",
                   "@/app/core/components/scrum/SortableList.tsx",
                   "@/app/core/components/scrum/SprintCard.tsx",
                   "@/app/core/components/scrum/SprintEditor.tsx",
                   "@/app/core/components/scrum/SprintForm.tsx",
                   "@/app/core/components/scrum/SprintList.tsx",
                   "@/app/core/components/scrum/SprintStoriesBoard.tsx",
                   "@/app/core/components/scrum/UserStoryCard.tsx",
                   "@/app/core/components/scrum/UserStoryForm.tsx",
                   "@/app/core/components/scrum/UserStoryList.tsx",
                   "@/app/core/components/scrum/UserStoryMiniCard.tsx",
                 ]

relatedFiles:    ["@/app/core/lib/scrum/types.ts",
                  "@/app/core/components/scrum/SprintStoriesBoard.tsx"]

imports:         ["@dnd-kit/sortable", "@dnd-kit/utilities",
                  "lucide-react",
                  "@/app/core/lib/scrum/types"]

exports:         ["UserStoryMiniCard", "UserStoryMiniCardProps"]

useBy:           ["@/app/core/components/scrum/SprintStoriesBoard.tsx"]

userStories:     ["*en tant qu'utilisateur je veux glisser une US entre backlog et sprint"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useSortable (interaction DnD côté client).

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import type { UserStory } from "@/app/scrum/lib/types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface UserStoryMiniCardProps {
  readonly story: UserStory;
  readonly epicName?: string;
  readonly disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function UserStoryMiniCard({
  story,
  epicName,
  disabled = false,
}: UserStoryMiniCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: story.id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 20 : undefined,
      }}
      className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-2 shadow-sm"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label="Glisser la user story"
        className="grid size-7 shrink-0 cursor-grab place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium text-foreground"
          title={story.title}
        >
          {story.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          {epicName && (
            <span className="truncate" title={epicName}>
              {epicName}
            </span>
          )}
          {story.estimate && (
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 font-medium">
              {story.estimate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
