/*
path :           app/blog/components/FavoriteManager.tsx
tag :            ["blog", "component", "favorite", "manager", "client"]
projectId:       new-genesis
type :           component
generic:         false

role:            Gestion interactive des favoris. Affiche les dossiers
                 (avec leurs articles) puis les non-classés. Actions :
                 créer un dossier (Dialog + form), renommer, supprimer
                 (AlertDialog), retirer un favori. Appelle les
                 Server Actions favorite.ts et router.refresh().

flow:            Props { userContent, articles } → useState
                 (createOpen, renaming, deleting, removing) →
                 rend sections. Chaque action = startTransition +
                 toast + router.refresh().

ecosystem:       BlogUI = [
                   ... (identique à ArticleCard)
                 ]

relatedFiles:    ["@/app/blog/lib/actions/favorite.ts",
                  "@/app/blog/lib/types.ts"]

imports:         ["react", "next/navigation", "next/link",
                  "lucide-react", "sonner",
                  "@/app/blog/lib/actions/favorite",
                  "@/app/blog/lib/types",
                  "@/components/ui/button",
                  "@/components/ui/input",
                  "@/components/ui/dialog",
                  "@/components/ui/alert-dialog"]

exports:         ["FavoriteManager", "FavoriteManagerProps"]

useBy:           ["@/app/blog/user/favorites/page.tsx"]

userStories:     ["us2100005", "us2100006"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, useTransition, router.refresh, dialogs, toast.

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Folder, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  createFolderAction,
  deleteFolderAction,
  renameFolderAction,
  toggleFavoriteAction,
} from "@/app/blog/lib/actions/favorite";
import type { Article, FavoriteFolder, UserContent } from "@/app/blog/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input";

export interface FavoriteManagerProps {
  readonly userContent: UserContent;
  readonly articles: readonly Article[];
}

export function FavoriteManager({
  userContent,
  articles,
}: FavoriteManagerProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FavoriteFolder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FavoriteFolder | null>(null);
  const [isPending, startTransition] = useTransition();

  const byId = useMemo(
    () => new Map(articles.map((a) => [a.id, a])),
    [articles],
  );

  function handleRemove(articleId: string) {
    startTransition(async () => {
      const result = await toggleFavoriteAction(articleId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Retiré des favoris.");
      router.refresh();
    });
  }

  function handleDeleteFolder() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteFolderAction(deleteTarget.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Dossier supprimé. Favoris remis dans non classés.");
      setDeleteTarget(null);
      router.refresh();
    });
  }

  const hasAny =
    userContent.unfiledFavorites.length > 0 ||
    userContent.favoriteFolders.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {userContent.unfiledFavorites.length} non classé
          {userContent.unfiledFavorites.length > 1 ? "s" : ""} ·{" "}
          {userContent.favoriteFolders.length} dossier
          {userContent.favoriteFolders.length > 1 ? "s" : ""}
        </p>
        <Button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="gap-2"
        >
          <Plus className="size-4" aria-hidden />
          Nouveau dossier
        </Button>
      </div>

      {!hasAny && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun favori pour l&apos;instant. Cliquez sur « Sauvegarder »
            depuis un article.
          </p>
        </div>
      )}

      {userContent.favoriteFolders
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((folder) => (
          <section
            key={folder.id}
            className="space-y-3 rounded-2xl border border-border/60 bg-card p-5"
          >
            <header className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                <Folder className="size-4 text-chart-2" aria-hidden />
                {folder.name}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({folder.articleIds.length})
                </span>
              </h2>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setRenameTarget(folder)}
                >
                  Renommer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget(folder)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Supprimer
                </Button>
              </div>
            </header>
            {folder.articleIds.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Dossier vide.
              </p>
            ) : (
              <ul className="space-y-1">
                {folder.articleIds.map((id) => {
                  const article = byId.get(id);
                  if (!article) return null;
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-muted/20 px-3 py-2"
                    >
                      <Link
                        href={`/blog/${article.slug}`}
                        className="min-w-0 flex-1 truncate text-sm text-foreground hover:underline"
                      >
                        {article.title}
                      </Link>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => handleRemove(article.id)}
                        disabled={isPending}
                        aria-label="Retirer des favoris"
                      >
                        <X aria-hidden />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}

      {userContent.unfiledFavorites.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="text-base font-bold text-foreground">
            Non classés ({userContent.unfiledFavorites.length})
          </h2>
          <ul className="space-y-1">
            {userContent.unfiledFavorites.map((id) => {
              const article = byId.get(id);
              if (!article) return null;
              return (
                <li
                  key={id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-muted/20 px-3 py-2"
                >
                  <Link
                    href={`/blog/${article.slug}`}
                    className="min-w-0 flex-1 truncate text-sm text-foreground hover:underline"
                  >
                    {article.title}
                  </Link>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => handleRemove(article.id)}
                    disabled={isPending}
                    aria-label="Retirer des favoris"
                  >
                    <X aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Créer dossier */}
      <FolderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Nouveau dossier"
        onSave={async (name) => {
          const result = await createFolderAction(name);
          if (!result.ok) return result.error;
          toast.success("Dossier créé.");
          setCreateOpen(false);
          router.refresh();
          return null;
        }}
      />

      {/* Renommer dossier */}
      <FolderDialog
        open={renameTarget !== null}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        title="Renommer le dossier"
        defaultValue={renameTarget?.name ?? ""}
        onSave={async (name) => {
          if (!renameTarget) return "Dossier introuvable.";
          const result = await renameFolderAction(renameTarget.id, name);
          if (!result.ok) return result.error;
          toast.success("Dossier renommé.");
          setRenameTarget(null);
          router.refresh();
          return null;
        }}
      />

      {/* Suppression dossier */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les favoris du dossier « {deleteTarget?.name} » seront remis
              dans non classés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FolderDialog({
  open,
  onOpenChange,
  title,
  defaultValue = "",
  onSave,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly defaultValue?: string;
  readonly onSave: (name: string) => Promise<string | null>;
}) {
  const [name, setName] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const err = await onSave(trimmed);
      if (err) setError(err);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Nommez votre dossier.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive"
            >
              {error}
            </p>
          )}
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Veille, Tutoriels, À lire"
            required
            maxLength={100}
          />
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
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}