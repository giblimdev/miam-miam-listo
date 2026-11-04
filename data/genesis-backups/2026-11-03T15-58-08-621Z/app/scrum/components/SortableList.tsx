/*
path :           app/core/components/SortableList.tsx
tag :            ["scrum", "dnd", "sortable", "ui", "generic"]
projectId:       new-genesis
type:            component
generic:         true

role:            Contexte DnD générique pour une grille de cartes Scrum.
                 Fournit les capteurs (Pointer + Keyboard), la détection de
                 collision (closestCenter) et la stratégie de tri (grille).
                 Délègue le réordonnancement au parent via onReorder(ids).

flow:            Reçoit items (objets avec id) + onReorder + children →
                 DndContext + SortableContext → handleDragEnd calcule les
                 nouveaux index via arrayMove → onReorder(newIds).
                 KeyboardSensor + sortableKeyboardCoordinates pour
                 l'accessibilité clavier (Tab → Space → flèches → Space).

ecosystem:       ScrumDnD = [
                   "@/app/core/components/scrum/SortableItem.tsx",
                   "@/app/core/components/scrum/SortableList.tsx",
                 ]

relatedFiles:    ["@/app/core/components/scrum/SortableItem.tsx"]

imports:         ["@dnd-kit/core", "@dnd-kit/sortable"]

exports:         ["SortableList", "SortableListProps"]

useBy:           ["@/app/core/components/scrum/IdeeList.tsx",
                  "@/app/core/components/scrum/EpicList.tsx",
                  "@/app/core/components/scrum/FeatureList.tsx",
                  "@/app/core/components/scrum/PersonaList.tsx",
                  "@/app/core/components/scrum/SprintList.tsx",
                  "@/app/core/components/scrum/UserStoryList.tsx"]

userStories:     ["*en tant qu'utilisateur je veux réorganiser les cartes par glisser-déposer"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : DndContext + capteurs (interaction DnD côté client).

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface SortableListProps {
  readonly items: readonly { readonly id: string }[];
  readonly onReorder: (orderedIds: string[]) => void;
  readonly disabled?: boolean;
  readonly children: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function SortableList({
  items,
  onReorder,
  disabled = false,
  children,
}: SortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove([...items], oldIndex, newIndex);
    onReorder(reordered.map((item) => item.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={rectSortingStrategy}
        disabled={disabled}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
}
