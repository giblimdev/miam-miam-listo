/*
path :           app/core/components/UserStoryForm.tsx
tag :            ["scrum", "user-story", "form", "ui"]
projectId:       new-genesis
type:            component
generic:         false

role:            Formulaire de création / édition d'une user story Scrum.
                 Structure 3 zones : corps scrollable + footer sticky. Les
                 textareas story (max-h-48) et acceptance (max-h-56) sont
                 capées. Les champs estimate/epicId restent en grille.

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
                   "@/app/core/components/scrum/SprintCard.tsx",
                   "@/app/core/components/scrum/SprintForm.tsx",
                   "@/app/core/components/scrum/SprintList.tsx",
                   "@/app/core/components/scrum/UserStoryCard.tsx",
                   "@/app/core/components/scrum/UserStoryForm.tsx",
                   "@/app/core/components/scrum/UserStoryList.tsx",
                 ]

relatedFiles:    ["@/app/core/lib/scrum/types.ts",
                  "@/app/core/lib/scrum/validations.ts",
                  "@/app/core/components/scrum/UserStoryList.tsx"]

imports:         ["react-hook-form", "@hookform/resolvers/zod",
                  "lucide-react",
                  "@/app/core/lib/scrum/types",
                  "@/app/core/lib/scrum/validations",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/ui/textarea"]

exports:         ["UserStoryForm", "UserStoryFormProps"]

useBy:           ["@/app/core/components/scrum/UserStoryList.tsx"]

userStories:     ["*en tant qu'utilisateur je veux créer ou éditer une user story Scrum"]

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

import type { UserStory } from "@/app/scrum/lib/types";
import {
  userStoryInputSchema,
  type UserStoryInput,
} from "@/app/scrum/lib/validations";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface UserStoryFormProps {
  readonly defaultValues?: UserStory;
  readonly onSubmit: (formData: FormData) => void | Promise<void>;
  readonly pending?: boolean;
}

export function UserStoryForm({
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
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="us-epic"
                  placeholder="Id de l'epic"
                  aria-invalid={errors.epicId ? true : undefined}
                />
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
