/*
path :           app/blog/components/QuickCreateCategoryDialog.tsx
tag :            ["blog", "admin", "form", "taxonomy", "quick-create", "dialog", "client"]
projectId:       new-genesis
type:            component
generic:         false

role:            Dialog de création rapide d'une catégorie (ou
                 sous-catégorie) depuis ArticleForm. Construit un
                 FormData et appelle createCategoryAction (ou
                 createSubCategoryAction), puis onCreated(id).

flow:            submit → FormData → createCategoryAction /
                 createSubCategoryAction → succès : onCreated + close.

ecosystem:       BlogAdmin = [
                   "@/app/blog/admin/articles/[id]/edit/page.tsx",
                   "@/app/blog/admin/articles/new/page.tsx",
                   "@/app/blog/admin/articles/page.tsx",
                   "@/app/blog/admin/articles/ArticleRow.tsx",
                   "@/app/blog/admin/setup/page.tsx",
                   "@/app/blog/admin/taxonomy/page.tsx",
                   "@/app/blog/components/ArticleForm.tsx",
                   "@/app/blog/components/CoverImagePicker.tsx",
                   "@/app/blog/components/QuickCreateCategoryDialog.tsx",
                   "@/app/blog/components/QuickCreateTagDialog.tsx",
                   "@/app/blog/components/articleDraft.ts",
                 ]

relatedFiles:    ["@/app/blog/components/ArticleForm.tsx",
                  "@/app/blog/lib/actions/taxonomy.ts"]

imports:         ["react", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/taxonomy",
                  "@/components/ui/button",
                  "@/components/ui/dialog",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/ui/textarea"]

exports:         ["QuickCreateCategoryDialog", "QuickCreateCategoryDialogProps"]

useBy:           ["@/app/blog/components/ArticleForm.tsx"]

userStories:     ["us1100002", "us1100003", "us1100005", "us1100006"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, useTransition, Dialog, toast.

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createCategoryAction,
  createSubCategoryAction,
} from "@/app/blog/lib/actions/taxonomy";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface QuickCreateCategoryDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly themeId: string;
  /** Requis si mode === "subcategory". */
  readonly categoryId?: string;
  readonly mode: "category" | "subcategory";
  /** Callback : nouvelle entité créée, id retourné. */
  readonly onCreated: (id: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function QuickCreateCategoryDialog({
  open,
  onOpenChange,
  themeId,
  categoryId,
  mode,
  onCreated,
}: QuickCreateCategoryDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const isSub = mode === "subcategory";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      toast.error("Le nom est requis.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", trimmed);
      formData.set("description", description.trim());

      const result = isSub
        ? categoryId
          ? await createSubCategoryAction(themeId, categoryId, formData)
          : { ok: false as const, error: "Catégorie parente manquante." }
        : await createCategoryAction(themeId, formData);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(isSub ? "Sous-catégorie créée." : "Catégorie créée.");
      onCreated(result.data.id);
      setName("");
      setDescription("");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSub ? "Nouvelle sous-catégorie" : "Nouvelle catégorie"}
          </DialogTitle>
          <DialogDescription>
            {isSub
              ? "Ajoutée à la catégorie sélectionnée, sans quitter le formulaire."
              : "Ajoutée au thème sélectionné, sans quitter le formulaire."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="quick-name">Nom</FieldLabel>
            <Input
              id="quick-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              autoFocus
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="quick-desc">
              Description (optionnel)
            </FieldLabel>
            <Textarea
              id="quick-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={200}
              disabled={isPending}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Plus className="size-4" aria-hidden />
              )}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}