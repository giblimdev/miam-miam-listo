/*
path :           app/core/componentsSprintList.tsx
tag :            ["scrum", "sprint", "list", "ui", "dnd"]
projectId:       new-genesis
type:            component
generic:         false

role:            Liste des sprints d'un flux Scrum avec DnD. Depuis la
                 refonte Sprint, l'édition se fait sur une page dédiée
                 /core/[flow]/sprint/[sprintId]/edit (bouton Éditer →
                 router.push). La modale d'édition a été supprimée car
                 inadaptée au DnD cross-container. Seule la création rapide
                 passe par une modale (SprintForm).

flow:            flow + sprints + userStories → Map<storyId, UserStory> →
                 useState(optimistic) → useEffect resync → SortableList +
                 SortableItem → handleReorder → Server Action.
                 handleEdit(sprint) → router.push(`/core/${flow}/sprint/${sprint.id}/edit`).

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

relatedFiles:    ["@/app/core/components/scrum/SprintCard.tsx",
                  "@/app/core/components/scrum/SprintForm.tsx",
                  "@/app/core/components/scrum/SortableItem.tsx",
                  "@/app/core/components/scrum/SortableList.tsx",
                  "@/app/core/lib/scrum/types.ts",
                  "@/app/core/lib/scrum/actions/sprint.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/core/lib/scrum/types",
                  "@/app/core/lib/scrum/actions/sprint",
                  "@/app/core/components/scrum/SprintCard",
                  "@/app/core/components/scrum/SprintForm",
                  "@/app/core/components/scrum/SortableItem",
                  "@/app/core/components/scrum/SortableList",
                  "@/components/ui/button",
                  "@/components/ui/dialog",
                  "@/components/ui/alert-dialog"]

exports:         ["SprintList", "SprintListProps"]

useBy:           ["@/app/core/[flow]/sprint/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux lister, réorganiser et gérer les sprints Scrum"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState (dialogs + optimiste), useEffect, router.push, DnD, toast.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Rocket } from "lucide-react";
import { toast } from "sonner";

import type { ScrumFlow, Sprint, UserStory } from "@/app/scrum/lib/types";
import {
  createSprintAction,
  deleteSprintAction,
  reorderSprintsAction,
} from "@/app/scrum/lib/actions/sprint";
import { SprintCard } from "@/app/scrum/components/SprintCard";
import { SprintForm } from "@/app/scrum/components/SprintForm";
import { SortableItem } from "@/app/scrum/components/SortableItem";
import { SortableList } from "@/app/scrum/components/SortableList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface SprintListProps {
  readonly flow: ScrumFlow;
  readonly sprints: readonly Sprint[];
  readonly userStories: readonly UserStory[];
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function SprintList({ flow, sprints, userStories }: SprintListProps) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<readonly Sprint[]>(sprints);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<Sprint | null>(null);
  const [pending, setPending] = useState(false);

  const storyById = new Map<string, UserStory>(
    userStories.map((story) => [story.id, story]),
  );

  useEffect(() => {
    setOptimistic(sprints);
  }, [sprints]);

  async function handleCreate(formData: FormData) {
    setPending(true);
    const result = await createSprintAction(flow, formData);
    setPending(false);
    if (result.ok) {
      toast.success("Sprint créé.");
      setCreateOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setPending(true);
    const result = await deleteSprintAction(flow, deleting.id);
    setPending(false);
    if (result.ok) {
      toast.success("Sprint supprimé.");
      setDeleting(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleReorder(orderedIds: string[]) {
    const previous = optimistic;
    const reordered = orderedIds
      .map((id) => previous.find((item) => item.id === id))
      .filter((item): item is Sprint => item !== undefined);

    setOptimistic(reordered);
    setPending(true);
    const result = await reorderSprintsAction(flow, orderedIds);
    setPending(false);

    if (result.ok) {
      router.refresh();
    } else {
      setOptimistic(previous);
      toast.error(result.error);
    }
  }

  function handleEdit(sprint: Sprint) {
    router.push(`/${flow}/sprint/${sprint.id}/edit`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Sprints
          </h2>
          <p className="text-sm text-muted-foreground">
            {optimistic.length} sprint{optimistic.length > 1 ? "s" : ""}
            {optimistic.length > 1 && " — glissez la poignée pour réordonner"}
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Nouveau sprint
        </Button>
      </div>

      {optimistic.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-chart-1/10 text-chart-1">
            <Rocket className="size-6" aria-hidden />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Aucun sprint pour l&apos;instant
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Décidez quoi faire, quand et pourquoi. Définissez votre premier
            incrément.
          </p>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-2"
          >
            <Plus className="size-4" aria-hidden />
            Créer le premier sprint
          </Button>
        </div>
      )}

      {optimistic.length > 0 && (
        <SortableList
          items={optimistic}
          onReorder={handleReorder}
          disabled={pending}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {optimistic.map((sprint) => {
              const resolvedStories = sprint.storyIds
                .map((id) => storyById.get(id))
                .filter((s): s is UserStory => s !== undefined);
              return (
                <SortableItem key={sprint.id} id={sprint.id} disabled={pending}>
                  <SprintCard
                    sprint={sprint}
                    stories={resolvedStories}
                    onEdit={handleEdit}
                    onDelete={setDeleting}
                  />
                </SortableItem>
              );
            })}
          </div>
        </SortableList>
      )}

      {/* Modale de CRÉATION uniquement (meta only, sans storyIds) */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="flex h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>Nouveau sprint</DialogTitle>
            <DialogDescription>
              Décrivez l&apos;objectif du sprint. Les user stories seront
              ajoutées après création, via la page d&apos;édition.
            </DialogDescription>
          </DialogHeader>
          <SprintForm onSubmit={handleCreate} pending={pending} />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce sprint ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. Le sprint « {deleting?.name} » sera
              retiré du flux {flow}. Les user stories qui y étaient rattachées
              retourneront au backlog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
