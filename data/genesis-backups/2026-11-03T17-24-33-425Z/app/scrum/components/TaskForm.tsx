/*
path :           app/core/components/TaskForm.tsx
tag :            ["scrum", "task", "form", "ui"]
projectId:       new-genesis
type:            component
generic:         false

role:            Formulaire de création / édition d'une task Scrum.
                 Structure 3 zones : corps scrollable + footer sticky.
                 Le champ storyId utilise NativeSelect (options = titres
                 des UserStories disponibles) et status un NativeSelect
                 à 3 valeurs. Description capée (max-h-56).

flow:            useForm → handleSubmit → FormData → onSubmit(formData).

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
                   "@/app/core/components/scrum/TaskCard.tsx",
                   "@/app/core/components/scrum/TaskForm.tsx",
                   "@/app/core/components/scrum/TaskList.tsx",
                   "@/app/core/components/scrum/UserStoryCard.tsx",
                   "@/app/core/components/scrum/UserStoryForm.tsx",
                   "@/app/core/components/scrum/UserStoryList.tsx",
                 ]

relatedFiles:    ["@/app/core/lib/scrum/types.ts",
                  "@/app/core/lib/scrum/validations.ts",
                  "@/app/core/components/scrum/TaskList.tsx"]

imports:         ["react-hook-form", "@hookform/resolvers/zod",
                  "lucide-react",
                  "@/app/core/lib/scrum/types",
                  "@/app/core/lib/scrum/validations",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/ui/native-select",
                  "@/components/ui/textarea"]

exports:         ["TaskForm", "TaskFormProps"]

useBy:           ["@/app/core/components/scrum/TaskList.tsx"]

userStories:     ["*en tant qu'utilisateur je veux créer ou éditer une task Scrum"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useForm, interactions utilisateur.

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import type { Task, UserStory } from "@/app/scrum/lib/types";
import { taskInputSchema, type TaskInput } from "@/app/scrum/lib/validations";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface TaskFormProps {
  /**
   * UserStories disponibles pour rattacher la task. Non vide en pratique :
   * TaskList bloque la création si aucune story n'existe.
   */
  readonly stories: readonly UserStory[];
  readonly defaultValues?: Task;
  readonly onSubmit: (formData: FormData) => void | Promise<void>;
  readonly pending?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function TaskForm({
  stories,
  defaultValues,
  onSubmit,
  pending = false,
}: TaskFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskInputSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      status: defaultValues?.status ?? "todo",
      storyId: defaultValues?.storyId ?? stories[0]?.id ?? "",
      assignee: defaultValues?.assignee ?? "",
      estimate: defaultValues?.estimate ?? "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  function submit(values: TaskInput) {
    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("description", values.description ?? "");
    formData.set("status", values.status);
    formData.set("storyId", values.storyId);
    formData.set("assignee", values.assignee ?? "");
    formData.set("estimate", values.estimate ?? "");
    void onSubmit(formData);
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex min-h-0 flex-1 flex-col gap-5"
      noValidate
    >
      <div className="flex-1 min-h-0 space-y-5 overflow-y-auto overscroll-contain pr-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
        <Field data-invalid={errors.title ? "" : undefined}>
          <FieldLabel htmlFor="task-title">Titre</FieldLabel>
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <Input
                {...field}
                id="task-title"
                placeholder="Ex: Brancher l'API Stripe"
                aria-invalid={errors.title ? true : undefined}
              />
            )}
          />
          {errors.title?.message && (
            <FieldError errors={[{ message: errors.title.message }]} />
          )}
        </Field>

        <Field data-invalid={errors.description ? "" : undefined}>
          <FieldLabel htmlFor="task-description">
            Description (optionnel)
          </FieldLabel>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="task-description"
                rows={4}
                placeholder="Détails techniques, critères de fin…"
                aria-invalid={errors.description ? true : undefined}
                className="max-h-56 resize-none overflow-y-auto"
              />
            )}
          />
          {errors.description?.message && (
            <FieldError errors={[{ message: errors.description.message }]} />
          )}
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.status ? "" : undefined}>
            <FieldLabel htmlFor="task-status">Statut</FieldLabel>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <NativeSelect
                  {...field}
                  id="task-status"
                  aria-invalid={errors.status ? true : undefined}
                >
                  <NativeSelectOption value="todo">À faire</NativeSelectOption>
                  <NativeSelectOption value="in_progress">
                    En cours
                  </NativeSelectOption>
                  <NativeSelectOption value="done">Terminé</NativeSelectOption>
                </NativeSelect>
              )}
            />
            {errors.status?.message && (
              <FieldError errors={[{ message: errors.status.message }]} />
            )}
          </Field>

          <Field data-invalid={errors.storyId ? "" : undefined}>
            <FieldLabel htmlFor="task-story">User story</FieldLabel>
            <Controller
              control={control}
              name="storyId"
              render={({ field }) => (
                <NativeSelect
                  {...field}
                  id="task-story"
                  aria-invalid={errors.storyId ? true : undefined}
                  disabled={stories.length === 0}
                >
                  {stories.length === 0 && (
                    <NativeSelectOption value="">
                      Aucune user story disponible
                    </NativeSelectOption>
                  )}
                  {stories.map((story) => (
                    <NativeSelectOption key={story.id} value={story.id}>
                      {story.title}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}
            />
            {errors.storyId?.message && (
              <FieldError errors={[{ message: errors.storyId.message }]} />
            )}
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.assignee ? "" : undefined}>
            <FieldLabel htmlFor="task-assignee">
              Assigné à (optionnel)
            </FieldLabel>
            <Controller
              control={control}
              name="assignee"
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="task-assignee"
                  placeholder="Ex: Marie"
                  aria-invalid={errors.assignee ? true : undefined}
                />
              )}
            />
            {errors.assignee?.message && (
              <FieldError errors={[{ message: errors.assignee.message }]} />
            )}
          </Field>

          <Field data-invalid={errors.estimate ? "" : undefined}>
            <FieldLabel htmlFor="task-estimate">
              Estimation (optionnel)
            </FieldLabel>
            <Controller
              control={control}
              name="estimate"
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="task-estimate"
                  placeholder="Ex: 2h, 0.5j"
                  aria-invalid={errors.estimate ? true : undefined}
                />
              )}
            />
            {errors.estimate?.message && (
              <FieldError errors={[{ message: errors.estimate.message }]} />
            )}
          </Field>
        </div>
      </div>

      <div className="flex shrink-0 justify-end border-t border-border/60 pt-4">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
