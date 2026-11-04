/*
path :           app/scrum/components/UserStoryList.tsx
tag :            ["scrum", "user-story", "list", "ui", "dnd"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Liste des user stories d'un flux Scrum avec DnD. Résout
                 epicId → epic.name via Map, transmet à UserStoryCard.
                 État optimiste. DialogContent :
                 `flex h-[85vh] flex-col overflow-hidden` + `sm:max-w-2xl`.
                 Passe epics aux 2 <UserStoryForm> (création + édition)
                 pour que le champ epicId soit un NativeSelect avec option
                 vide « Aucun epic (backlog) ».

flow:            flow + stories + epics → Map<epicId, epicName> →
                 useState(optimistic) → useEffect resync → SortableList +
                 SortableItem → handleReorder → Server Action → refresh ou
                 rollback. Form création/édition : <UserStoryForm
                 epics={epics} ... />.

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
                   "@/app/scrum/lib/actions/_helpers.ts",
                   "@/app/scrum/lib/actions/epic.ts",
                   "@/app/scrum/lib/actions/feature.ts",
                   "@/app/scrum/lib/actions/global-json.ts",
                   "@/app/scrum/lib/actions/idee.ts",
                   "@/app/scrum/lib/actions/persona.ts",
                   "@/app/scrum/lib/actions/sprint.ts",
                   "@/app/scrum/lib/actions/task.ts",
                   "@/app/scrum/lib/actions/user-story.ts",
                   "@/app/scrum/lib/services/_crud.ts",
                   "@/app/scrum/lib/services/epic.ts",
                   "@/app/scrum/lib/services/feature.ts",
                   "@/app/scrum/lib/services/global-json.ts",
                   "@/app/scrum/lib/services/idee.ts",
                   "@/app/scrum/lib/services/persona.ts",
                   "@/app/scrum/lib/services/sprint.ts",
                   "@/app/scrum/lib/services/task.ts",
                   "@/app/scrum/lib/services/user-story.ts",
                   "@/app/scrum/lib/storage.ts",
                   "@/app/scrum/lib/types.ts",
                   "@/app/scrum/lib/validations.ts",
                 ]

relatedFiles:    ["@/app/scrum/components/UserStoryCard.tsx",
                  "@/app/scrum/components/UserStoryForm.tsx",
                  "@/app/scrum/components/SortableItem.tsx",
                  "@/app/scrum/components/SortableList.tsx",
                  "@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/actions/user-story.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/actions/user-story",
                  "@/app/scrum/components/UserStoryCard",
                  "@/app/scrum/components/UserStoryForm",
                  "@/app/scrum/components/SortableItem",
                  "@/app/scrum/components/SortableList",
                  "@/components/ui/button",
                  "@/components/ui/dialog",
                  "@/components/ui/alert-dialog"]

exports:         ["UserStoryList", "UserStoryListProps"]

useBy:           ["@/app/scrum/[flow]/user-story/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux lister et réorganiser les user stories Scrum"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (dialogs + optimiste), useEffect, DnD, toast.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks, Plus } from "lucide-react";
import { toast } from "sonner";

import type { Epic, ScrumFlow, UserStory } from "@/app/scrum/lib/types";
import {
  createUserStoryAction,
  deleteUserStoryAction,
  reorderUserStoriesAction,
  updateUserStoryAction,
} from "@/app/scrum/lib/actions/user-story";
import { UserStoryCard } from "@/app/scrum/components/UserStoryCard";
import { UserStoryForm } from "@/app/scrum/components/UserStoryForm";
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

export interface UserStoryListProps {
  readonly flow: ScrumFlow;
  readonly stories: readonly UserStory[];
  readonly epics: readonly Epic[];
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function UserStoryList({ flow, stories, epics }: UserStoryListProps) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<readonly UserStory[]>(stories);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserStory | null>(null);
  const [deleting, setDeleting] = useState<UserStory | null>(null);
  const [pending, setPending] = useState(false);

  const epicNames = new Map<string, string>(
    epics.map((epic) => [epic.id, epic.name]),
  );

  useEffect(() => {
    setOptimistic(stories);
  }, [stories]);

  /* --- Création --- */
  async function handleCreate(formData: FormData) {
    setPending(true);
    const result = await createUserStoryAction(flow, formData);
    setPending(false);
    if (result.ok) {
      toast.success("User story créée.");
      setCreateOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  /* --- Édition --- */
  async function handleUpdate(formData: FormData) {
    if (!editing) return;
    setPending(true);
    const result = await updateUserStoryAction(flow, editing.id, formData);
    setPending(false);
    if (result.ok) {
      toast.success("User story mise à jour.");
      setEditing(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  /* --- Suppression --- */
  async function handleDelete() {
    if (!deleting) return;
    setPending(true);
    const result = await deleteUserStoryAction(flow, deleting.id);
    setPending(false);
    if (result.ok) {
      toast.success("User story supprimée.");
      setDeleting(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  /* --- Réordonnancement --- */
  async function handleReorder(orderedIds: string[]) {
    const previous = optimistic;
    const reordered = orderedIds
      .map((id) => previous.find((item) => item.id === id))
      .filter((item): item is UserStory => item !== undefined);

    setOptimistic(reordered);
    setPending(true);
    const result = await reorderUserStoriesAction(flow, orderedIds);
    setPending(false);

    if (result.ok) {
      router.refresh();
    } else {
      setOptimistic(previous);
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            User stories
          </h2>
          <p className="text-sm text-muted-foreground">
            {optimistic.length} user stor
            {optimistic.length > 1 ? "ies" : "y"}
            {optimistic.length > 1 && " — glissez la poignée pour réordonner"}
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Nouvelle user story
        </Button>
      </div>

      {optimistic.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-chart-5/10 text-chart-5">
            <ListChecks className="size-6" aria-hidden />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Aucune user story pour l&apos;instant
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Découpez les epics en incréments développables et testables.
          </p>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-2"
          >
            <Plus className="size-4" aria-hidden />
            Créer la première user story
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
            {optimistic.map((story) => (
              <SortableItem key={story.id} id={story.id} disabled={pending}>
                <UserStoryCard
                  story={story}
                  epicName={
                    story.epicId ? epicNames.get(story.epicId) : undefined
                  }
                  onEdit={setEditing}
                  onDelete={setDeleting}
                />
              </SortableItem>
            ))}
          </div>
        </SortableList>
      )}

      {/* Création — epics passé à UserStoryForm pour le NativeSelect */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="flex h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>Nouvelle user story</DialogTitle>
            <DialogDescription>
              Rédigez le récit, les critères d&apos;acceptation et
              l&apos;estimation.
            </DialogDescription>
          </DialogHeader>
          <UserStoryForm
            epics={epics}
            onSubmit={handleCreate}
            pending={pending}
          />
        </DialogContent>
      </Dialog>

      {/* Édition — epics passé à UserStoryForm pour le NativeSelect */}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="flex h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>Éditer la user story</DialogTitle>
            <DialogDescription>
              Mettez à jour le récit, les critères ou l&apos;estimation.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <UserStoryForm
              epics={epics}
              defaultValues={editing}
              onSubmit={handleUpdate}
              pending={pending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Suppression */}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette user story ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. La user story « {deleting?.title} »
              sera retirée du flux {flow}.
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