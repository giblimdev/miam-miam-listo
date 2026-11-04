/*
path :           app/scrum/components/TaskForm.tsx
tag :            ["scrum", "task", "form", "ui", "backlog"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Formulaire de création / édition d'une task Scrum.
                 Structure 3 zones : corps scrollable + footer sticky. Le
                 champ storyId utilise NativeSelect (options = titres des
                 UserStories disponibles + option vide « Aucune US (non
                 rattachée) ») pour le backlog implicite : une task peut
                 exister sans être rattachée à une US. Le champ status
                 utilise un NativeSelect à 3 valeurs. Description capée
                 (max-h-56).

flow:            useForm → handleSubmit → FormData → onSubmit(formData).
                 storyId vide → chaîne vide "" (transformée en undefined
                 par taskInputSchema.storyId via optionalText).

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
                   "@/app/scrum/components/TaskBoard.tsx",
                   "@/app/scrum/components/TaskCard.tsx",
                   "@/app/scrum/components/TaskForm.tsx",
                   "@/app/scrum/components/TaskList.tsx",
                   "@/app/scrum/components/UserStoryBoard.tsx",
                   "@/app/scrum/components/UserStoryCard.tsx",
                   "@/app/scrum/components/UserStoryForm.tsx",
                   "@/app/scrum/components/UserStoryList.tsx",
                   "@/app/scrum/components/UserStoryMiniCard.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/validations.ts",
                  "@/app/scrum/components/TaskList.tsx"]

imports:         ["react-hook-form", "@hookform/resolvers/zod",
                  "lucide-react",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/validations",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/ui/native-select",
                  "@/components/ui/textarea"]

exports:         ["TaskForm", "TaskFormProps"]

useBy:           ["@/app/scrum/components/TaskList.tsx"]

userStories:     ["*en tant qu'utilisateur je veux créer ou éditer une task Scrum"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
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
   * UserStories disponibles pour rattacher la task. Peut être vide :
   * dans ce cas, l'option « Aucune US (non rattachée) » est la seule
   * disponible et la task est créée dans le backlog implicite.
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
      storyId: defaultValues?.storyId ?? "",
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
    formData.set("storyId", values.storyId ?? "");
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
                  value={field.value ?? ""}
                  id="task-story"
                  aria-invalid={errors.storyId ? true : undefined}
                >
                  <NativeSelectOption value="">
                    Aucune US (non rattachée)
                  </NativeSelectOption>
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