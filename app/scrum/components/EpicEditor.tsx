/*
path :           app/scrum/components/EpicEditor.tsx
tag :            ["scrum", "epic", "editor", "ui"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Orchestrateur de la page d'édition d'un epic. Réutilise
                 <EpicForm> (même formulaire que la modale de création)
                 et délègue la mutation à updateEpicAction. Affiche un
                 header avec bouton Retour, le formulaire pré-rempli,
                 et un footer sticky avec Annuler / Enregistrer.
                 Pattern identique à SprintEditor : la page dédiée
                 remplace la modale.

flow:            Reçoit flow + epic → state pending → handleSubmit →
                 FormData → updateEpicAction(flow, epic.id, formData) →
                 toast + router.push(`/scrum/${flow}/epic`) +
                 router.refresh(). Annuler → router.push retour liste.

ecosystem:       Scrum = [
                   "@/app/scrum/components/EpicEditor.tsx",
                   "@/app/scrum/components/EpicForm.tsx",
                   "@/app/scrum/lib/actions/epic.ts",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/components/EpicForm.tsx",
                  "@/app/scrum/lib/actions/epic.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/actions/epic",
                  "@/app/scrum/components/EpicForm",
                  "@/components/ui/button"]

exports:         ["EpicEditor", "EpicEditorProps"]

useBy:           ["/app/scrum/[flow]/epic/[epicId]/edit/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux éditer un epic sur une page dédiée"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, router.push, toast.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { Epic, ScrumFlow } from "@/app/scrum/lib/types";
import { updateEpicAction } from "@/app/scrum/lib/actions/epic";
import { EpicForm } from "@/app/scrum/components/EpicForm";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface EpicEditorProps {
  readonly flow: ScrumFlow;
  readonly epic: Epic;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function EpicEditor({ flow, epic }: EpicEditorProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    const result = await updateEpicAction(flow, epic.id, formData);
    setPending(false);

    if (result.ok) {
      toast.success("Epic mis à jour.");
      router.push(`/scrum/${flow}/epic`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function handleCancel() {
    router.push(`/scrum/${flow}/epic`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="space-y-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="-ml-2 gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour aux epics
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Éditer l&apos;epic
        </h1>
        <p className="text-sm text-muted-foreground">
          Mettez à jour le nom, l&apos;objectif, le périmètre ou les personas.
        </p>
      </header>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <EpicForm
          defaultValues={epic}
          onSubmit={handleSubmit}
          pending={pending}
        />
      </section>
    </div>
  );
}