/*
path :           app/scrum/components/EpicList.tsx
tag :            ["scrum", "epic", "list", "ui"]
projectId:       new-genesis
type :           component
generic:         false

role:            Liste des epics d'un flux Scrum. Gère l'état local (dialogs)
                 et délègue les mutations aux Server Actions. Les DialogContent
                 utilisent `flex h-[85vh] flex-col overflow-hidden` +
                 `sm:max-w-2xl`.

flow:            Reçoit flow + epics (server) → useState → EpicForm dans
                 Dialog → submit → Server Action → toast → router.refresh().

ecosystem:       ScrumUI = [
                   "@/app/scrum/components/EpicCard.tsx",
                   "@/app/scrum/components/EpicForm.tsx",
                   "@/app/scrum/components/EpicList.tsx",
                   "@/app/scrum/components/FeatureCard.tsx",
                   "@/app/scrum/components/FeatureForm.tsx",
                   "@/app/scrum/components/FeatureList.tsx",
                   "@/app/scrum/components/FlowSelector.tsx",
                   "@/app/scrum/components/GlobalJsonExport.tsx",
                   "@/app/scrum/components/IdeeCard.tsx",
                   "@/app/scrum/components/IdeeForm.tsx",
                   "@/app/scrum/components/IdeeList.tsx",
                   "@/app/scrum/components/PersonaCard.tsx",
                   "@/app/scrum/components/PersonaForm.tsx",
                   "@/app/scrum/components/PersonaList.tsx",
                   "@/app/scrum/components/ScrumNav.tsx",
                   "@/app/scrum/components/SprintCard.tsx",
                   "@/app/scrum/components/SprintForm.tsx",
                   "@/app/scrum/components/SprintList.tsx",
                   "@/app/scrum/components/UserStoryCard.tsx",
                   "@/app/scrum/components/UserStoryForm.tsx",
                   "@/app/scrum/components/UserStoryList.tsx",
                 ]

relatedFiles:    ["@/app/scrum/components/EpicCard.tsx",
                  "@/app/scrum/components/EpicForm.tsx",
                  "@/app/core/lib/scrum/types.ts",
                  "@/app/core/lib/scrum/actions/epic.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/lib/scrum/types",
                  "@/app/lib/scrum/actions/epic",
                  "@/app/components/scrum/EpicCard",
                  "@/app/components/scrum/EpicForm",
                  "@/components/ui/button",
                  "@/components/ui/dialog",
                  "@/components/ui/alert-dialog"]

exports:         ["EpicList", "EpicListProps"]

useBy:           ["@/app/[flow]/epic/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux lister et gérer les epics Scrum"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState (dialogs), router.refresh, toast.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Plus } from "lucide-react";
import { toast } from "sonner";

import type { Epic, ScrumFlow } from "@/app/scrum/lib/types";
import {
  createEpicAction,
  deleteEpicAction,
  updateEpicAction,
} from "@/app/scrum/lib/actions/epic";
import { EpicCard } from "@/app/scrum/components/EpicCard";
import { EpicForm } from "@/app/scrum/components/EpicForm";
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

export interface EpicListProps {
  readonly flow: ScrumFlow;
  readonly epics: readonly Epic[];
}

export function EpicList({ flow, epics }: EpicListProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Epic | null>(null);
  const [deleting, setDeleting] = useState<Epic | null>(null);
  const [pending, setPending] = useState(false);

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

  async function handleUpdate(formData: FormData) {
    if (!editing) return;
    setPending(true);
    const result = await updateEpicAction(flow, editing.id, formData);
    setPending(false);
    if (result.ok) {
      toast.success("Epic mis à jour.");
      setEditing(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Epics
          </h2>
          <p className="text-sm text-muted-foreground">
            {epics.length} epic{epics.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Nouvel epic
        </Button>
      </div>

      {epics.length === 0 && (
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

      {epics.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {epics.map((epic) => (
            <EpicCard
              key={epic.id}
              epic={epic}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="flex h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>Nouvel epic</DialogTitle>
            <DialogDescription>
              Décrivez l&apos;epic, son objectif, son périmètre et les personas
              concernés.
            </DialogDescription>
          </DialogHeader>
          <EpicForm onSubmit={handleCreate} pending={pending} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="flex h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>Éditer l&apos;epic</DialogTitle>
            <DialogDescription>
              Mettez à jour l&apos;objectif, le périmètre ou les personas.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <EpicForm
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
            <AlertDialogTitle>Supprimer cet epic ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. L&apos;epic « {deleting?.name} » sera
              retiré du flux {flow}.
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
