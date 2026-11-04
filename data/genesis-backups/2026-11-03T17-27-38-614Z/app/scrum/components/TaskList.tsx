/*
path :           app/scrum/components/TaskList.tsx
tag :            ["scrum", "task", "list", "ui", "dnd"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Liste des tasks d'un flux Scrum avec DnD. Résout
                 storyId → storyTitle via Map pour l'affichage sur
                 chaque TaskCard. État optimiste. Si aucune UserStory
                 n'existe, le bouton "Nouvelle task" est désactivé et
                 un bandeau d'aide est affiché (lien vers la page
                 User story du flux). DialogContent :
                 `flex h-[85vh] flex-col overflow-hidden` + `sm:max-w-2xl`.

flow:            flow + tasks + stories → Map<storyId, storyTitle> →
                 useState(optimistic) → useEffect resync → SortableList +
                 SortableItem → handleReorder → Server Action → refresh
                 ou rollback.

ecosystem:       Scrum = [
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
                   "@/app/scrum/components/TaskCard.tsx",
                   "@/app/scrum/components/TaskForm.tsx",
                   "@/app/scrum/components/TaskList.tsx",
                   "@/app/scrum/components/UserStoryCard.tsx",
                   "@/app/scrum/components/UserStoryForm.tsx",
                   "@/app/scrum/components/UserStoryList.tsx",
                   "@/app/scrum/components/UserStoryMiniCard.tsx",
                 ]

relatedFiles:    ["@/app/scrum/components/TaskCard.tsx",
                  "@/app/scrum/components/TaskForm.tsx",
                  "@/app/scrum/components/SortableItem.tsx",
                  "@/app/scrum/components/SortableList.tsx",
                  "@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/actions/task.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/actions/task",
                  "@/app/scrum/components/TaskCard",
                  "@/app/scrum/components/TaskForm",
                  "@/app/scrum/components/SortableItem",
                  "@/app/scrum/components/SortableList",
                  "@/components/ui/button",
                  "@/components/ui/dialog",
                  "@/components/ui/alert-dialog"]

exports:         ["TaskList", "TaskListProps"]

useBy:           ["@/app/scrum/[flow]/task/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux lister et réorganiser les tasks Scrum"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (dialogs + optimiste), useEffect, DnD, toast.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ListTodo, Plus, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import type {
  ScrumFlow,
  Task,
  UserStory,
} from "@/app/scrum/lib/types";
import {
  createTaskAction,
  deleteTaskAction,
  reorderTasksAction,
  updateTaskAction,
} from "@/app/scrum/lib/actions/task";
import { TaskCard } from "@/app/scrum/components/TaskCard";
import { TaskForm } from "@/app/scrum/components/TaskForm";
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

export interface TaskListProps {
  readonly flow: ScrumFlow;
  readonly tasks: readonly Task[];
  readonly stories: readonly UserStory[];
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function TaskList({ flow, tasks, stories }: TaskListProps) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<readonly Task[]>(tasks);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [pending, setPending] = useState(false);

  const noStories = stories.length === 0;

  const storyTitleById = new Map<string, string>(
    stories.map((story) => [story.id, story.title]),
  );

  useEffect(() => {
    setOptimistic(tasks);
  }, [tasks]);

  /* --- Création --- */
  async function handleCreate(formData: FormData) {
    setPending(true);
    const result = await createTaskAction(flow, formData);
    setPending(false);
    if (result.ok) {
      toast.success("Task créée.");
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
    const result = await updateTaskAction(flow, editing.id, formData);
    setPending(false);
    if (result.ok) {
      toast.success("Task mise à jour.");
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
    const result = await deleteTaskAction(flow, deleting.id);
    setPending(false);
    if (result.ok) {
      toast.success("Task supprimée.");
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
      .filter((item): item is Task => item !== undefined);

    setOptimistic(reordered);
    setPending(true);
    const result = await reorderTasksAction(flow, orderedIds);
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
      {/* Bandeau d'aide si aucune UserStory */}
      {noStories && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-chart-3/40 bg-chart-3/5 p-3 text-sm text-foreground/80"
        >
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-chart-3"
            aria-hidden
          />
          <p>
            Aucune User Story pour l&apos;instant. Créez au moins une User Story
            dans la section{" "}
            {/* ✅ Route physique réelle : /scrum/${flow}/user-story */}
            <a
              href={`/scrum/${flow}/user-story`}
              className="font-semibold text-chart-3 underline underline-offset-3 hover:text-chart-3/80"
            >
              User story
            </a>{" "}
            avant d&apos;ajouter des Tasks.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Tasks
          </h2>
          <p className="text-sm text-muted-foreground">
            {optimistic.length} task{optimistic.length > 1 ? "s" : ""}
            {optimistic.length > 1 &&
              " — glissez la poignée pour réordonner"}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={noStories}
          title={
            noStories
              ? "Créez d'abord une User Story"
              : "Créer une nouvelle task"
          }
        >
          <Plus className="size-4" aria-hidden />
          Nouvelle task
        </Button>
      </div>

      {optimistic.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-chart-2/10 text-chart-2">
            <ListTodo className="size-6" aria-hidden />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Aucune task pour l&apos;instant
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Découpez chaque User Story en unités de travail &lt; 1 jour pour
            piloter l&apos;exécution du sprint.
          </p>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            disabled={noStories}
            className="mt-2"
          >
            <Plus className="size-4" aria-hidden />
            Créer la première task
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
            {optimistic.map((task) => (
              <SortableItem key={task.id} id={task.id} disabled={pending}>
                <TaskCard
                  task={task}
                  storyTitle={storyTitleById.get(task.storyId)}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                />
              </SortableItem>
            ))}
          </div>
        </SortableList>
      )}

      {/* Création */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="flex h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>Nouvelle task</DialogTitle>
            <DialogDescription>
              Décrivez la task et rattachez-la à une User Story.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            stories={stories}
            onSubmit={handleCreate}
            pending={pending}
          />
        </DialogContent>
      </Dialog>

      {/* Édition */}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="flex h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>Éditer la task</DialogTitle>
            <DialogDescription>
              Mettez à jour le statut, l&apos;assignation ou l&apos;estimation.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <TaskForm
              stories={stories}
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
            <AlertDialogTitle>Supprimer cette task ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. La task « {deleting?.title} » sera
              retirée du flux {flow}.
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