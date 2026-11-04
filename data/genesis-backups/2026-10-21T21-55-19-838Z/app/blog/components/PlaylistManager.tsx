/*
path :           app/blog/components/PlaylistManager.tsx
tag :            ["blog", "component", "playlist", "manager", "client", "admin"]
projectId:       new-genesis
type:            component
generic:         false

role:            Gestion admin/auteur des playlists. Liste les playlists
                 existantes avec boutons Éditer / Supprimer, bouton
                 « Nouvelle playlist », Dialog de création/édition
                 (PlaylistForm), AlertDialog de suppression. Client
                 Component : useState pour les dialogs, useTransition
                 pour les mutations, router.refresh après succès.
                 L'autorisation est vérifiée SERVEUR (les Server Actions
                 refusent un non-admin/non-author) — l'UI ne fait que
                 refléter.

flow:            Props { playlists } → useState(createOpen, editing,
                 deleting) → rend liste + Dialog (PlaylistForm) +
                 AlertDialog (suppression) → router.refresh().

ecosystem:       BlogUI = [
                   ... (voir tableau de référence)
                 ]

relatedFiles:    ["@/app/blog/lib/actions/playlist.ts",
                  "@/app/blog/lib/types.ts",
                  "@/app/blog/components/PlaylistForm.tsx"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/playlist",
                  "@/app/blog/lib/types",
                  "@/app/blog/components/PlaylistForm",
                  "@/components/ui/button",
                  "@/components/ui/dialog",
                  "@/components/ui/alert-dialog"]

exports:         ["PlaylistManager", "PlaylistManagerProps"]

useBy:           ["@/app/blog/playlists/manage/page.tsx"]

userStories:     ["*en tant qu'auteur je veux gérer mes playlists"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState (dialogs), useTransition, router.refresh, toast.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ListVideo, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deletePlaylistAction } from "@/app/blog/lib/actions/playlist";
import type { Playlist } from "@/app/blog/lib/types";
import { PlaylistForm } from "@/app/blog/components/PlaylistForm";
import { Button, buttonVariants } from "@/components/ui/button";
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

export interface PlaylistManagerProps {
  readonly playlists: readonly Playlist[];
}

export function PlaylistManager({ playlists }: PlaylistManagerProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Playlist | null>(null);
  const [deleting, setDeleting] = useState<Playlist | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deletePlaylistAction(deleting.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Playlist supprimée.");
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Playlists
          </h2>
          <p className="text-sm text-muted-foreground">
            {playlists.length} playlist{playlists.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="gap-2"
        >
          <Plus className="size-4" aria-hidden />
          Nouvelle playlist
        </Button>
      </div>

      {playlists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <ListVideo
            className="mx-auto mb-2 size-8 text-muted-foreground"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">
            Aucune playlist pour l&apos;instant.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {playlists
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((playlist) => (
              <li
                key={playlist.id}
                className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {playlist.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    /{playlist.slug} · {playlist.articleIds.length} article
                    {playlist.articleIds.length > 1 ? "s" : ""} ·{" "}
                    {playlist.visibility}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link
                    href={`/blog/playlist/${playlist.slug}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Voir
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(playlist)}
                    className="gap-1.5"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Éditer
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleting(playlist)}
                    disabled={isPending}
                    className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Supprimer
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>Nouvelle playlist</DialogTitle>
            <DialogDescription>
              Regroupez des articles en un parcours éditorial.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto pr-2">
            <PlaylistForm
              mode="create"
              onSuccess={() => {
                setCreateOpen(false);
                router.refresh();
              }}
              onCancel={() => setCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>Éditer la playlist</DialogTitle>
            <DialogDescription>
              Mettez à jour le nom, la description ou la couverture.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto pr-2">
            {editing && (
              <PlaylistForm
                mode="edit"
                initial={editing}
                onSuccess={() => {
                  setEditing(null);
                  router.refresh();
                }}
                onCancel={() => setEditing(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette playlist ?</AlertDialogTitle>
            <AlertDialogDescription>
              La playlist « {deleting?.name} » sera supprimée. Les articles
              qu&apos;elle contient sont conservés.
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
    </div>
  );
}