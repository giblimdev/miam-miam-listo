/*
path :           app/scrum/components/SortableList.tsx
tag :            ["scrum", "dnd", "sortable", "ui", "generic", "hydration"]
projectId:       new-genesis
type:            component
generic:         true

role:            Contexte DnD générique pour une grille de cartes Scrum.
                 Fournit les capteurs (Pointer + Keyboard), la détection de
                 collision (closestCenter) et la stratégie de tri (grille).
                 Délègue le réordonnancement au parent via onReorder(ids).

                 ⚠️ CORRECTIF HYDRATATION : un `id` stable produit par
                 `useId()` est passé à <DndContext>. Sans cet id, dnd-kit
                 génère un identifiant via un compteur global
                 (`DndDescribedBy-N`), qui diverge entre le serveur et le
                 client → React lève « tree hydrated but some attributes
                 of the server rendered HTML didn't match the client ».
                 `useId()` garantit la même valeur SSR/client (même
                 position dans l'arbre React, même id).

flow:            Reçoit items (objets avec id) + onReorder + children →
                 useId() → dndId stable → DndContext(id=dndId) +
                 SortableContext → handleDragEnd calcule les nouveaux
                 index via arrayMove → onReorder(newIds).
                 KeyboardSensor + sortableKeyboardCoordinates pour
                 l'accessibilité clavier (Tab → Space → flèches → Space).

ecosystem:       ScrumDnD = [
                   "@/app/scrum/components/SortableItem.tsx",
                   "@/app/scrum/components/SortableList.tsx",
                 ]

relatedFiles:    ["@/app/scrum/components/SortableItem.tsx"]

imports:         ["react", "@dnd-kit/core", "@dnd-kit/sortable"]

exports:         ["SortableList", "SortableListProps"]

useBy:           ["@/app/scrum/components/EpicList.tsx",
                  "@/app/scrum/components/FeatureList.tsx",
                  "@/app/scrum/components/IdeeList.tsx",
                  "@/app/scrum/components/PersonaList.tsx",
                  "@/app/scrum/components/SprintList.tsx",
                  "@/app/scrum/components/UserStoryList.tsx"]

userStories:     ["*en tant qu'utilisateur je veux réorganiser les cartes par glisser-déposer"]
status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : DndContext + capteurs (interaction DnD côté client).

import { useId } from "react";
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
  /* Id stable SSR/client : évite le mismatch d'hydratation sur
     `aria-describedby` injecté par dnd-kit dans chaque poignée. */
  const dndId = useId();

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
      id={dndId}
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