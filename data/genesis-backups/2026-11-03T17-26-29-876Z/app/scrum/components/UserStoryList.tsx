/*
path :           app/core/components/UserStoryList.tsx
tag :            ["scrum", "user-story", "list", "ui", "dnd"]
projectId:       new-genesis
type:            component
generic:         false

role:            Liste des user stories d'un flux Scrum avec DnD. Résout
                 epicId → epic.name via Map, transmet à UserStoryCard.
                 État optimiste. DialogContent :
                 `flex h-[85vh] flex-col overflow-hidden` + `sm:max-w-2xl`.

flow:            flow + stories + epics → Map<epicId, epicName> →
                 useState(optimistic) → useEffect resync → SortableList +
                 SortableItem → handleReorder → Server Action → refresh ou
                 rollback.

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
                   "@/app/core/components/scrum/UserStoryCard.tsx",
                   "@/app/core/components/scrum/UserStoryForm.tsx",
                   "@/app/core/components/scrum/UserStoryList.tsx",
                 ]

relatedFiles:    ["@/app/core/components/scrum/UserStoryCard.tsx",
                  "@/app/core/components/scrum/UserStoryForm.tsx",
                  "@/app/core/components/scrum/SortableItem.tsx",
                  "@/app/core/components/scrum/SortableList.tsx",
                  "@/app/core/lib/scrum/types.ts",
                  "@/app/core/lib/scrum/actions/user-story.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/core/lib/scrum/types",
                  "@/app/core/lib/scrum/actions/user-story",
                  "@/app/core/components/scrum/UserStoryCard",
                  "@/app/core/components/scrum/UserStoryForm",
                  "@/app/core/components/scrum/SortableItem",
                  "@/app/core/components/scrum/SortableList",
                  "@/components/ui/button",
                  "@/components/ui/dialog",
                  "@/components/ui/alert-dialog"]

exports:         ["UserStoryList", "UserStoryListProps"]

useBy:           ["@/app/core/[flow]/user-story/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux lister et réorganiser les user stories Scrum"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
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

export interface UserStoryListProps {
  readonly flow: ScrumFlow;
  readonly stories: readonly UserStory[];
  readonly epics: readonly Epic[];
}

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
            {optimistic.length} user stor{optimistic.length > 1 ? "ies" : "y"}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="flex h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>Nouvelle user story</DialogTitle>
            <DialogDescription>
              Rédigez le récit, les critères d&apos;acceptation et
              l&apos;estimation.
            </DialogDescription>
          </DialogHeader>
          <UserStoryForm onSubmit={handleCreate} pending={pending} />
        </DialogContent>
      </Dialog>

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
              defaultValues={editing}
              onSubmit={handleUpdate}
              pending={pending}
            />
          )}
        </DialogContent>
      </Dialog>

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
