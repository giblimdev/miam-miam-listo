/*
path :           app/core/components/SprintEditor.tsx
tag :            ["scrum", "sprint", "editor", "dnd", "ui"]
projectId:       new-genesis
type:            component
generic:         false

role:            Orchestrateur de la page d'édition d'un sprint. Assemble :
                 (1) formulaire méta (nom, objectif, dates) via react-hook-form,
                 (2) board DnD Backlog ↔ Sprint (SprintStoriesBoard), (3) footer
                 sticky avec boutons Annuler / Enregistrer. Le bouton
                 Enregistrer déclenche deux Server Actions séquentielles :
                 updateSprintMetaAction puis updateSprintStoriesAction. En cas
                 d'échec de la seconde, la méta reste persistée (comportement
                 accepté, l'utilisateur peut corriger et réessayer).
                 Le state inSprintIds est initialisé via une copie mutable
                 `[...sprint.storyIds]` car sprint.storyIds est readonly
                 string[] et useState<string[]> exige un string[] mutable.

flow:            Reçoit flow, sprint, backlog, allStories, allEpics,
                 otherSprintsStoryCount → useState(inSprintIds) initialisé
                 depuis sprint.storyIds (copie mutable) →
                 useForm<SprintMetaInput> → handleSubmit → submit →
                 updateSprintMetaAction → si ok, updateSprintStoriesAction
                 → toast + router.push(`/core/${flow}/sprint`) +
                 router.refresh().

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

relatedFiles:    ["@/app/core/components/scrum/SprintStoriesBoard.tsx",
                  "@/app/core/lib/scrum/types.ts",
                  "@/app/core/lib/scrum/actions/sprint.ts",
                  "@/app/core/[flow]/sprint/[sprintId]/edit/page.tsx"]

imports:         ["react", "next/navigation", "react-hook-form",
                  "@hookform/resolvers/zod", "lucide-react", "sonner",
                  "@/app/core/lib/scrum/types",
                  "@/app/core/lib/scrum/validations",
                  "@/app/core/lib/scrum/actions/sprint",
                  "@/app/core/components/scrum/SprintStoriesBoard",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/ui/textarea"]

exports:         ["SprintEditor", "SprintEditorProps"]

useBy:           ["@/app/core/[flow]/sprint/[sprintId]/edit/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux éditer un sprint et organiser ses US par DnD"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useForm, useState, router.push, DnD, toast.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import type { Epic, ScrumFlow, Sprint, UserStory } from "@/app/scrum/lib/types";
import {
  sprintMetaInputSchema,
  type SprintMetaInput,
} from "@/app/scrum/lib/validations";
import {
  updateSprintMetaAction,
  updateSprintStoriesAction,
} from "@/app/scrum/lib/actions/sprint";
import { SprintStoriesBoard } from "@/app/scrum/components/SprintStoriesBoard";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface SprintEditorProps {
  readonly flow: ScrumFlow;
  readonly sprint: Sprint;
  /** US du flow qui ne sont dans AUCUN sprint (colonne gauche). */
  readonly backlog: readonly UserStory[];
  /** Toutes les US du flow (pour résoudre les ids du sprint courant). */
  readonly allStories: readonly UserStory[];
  /** Tous les epics du flow (pour afficher leur nom dans les mini-cartes). */
  readonly allEpics: readonly Epic[];
  /** Nombre d'US assignées à d'autres sprints (affiché en info). */
  readonly otherSprintsStoryCount: number;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function SprintEditor({
  flow,
  sprint,
  backlog,
  allStories,
  allEpics,
  otherSprintsStoryCount,
}: SprintEditorProps) {
  const router = useRouter();

  // Copie dans un tableau mutable : sprint.storyIds est readonly string[].
  // arrayMove (dans SprintStoriesBoard) exige un string[] mutable.
  const [inSprintIds, setInSprintIds] = useState<string[]>([
    ...sprint.storyIds,
  ]);
  const [pending, setPending] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SprintMetaInput>({
    resolver: zodResolver(sprintMetaInputSchema),
    defaultValues: {
      name: sprint.name,
      goal: sprint.goal,
      startDate: sprint.startDate ?? "",
      endDate: sprint.endDate ?? "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const epicNames = useMemo(
    () => new Map(allEpics.map((epic) => [epic.id, epic.name])),
    [allEpics],
  );

  const storyById = useMemo(
    () => new Map(allStories.map((us) => [us.id, us])),
    [allStories],
  );

  const inSprint = useMemo(
    () =>
      inSprintIds
        .map((id) => storyById.get(id))
        .filter((us): us is UserStory => us !== undefined),
    [inSprintIds, storyById],
  );

  async function submit(values: SprintMetaInput) {
    setPending(true);

    // Étape 1 : méta (nom, objectif, dates)
    const metaFormData = new FormData();
    metaFormData.set("name", values.name);
    metaFormData.set("goal", values.goal);
    metaFormData.set("startDate", values.startDate ?? "");
    metaFormData.set("endDate", values.endDate ?? "");

    const metaResult = await updateSprintMetaAction(
      flow,
      sprint.id,
      metaFormData,
    );
    if (!metaResult.ok) {
      setPending(false);
      toast.error(metaResult.error);
      return;
    }

    // Étape 2 : stories (liste ordonnée d'ids)
    const storiesResult = await updateSprintStoriesAction(
      flow,
      sprint.id,
      inSprintIds,
    );
    setPending(false);

    if (!storiesResult.ok) {
      toast.error(
        `Métadonnées enregistrées, mais échec sur les US : ${storiesResult.error}`,
      );
      return;
    }

    toast.success("Sprint enregistré.");
    router.push(`/${flow}/sprint`);
    router.refresh();
  }

  function handleCancel() {
    router.push(`/${flow}/sprint`);
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex flex-col gap-8"
      noValidate
    >
      {/* En-tête de page */}
      <header className="space-y-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="-ml-2 gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour aux sprints
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Éditer le sprint
        </h1>
        <p className="text-sm text-muted-foreground">
          Modifiez les métadonnées puis glissez les user stories entre le
          backlog et le sprint.
        </p>
      </header>

      {/* Méta */}
      <section className="space-y-5 rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          Métadonnées
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field
            data-invalid={errors.name ? "" : undefined}
            className="md:col-span-2"
          >
            <FieldLabel htmlFor="sprint-edit-name">Nom</FieldLabel>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  {...field}
                  id="sprint-edit-name"
                  aria-invalid={errors.name ? true : undefined}
                />
              )}
            />
            {errors.name?.message && (
              <FieldError errors={[{ message: errors.name.message }]} />
            )}
          </Field>

          <Field
            data-invalid={errors.goal ? "" : undefined}
            className="md:col-span-2"
          >
            <FieldLabel htmlFor="sprint-edit-goal">Objectif</FieldLabel>
            <Controller
              control={control}
              name="goal"
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="sprint-edit-goal"
                  rows={3}
                  className="max-h-48 resize-none overflow-y-auto"
                  aria-invalid={errors.goal ? true : undefined}
                />
              )}
            />
            {errors.goal?.message && (
              <FieldError errors={[{ message: errors.goal.message }]} />
            )}
          </Field>

          <Field data-invalid={errors.startDate ? "" : undefined}>
            <FieldLabel htmlFor="sprint-edit-start">
              Début (optionnel)
            </FieldLabel>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="sprint-edit-start"
                  type="date"
                  aria-invalid={errors.startDate ? true : undefined}
                />
              )}
            />
            {errors.startDate?.message && (
              <FieldError errors={[{ message: errors.startDate.message }]} />
            )}
          </Field>

          <Field data-invalid={errors.endDate ? "" : undefined}>
            <FieldLabel htmlFor="sprint-edit-end">Fin (optionnel)</FieldLabel>
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="sprint-edit-end"
                  type="date"
                  aria-invalid={errors.endDate ? true : undefined}
                />
              )}
            />
            {errors.endDate?.message && (
              <FieldError errors={[{ message: errors.endDate.message }]} />
            )}
          </Field>
        </div>
      </section>

      {/* Board */}
      <section className="space-y-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-base font-bold tracking-tight text-foreground">
            User stories
          </h2>
          <p className="text-xs text-muted-foreground">
            Glissez les US du backlog vers le sprint (ou l&apos;inverse).
            L&apos;ordre dans la colonne Sprint est conservé.
          </p>
          {otherSprintsStoryCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {otherSprintsStoryCount} US{" "}
              {otherSprintsStoryCount > 1 ? "sont assignées" : "est assignée"} à
              d&apos;autres sprints. Gérez-les depuis leur page respective.
            </p>
          )}
        </header>

        <SprintStoriesBoard
          backlog={backlog}
          inSprint={inSprint}
          epicNames={epicNames}
          onChange={setInSprintIds}
          disabled={pending}
        />
      </section>

      {/* Footer sticky */}
      <footer className="sticky bottom-0 z-10 -mx-4 flex flex-col-reverse gap-2 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={pending}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Enregistrement…
            </>
          ) : (
            <>
              <Save className="size-4" aria-hidden />
              Enregistrer
            </>
          )}
        </Button>
      </footer>
    </form>
  );
}
