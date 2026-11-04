/*
path :           app/blog/components/NewGroupForm.tsx
tag :            ["blog", "component", "group", "form", "client"]
projectId:       new-genesis
type :           component
generic:         false

role:            Formulaire de création de groupe. Client Component :
                 Inputs nom/description/visibilité + submit →
                 createGroupAction → succès : router.push
                 (`/blog/community/${slug}`) + refresh.

flow:            useState(name, description, visibility) → submit →
                 FormData → createGroupAction → succès : push +
                 refresh → erreur : toast.

ecosystem:       BlogUI = [
                   ... (identique à ArticleCard)
                 ]

relatedFiles:    ["@/app/blog/lib/actions/group.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/group",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/ui/textarea",
                  "@/components/ui/native-select"]

exports:         ["NewGroupForm"]

useBy:           ["@/app/blog/community/new/page.tsx"]

userStories:     ["us3100001"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, useTransition, router.push, toast.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { createGroupAction } from "@/app/blog/lib/actions/group";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { Visibility } from "@/app/blog/lib/types";

export function NewGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("description", description.trim());
    formData.set("visibility", visibility);

    startTransition(async () => {
      const result = await createGroupAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Groupe créé.");
      router.push(`/blog/community/${result.data.slug}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
      <Field>
        <FieldLabel htmlFor="group-name">Nom</FieldLabel>
        <Input
          id="group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="group-desc">Description (optionnel)</FieldLabel>
        <Textarea
          id="group-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={1000}
          className="resize-none"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="group-vis">Visibilité</FieldLabel>
        <NativeSelect
          id="group-vis"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as Visibility)}
        >
          <NativeSelectOption value="public">Public</NativeSelectOption>
          <NativeSelectOption value="unlisted">Non listé</NativeSelectOption>
          <NativeSelectOption value="private">Privé</NativeSelectOption>
        </NativeSelect>
      </Field>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !name.trim()} className="gap-2">
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          Créer le groupe
        </Button>
      </div>
    </form>
  );
}