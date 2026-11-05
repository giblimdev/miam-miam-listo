/*
path :           app/scrum/components/EpicList.tsx
tag :            ["scrum", "epic", "list", "ui", "dnd"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Liste des epics d'un flux Scrum avec DnD. L'édition
                 se fait désormais sur une page dédiée
                 /scrum/[flow]/epic/[epicId]/edit (bouton Éditer →
                 router.push), comme pour Sprint. Seule la création
                 rapide passe par une modale (EpicForm). État optimiste
                 conservé pour le réordonnancement DnD.

                 ⚠️ ROUTE : la route physique réelle est
                 /scrum/[flow]/epic/[epicId]/edit. Le préfixe `/scrum/`
                 est OBLIGATOIRE.

flow:            flow + epics → useState(optimistic) → useEffect
                 resync → SortableList + SortableItem → handleReorder
                 → Server Action. handleEdit(epic) →
                 router.push(`/scrum/${flow}/epic/${epic.id}/edit`).
                 Création : Dialog + EpicForm → createEpicAction.
                 Suppression : AlertDialog → deleteEpicAction.

ecosystem:       Scrum = [
                   "@/app/scrum/components/EpicCard.tsx",
                   "@/app/scrum/components/EpicForm.tsx",
                   "@/app/scrum/components/EpicList.tsx",
                   "@/app/scrum/components/SortableItem.tsx",
                   "@/app/scrum/components/SortableList.tsx",
                   "@/app/scrum/lib/actions/epic.ts",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/components/EpicCard.tsx",
                  "@/app/scrum/components/EpicForm.tsx",
                  "@/app/scrum/components/SortableItem.tsx",
                  "@/app/scrum/components/SortableList.tsx",
                  "@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/actions/epic.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/actions/epic",
                  "@/app/scrum/components/EpicCard",
                  "@/app/scrum/components/EpicForm",
                  "@/app/scrum/components/SortableItem",
                  "@/app/scrum/components/SortableList",
                  "@/components/ui/button",
                  "@/components/ui/dialog",
                  "@/components/ui/alert-dialog"]

exports:         ["EpicList", "EpicListProps"]

useBy:           ["/app/scrum/[flow]/epic/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux lister et réorganiser les epics Scrum",
                  "*en tant qu'utilisateur je veux éditer un epic sur une page dédiée"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (dialogs + optimiste), useEffect, router.push, DnD, toast.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Plus } from "lucide-react";
import { toast } from "sonner";

import type { Epic, ScrumFlow } from "@/app/scrum/lib/types";
import {
  createEpicAction,
  deleteEpicAction,
  reorderEpicsAction,
} from "@/app/scrum/lib/actions/epic";
import { EpicCard } from "@/app/scrum/components/EpicCard";
import { EpicForm } from "@/app/scrum/components/EpicForm";
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

export interface EpicListProps {
  readonly flow: ScrumFlow;
  readonly epics: readonly Epic[];
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function EpicList({ flow, epics }: EpicListProps) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<readonly Epic[]>(epics);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<Epic | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setOptimistic(epics);
  }, [epics]);

  /* --- Création (modale conservée) --- */
  async function handleCreate(formData: FormData) {
    setPending(true);
    const result = await createEpicAction(flow, formData);
    setPending(false);
    if (result.ok) {
      toast.success("Epic créé.");
      setCreateOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  /* --- Suppression --- */
  async function handleDelete() {
    if (!deleting) return;
    setPending(true);
    const result = await deleteEpicAction(flow, deleting.id);
    setPending(false);
    if (result.ok) {
      toast.success("Epic supprimé.");
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
      .filter((item): item is Epic => item !== undefined);

    setOptimistic(reordered);
    setPending(true);
    const result = await reorderEpicsAction(flow, orderedIds);
    setPending(false);

    if (result.ok) {
      router.refresh();
    } else {
      setOptimistic(previous);
      toast.error(result.error);
    }
  }

  /**
   * ⚠️ ROUTE : la route physique réelle est
   * /scrum/[flow]/epic/[epicId]/edit. Le préfixe `/scrum/` est
   * OBLIGATOIRE — sans lui, l'URL produite est
   * `/scrum-business/epic/.../edit` et renvoie 404.
   */
  function handleEdit(epic: Epic) {
    router.push(`/scrum/${flow}/epic/${epic.id}/edit`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Epics
          </h2>
          <p className="text-sm text-muted-foreground">
            {optimistic.length} epic{optimistic.length > 1 ? "s" : ""}
            {optimistic.length > 1 &&
              " — glissez la poignée pour réordonner"}
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Nouvel epic
        </Button>
      </div>

      {/* État vide */}
      {optimistic.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-chart-4/10 text-chart-4">
            <Layers className="size-6" aria-hidden />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Aucun epic pour l&apos;instant
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Regroupez les features retenues en grands blocs fonctionnels
            cohérents.
          </p>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-2"
          >
            <Plus className="size-4" aria-hidden />
            Créer le premier epic
          </Button>
        </div>
      )}

      {/* Grille DnD */}
      {optimistic.length > 0 && (
        <SortableList
          items={optimistic}
          onReorder={handleReorder}
          disabled={pending}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {optimistic.map((epic) => (
              <SortableItem key={epic.id} id={epic.id} disabled={pending}>
                <EpicCard
                  epic={epic}
                  onEdit={handleEdit}
                  onDelete={setDeleting}
                />
              </SortableItem>
            ))}
          </div>
        </SortableList>
      )}

      {/* Création (modale conservée) */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="flex h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>Nouvel epic</DialogTitle>
            <DialogDescription>
              Décrivez l&apos;epic, son objectif, son périmètre et les
              personas concernés.
            </DialogDescription>
          </DialogHeader>
          <EpicForm onSubmit={handleCreate} pending={pending} />
        </DialogContent>
      </Dialog>

      {/* Suppression */}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet epic ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. L&apos;epic « {deleting?.name} »
              sera retiré du flux {flow}.
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