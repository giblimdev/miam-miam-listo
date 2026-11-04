/*
path :           app/blog/components/TagForm.tsx
tag :            ["blog", "component", "admin", "tag", "form"]
projectId:       new-genesis
type:            component
generic:         false

role:            Formulaire de tag (create / edit). Dialog parent
                 (TagSection) gère l'ouverture/fermeture.

flow:            submit → FormData → createTagAction / updateTagAction
                 → succès : onSuccess(data).

ecosystem:       BlogUI = [
                   "@/app/blog/components/ArticleBody.tsx",
                   "@/app/blog/components/ArticleCard.tsx",
                   "@/app/blog/components/ArticleForm.tsx",
                   "@/app/blog/components/ArticleHeader.tsx",
                   "@/app/blog/components/CommentForm.tsx",
                   "@/app/blog/components/CommentTree.tsx",
                   "@/app/blog/components/ContentBlockRenderer.tsx",
                   "@/app/blog/components/CoverImagePicker.tsx",
                   "@/app/blog/components/DiscussionThread.tsx",
                   "@/app/blog/components/FavoriteButton.tsx",
                   "@/app/blog/components/GroupCard.tsx",
                   "@/app/blog/components/LikeButton.tsx",
                   "@/app/blog/components/NotificationBell.tsx",
                   "@/app/blog/components/NotificationList.tsx",
                   "@/app/blog/components/PostTree.tsx",
                   "@/app/blog/components/QuickCreateCategoryDialog.tsx",
                   "@/app/blog/components/QuickCreateTagDialog.tsx",
                   "@/app/blog/components/SearchFilters.tsx",
                   "@/app/blog/components/TableOfContents.tsx",
                   "@/app/blog/components/TagForm.tsx",
                   "@/app/blog/components/TaxonomyForm.tsx",
                   "@/app/blog/components/TaxonomyNav.tsx",
                   "@/app/blog/components/articleDraft.ts",
                   "@/app/blog/components/block-editor/BlockEditor.tsx",
                   "@/app/blog/components/block-editor/BlockList.tsx",
                   "@/app/blog/components/block-editor/BlockToolbar.tsx",
                   "@/app/blog/components/block-editor/BlockTypeMenu.tsx",
                   "@/app/blog/components/block-editor/forms/AudioBlockForm.tsx",
                   "@/app/blog/components/block-editor/forms/CodeBlockForm.tsx",
                   "@/app/blog/components/block-editor/forms/DocumentBlockForm.tsx",
                   "@/app/blog/components/block-editor/forms/EmbedBlockForm.tsx",
                   "@/app/blog/components/block-editor/forms/ImageBlockForm.tsx",
                   "@/app/blog/components/block-editor/forms/ParagraphBlockForm.tsx",
                   "@/app/blog/components/block-editor/forms/SectionBlockForm.tsx",
                   "@/app/blog/components/block-editor/forms/VideoBlockForm.tsx",
                 ]

relatedFiles:    ["@/app/blog/lib/actions/taxonomy.ts",
                  "@/app/blog/lib/types.ts"]

imports:         ["react", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/taxonomy",
                  "@/app/blog/lib/types",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input"]

exports:         ["TagForm", "TagFormProps"]

useBy:           ["@/app/blog/components/TagSection.tsx",
                  "@/app/blog/admin/taxonomy/page.tsx"]

userStories:     ["us1100004"]
status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, useTransition, toast, interactions.

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import {
  createTagAction,
  updateTagAction,
} from "@/app/blog/lib/actions/taxonomy";
import type { Tag } from "@/app/blog/lib/types";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export interface TagFormProps {
  readonly initial?: Tag;
  readonly onSuccess: (tag: Tag) => void;
  readonly onCancel: () => void;
}

export function TagForm({ initial, onSuccess, onCancel }: TagFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("name", name.trim());
    if (color.trim()) formData.set("color", color.trim());

    startTransition(async () => {
      const result = initial
        ? await updateTagAction(initial.id, formData)
        : await createTagAction(formData);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(initial ? "Tag mis à jour." : "Tag créé.");
      onSuccess(result.data);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}

      <Field>
        <FieldLabel htmlFor="tag-name">Nom</FieldLabel>
        <Input
          id="tag-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="ex. React, TypeScript, UX"
          required
          maxLength={50}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="tag-color">
          Couleur (optionnel, ex. chart-2)
        </FieldLabel>
        <Input
          id="tag-color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          placeholder="chart-1, chart-2, #RRGGBB…"
          maxLength={50}
        />
      </Field>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Annuler
        </Button>
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          {initial ? "Mettre à jour" : "Créer"}
        </Button>
      </div>
    </form>
  );
}