/*
path :           app/scrum/components/EpicForm.tsx
tag :            ["scrum", "epic", "form", "ui"]
projectId:       new-genesis
type:            component
generic:         false

role:            Formulaire de création / édition d'un epic Scrum. Structure
                 3 zones : corps scrollable + footer sticky. Textareas goal et
                 scope capées (max-h-56).

flow:            useForm → handleSubmit → FormData → onSubmit(formData).
                 personas séparés par des virgules.

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
                   "@/app/core/components/scrum/SprintList.tsx",
                   "@/app/core/components/scrum/UserStoryCard.tsx",
                   "@/app/core/components/scrum/UserStoryForm.tsx",
                   "@/app/core/components/scrum/UserStoryList.tsx",
                 ]

relatedFiles:    ["@/app/lib/scrum/types.ts",
                  "@/app/lib/scrum/validations.ts",
                  "@/app/lib/scrum/EpicList.tsx"]

imports:         ["react-hook-form", "@hookform/resolvers/zod",
                  "lucide-react",
                  "@/app/lib/scrum/types",
                  "@/app/lib/scrum/validations",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/ui/textarea"]

exports:         ["EpicForm", "EpicFormProps"]

useBy:           ["@/app/core/components/scrum/EpicList.tsx"]

userStories:     ["*en tant qu'utilisateur je veux créer ou éditer un epic Scrum"]

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

import type { Epic } from "@/app/scrum/lib/types";
import { epicInputSchema, type EpicInput } from "@/app/scrum/lib/validations";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface EpicFormProps {
  readonly defaultValues?: Epic;
  readonly onSubmit: (formData: FormData) => void | Promise<void>;
  readonly pending?: boolean;
}

export function EpicForm({
  defaultValues,
  onSubmit,
  pending = false,
}: EpicFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EpicInput>({
    resolver: zodResolver(epicInputSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      goal: defaultValues?.goal ?? "",
      scope: defaultValues?.scope ?? "",
      personas: defaultValues?.personas ? [...defaultValues.personas] : [],
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  function submit(values: EpicInput) {
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("goal", values.goal);
    formData.set("scope", values.scope);
    formData.set("personas", (values.personas ?? []).join(","));
    void onSubmit(formData);
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex min-h-0 flex-1 flex-col gap-5"
      noValidate
    >
      <div className="flex-1 min-h-0 space-y-5 overflow-y-auto overscroll-contain pr-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
        <Field data-invalid={errors.name ? "" : undefined}>
          <FieldLabel htmlFor="epic-name">Nom</FieldLabel>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <Input
                {...field}
                id="epic-name"
                placeholder="Ex: Onboarding"
                aria-invalid={errors.name ? true : undefined}
              />
            )}
          />
          {errors.name?.message && (
            <FieldError errors={[{ message: errors.name.message }]} />
          )}
        </Field>

        <Field data-invalid={errors.goal ? "" : undefined}>
          <FieldLabel htmlFor="epic-goal">Objectif</FieldLabel>
          <Controller
            control={control}
            name="goal"
            render={({ field }) => (
              <Textarea
                {...field}
                id="epic-goal"
                rows={4}
                placeholder="Quel est l'objectif de cet epic ?"
                aria-invalid={errors.goal ? true : undefined}
                className="max-h-56 resize-none overflow-y-auto"
              />
            )}
          />
          {errors.goal?.message && (
            <FieldError errors={[{ message: errors.goal.message }]} />
          )}
        </Field>

        <Field data-invalid={errors.scope ? "" : undefined}>
          <FieldLabel htmlFor="epic-scope">Périmètre</FieldLabel>
          <Controller
            control={control}
            name="scope"
            render={({ field }) => (
              <Textarea
                {...field}
                id="epic-scope"
                rows={4}
                placeholder="Ce qui est inclus, ce qui ne l'est pas."
                aria-invalid={errors.scope ? true : undefined}
                className="max-h-56 resize-none overflow-y-auto"
              />
            )}
          />
          {errors.scope?.message && (
            <FieldError errors={[{ message: errors.scope.message }]} />
          )}
        </Field>

        <Field data-invalid={errors.personas ? "" : undefined}>
          <FieldLabel htmlFor="epic-personas">
            Personas (séparés par des virgules)
          </FieldLabel>
          <Controller
            control={control}
            name="personas"
            render={({ field }) => (
              <Input
                id="epic-personas"
                value={(field.value ?? []).join(", ")}
                onChange={(e) =>
                  field.onChange(
                    e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  )
                }
                onBlur={field.onBlur}
                placeholder="Ex: Marie, Karim"
                aria-invalid={errors.personas ? true : undefined}
              />
            )}
          />
          {errors.personas?.message && (
            <FieldError errors={[{ message: errors.personas.message }]} />
          )}
        </Field>
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
