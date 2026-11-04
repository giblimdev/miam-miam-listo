/*
path :           app/scrum/components/IdeeList.tsx
tag :            ["scrum", "idee", "list", "ui", "dnd", "featured"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Liste des idées d'un flux Scrum avec DnD. État optimiste
                 (useState + useEffect resync) pour un réordonnancement
                 immédiat côté client, rollback + toast en cas d'échec.
                 Gère l'état local (dialog de lecture, création, édition,
                 confirmation de suppression). MODE ÉDITORIAL : si une
                 seule idée existe (cas typique d'un flux fondateur), la
                 carte est rendue en pleine largeur (featured) sans
                 SortableItem — le DnD n'a aucun sens sur 1 élément. Dès
                 qu'il y a ≥ 2 idées, on bascule sur la grille DnD
                 classique (SortableList + SortableItem). Tous les
                 DialogContent utilisent `flex h-[85vh] flex-col` +
                 `overflow-hidden`.

flow:            flow + idees (server) → useState(optimistic) → useEffect
                 resync → isSingle = optimistic.length === 1 → si isSingle :
                 <IdeeCard featured /> sans SortableItem ; sinon :
                 SortableList + SortableItem → handleReorder → Server
                 Action → refresh ou rollback. Lecture : IdeeDetailDialog.
                 Création/édition : Dialog + IdeeForm → Server Action →
                 toast → router.refresh().

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

relatedFiles:    ["@/app/scrum/components/IdeeCard.tsx",
                  "@/app/scrum/components/IdeeDetailDialog.tsx",
                  "@/app/scrum/components/IdeeForm.tsx",
                  "@/app/scrum/components/SortableItem.tsx",
                  "@/app/scrum/components/SortableList.tsx",
                  "@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/actions/idee.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/actions/idee",
                  "@/app/scrum/components/IdeeCard",
                  "@/app/scrum/components/IdeeDetailDialog",
                  "@/app/scrum/components/IdeeForm",
                  "@/app/scrum/components/SortableItem",
                  "@/app/scrum/components/SortableList",
                  "@/components/ui/button",
                  "@/components/ui/dialog",
                  "@/components/ui/alert-dialog"]

exports:         ["IdeeList", "IdeeListProps"]

useBy:           ["@/app/scrum/[flow]/idee/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux lister, lire, réorganiser et gérer les idées Scrum"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (dialogs + optimiste), useEffect, DnD, toast.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Plus } from "lucide-react";
import { toast } from "sonner";

import type { Idee, ScrumFlow } from "@/app/scrum/lib/types";
import {
  createIdeeAction,
  deleteIdeeAction,
  reorderIdeesAction,
  updateIdeeAction,
} from "@/app/scrum/lib/actions/idee";
import { IdeeCard } from "@/app/scrum/components/IdeeCard";
import { IdeeDetailDialog } from "@/app/scrum/components/IdeeDetailDialog";
import { IdeeForm } from "@/app/scrum/components/IdeeForm";
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

export interface IdeeListProps {
  readonly flow: ScrumFlow;
  readonly idees: readonly Idee[];
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function IdeeList({ flow, idees }: IdeeListProps) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<readonly Idee[]>(idees);
  const [reading, setReading] = useState<Idee | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Idee | null>(null);
  const [deleting, setDeleting] = useState<Idee | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setOptimistic(idees);
  }, [idees]);

  /* Mode éditorial : une seule idée = carte fondatrice pleine largeur. */
  const isSingle = optimistic.length === 1;
  const singleIdee = isSingle ? optimistic[0]! : null;

  /* --- Création --- */
  async function handleCreate(formData: FormData) {
    setPending(true);
    const result = await createIdeeAction(flow, formData);
    setPending(false);

    if (result.ok) {
      toast.success("Idée créée.");
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
    const result = await updateIdeeAction(flow, editing.id, formData);
    setPending(false);

    if (result.ok) {
      toast.success("Idée mise à jour.");
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
    const result = await deleteIdeeAction(flow, deleting.id);
    setPending(false);

    if (result.ok) {
      toast.success("Idée supprimée.");
      setDeleting(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  /* --- Réordonnancement (DnD) --- */
  async function handleReorder(orderedIds: string[]) {
    const previous = optimistic;
    const reordered = orderedIds
      .map((id) => previous.find((item) => item.id === id))
      .filter((item): item is Idee => item !== undefined);

    setOptimistic(reordered);
    setPending(true);
    const result = await reorderIdeesAction(flow, orderedIds);
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
      {/* En-tête de liste */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Idées
          </h2>
          <p className="text-sm text-muted-foreground">
            {isSingle
              ? "Idée fondatrice"
              : `${optimistic.length} idée${optimistic.length > 1 ? "s" : ""}`}
            {!isSingle &&
              optimistic.length > 1 &&
              " — glissez la poignée pour réordonner"}
          </p>
        </div>

        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Nouvelle idée
        </Button>
      </div>

      {/* État vide */}
      {optimistic.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-chart-1/10 text-chart-1">
            <Lightbulb className="size-6" aria-hidden />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Aucune idée pour l&apos;instant
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Commencez par formuler un problème à résoudre. C&apos;est la
            première étape du flux Scrum.
          </p>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-2"
          >
            <Plus className="size-4" aria-hidden />
            Créer la première idée
          </Button>
        </div>
      )}

      {/* Mode éditorial : une seule idée → carte fondatrice pleine largeur */}
      {isSingle && singleIdee && (
        <IdeeCard
          idee={singleIdee}
          onRead={setReading}
          onEdit={setEditing}
          onDelete={setDeleting}
          featured
        />
      )}

      {/* Mode liste : ≥ 2 idées → grille DnD */}
      {!isSingle && optimistic.length > 0 && (
        <SortableList
          items={optimistic}
          onReorder={handleReorder}
          disabled={pending}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {optimistic.map((idee) => (
              <SortableItem key={idee.id} id={idee.id} disabled={pending}>
                <IdeeCard
                  idee={idee}
                  onRead={setReading}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                />
              </SortableItem>
            ))}
          </div>
        </SortableList>
      )}

      {/* Lecture */}
      <IdeeDetailDialog
        idee={reading}
        open={reading !== null}
        onOpenChange={(open) => !open && setReading(null)}
      />

      {/* Création — h-[85vh] définie + flex-col */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="flex h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>Nouvelle idée</DialogTitle>
            <DialogDescription>
              Formulez le problème à résoudre, pas la solution.
            </DialogDescription>
          </DialogHeader>
          <IdeeForm onSubmit={handleCreate} pending={pending} />
        </DialogContent>
      </Dialog>

      {/* Édition — même pattern */}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="flex h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>Éditer l&apos;idée</DialogTitle>
            <DialogDescription>
              Mettez à jour le problème, les hypothèses ou le contexte.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <IdeeForm
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
            <AlertDialogTitle>Supprimer cette idée ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. L&apos;idée « {deleting?.title} »
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