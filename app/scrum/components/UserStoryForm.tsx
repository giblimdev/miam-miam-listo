/*
path :           app/scrum/components/UserStoryForm.tsx
tag :            ["scrum", "user-story", "form", "ui", "backlog"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Formulaire de création / édition d'une user story Scrum.
                 Structure 3 zones : corps scrollable + footer sticky. Les
                 textareas story (max-h-48) et acceptance (max-h-56) sont
                 capées. Le champ epicId est un NativeSelect avec option
                 vide « Aucun epic (backlog) » pour permettre le backlog
                 implicite : une US peut exister sans être rattachée à un
                 epic. Le champ estimate et le champ epicId sont en grille
                 sm:grid-cols-2.

flow:            useForm → handleSubmit → FormData → onSubmit(formData).
                 epicId vide → chaîne vide "" (transformée en undefined par
                 userStoryInputSchema.epicId via optionalText).

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
                  "@/app/scrum/components/UserStoryList.tsx"]

imports:         ["react-hook-form", "@hookform/resolvers/zod",
                  "lucide-react",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/validations",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/ui/native-select",
                  "@/components/ui/textarea"]

exports:         ["UserStoryForm", "UserStoryFormProps"]

useBy:           ["@/app/scrum/components/UserStoryList.tsx"]

userStories:     ["*en tant qu'utilisateur je veux créer ou éditer une user story Scrum"]

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

import type { Epic, UserStory } from "@/app/scrum/lib/types";
import {
  userStoryInputSchema,
  type UserStoryInput,
} from "@/app/scrum/lib/validations";
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

export interface UserStoryFormProps {
  /** Epics disponibles pour le rattachement (optionnel). */
  readonly epics: readonly Epic[];
  readonly defaultValues?: UserStory;
  readonly onSubmit: (formData: FormData) => void | Promise<void>;
  readonly pending?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function UserStoryForm({
  epics,
  defaultValues,
  onSubmit,
  pending = false,
}: UserStoryFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserStoryInput>({
    resolver: zodResolver(userStoryInputSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      story: defaultValues?.story ?? "",
      acceptance: defaultValues?.acceptance ?? "",
      estimate: defaultValues?.estimate ?? "",
      epicId: defaultValues?.epicId ?? "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  function submit(values: UserStoryInput) {
    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("story", values.story);
    formData.set("acceptance", values.acceptance);
    formData.set("estimate", values.estimate ?? "");
    formData.set("epicId", values.epicId ?? "");
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
          <FieldLabel htmlFor="us-title">Titre</FieldLabel>
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <Input
                {...field}
                id="us-title"
                placeholder="Ex: Rejoindre un espace"
                aria-invalid={errors.title ? true : undefined}
              />
            )}
          />
          {errors.title?.message && (
            <FieldError errors={[{ message: errors.title.message }]} />
          )}
        </Field>

        <Field data-invalid={errors.story ? "" : undefined}>
          <FieldLabel htmlFor="us-story">Récit</FieldLabel>
          <Controller
            control={control}
            name="story"
            render={({ field }) => (
              <Textarea
                {...field}
                id="us-story"
                rows={4}
                placeholder="En tant que… je veux… afin de…"
                aria-invalid={errors.story ? true : undefined}
                className="max-h-48 resize-none overflow-y-auto"
              />
            )}
          />
          {errors.story?.message && (
            <FieldError errors={[{ message: errors.story.message }]} />
          )}
        </Field>

        <Field data-invalid={errors.acceptance ? "" : undefined}>
          <FieldLabel htmlFor="us-acceptance">
            Critères d&apos;acceptation
          </FieldLabel>
          <Controller
            control={control}
            name="acceptance"
            render={({ field }) => (
              <Textarea
                {...field}
                id="us-acceptance"
                rows={5}
                placeholder="Étant donné… quand… alors…"
                aria-invalid={errors.acceptance ? true : undefined}
                className="max-h-56 resize-none overflow-y-auto"
              />
            )}
          />
          {errors.acceptance?.message && (
            <FieldError errors={[{ message: errors.acceptance.message }]} />
          )}
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.estimate ? "" : undefined}>
            <FieldLabel htmlFor="us-estimate">
              Estimation (optionnel)
            </FieldLabel>
            <Controller
              control={control}
              name="estimate"
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="us-estimate"
                  placeholder="Ex: 5, M, L"
                  aria-invalid={errors.estimate ? true : undefined}
                />
              )}
            />
            {errors.estimate?.message && (
              <FieldError errors={[{ message: errors.estimate.message }]} />
            )}
          </Field>

          <Field data-invalid={errors.epicId ? "" : undefined}>
            <FieldLabel htmlFor="us-epic">Epic lié (optionnel)</FieldLabel>
            <Controller
              control={control}
              name="epicId"
              render={({ field }) => (
                <NativeSelect
                  {...field}
                  value={field.value ?? ""}
                  id="us-epic"
                  aria-invalid={errors.epicId ? true : undefined}
                >
                  <NativeSelectOption value="">
                    Aucun epic (backlog)
                  </NativeSelectOption>
                  {epics.map((epic) => (
                    <NativeSelectOption key={epic.id} value={epic.id}>
                      {epic.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}
            />
            {errors.epicId?.message && (
              <FieldError errors={[{ message: errors.epicId.message }]} />
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