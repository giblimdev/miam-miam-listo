/*
path :           app/blog/components/TagSection.tsx
tag :            ["blog", "component", "admin", "tag", "section", "client"]
projectId:       new-genesis
type :           component
generic:         false

role:            Section de gestion des tags côté admin. Liste les
                 tags existants + bouton « Nouveau tag » + bouton
                 Éditer par tag. La dialog utilise TagForm (déplacé
                 dans components/). Suppression via AlertDialog natif.

flow:            Props { tags } → useState(createOpen, editing,
                 deleting) → rend liste + Dialog (TagForm) +
                 AlertDialog (suppression) → router.refresh().

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
                   "@/app/blog/components/TagSection.tsx",
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
                  "@/app/blog/lib/types.ts",
                  "@/app/blog/components/TagForm.tsx"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/taxonomy",
                  "@/app/blog/lib/types",
                  "@/app/blog/components/TagForm",
                  "@/components/ui/button",
                  "@/components/ui/dialog",
                  "@/components/ui/alert-dialog"]

exports:         ["TagSection", "TagSectionProps"]

useBy:           ["@/app/blog/admin/taxonomy/page.tsx"]

userStories:     ["us1100004"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, useTransition, toast, dialogs.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteTagAction } from "@/app/blog/lib/actions/taxonomy";
import type { Tag } from "@/app/blog/lib/types";
import { TagForm } from "@/app/blog/components/TagForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface TagSectionProps {
  readonly tags: readonly Tag[];
}

export function TagSection({ tags }: TagSectionProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteTagAction(deleting.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Tag supprimé.");
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <TagIcon className="size-4 text-chart-2" aria-hidden />
            Tags ({tags.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Indexation transverse des articles.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="gap-2"
        >
          <Plus className="size-4" aria-hidden />
          Nouveau tag
        </Button>
      </header>

      {tags.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Aucun tag pour l&apos;instant.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center gap-1 rounded-full border border-border/60 bg-background pl-3 pr-1 py-1 text-xs"
            >
              <span className="text-foreground">{tag.name}</span>
              <span className="text-muted-foreground">/{tag.slug}</span>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={() => setEditing(tag)}
                aria-label={`Éditer ${tag.name}`}
              >
                <Pencil aria-hidden />
              </Button>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={() => setDeleting(tag)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Supprimer ${tag.name}`}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau tag</DialogTitle>
            <DialogDescription>
              Le slug est généré automatiquement.
            </DialogDescription>
          </DialogHeader>
          <TagForm
            onSuccess={() => {
              setCreateOpen(false);
              router.refresh();
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Éditer le tag</DialogTitle>
            <DialogDescription>Mettez à jour le nom ou la couleur.</DialogDescription>
          </DialogHeader>
          {editing && (
            <TagForm
              initial={editing}
              onSuccess={() => {
                setEditing(null);
                router.refresh();
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce tag ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le tag « {deleting?.name} » sera retiré de tous les articles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}