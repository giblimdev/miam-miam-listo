/*
path :           app/blog/playlists/page.tsx
tag :            ["blog", "page", "playlist", "list", "public"]
projectId:       new-genesis
type:            page
generic:         false

role:            Index public des playlists. Sync page + Suspense ; lit
                 la session pour déterminer si l'utilisateur peut gérer
                 (admin/author → CTA « Gérer ») et charge les playlists
                 visibles (public + unlisted si viewer admin/author, +
                 private réservées à leurs créateurs — en v1, la visibilité
                 n'est PAS restreinte par créateur, seuls public et unlisted
                 sont affichés). Rend une grille de <PlaylistCard /> et
                 un état vide.

                 ⚠️ `await io()` AVANT getBlogSession() (Prisma 7
                 NowGenerator synchrone bloquant).

flow:            BlogPlaylistsPage (sync) → Suspense →
                 PlaylistsSection async → await io() → getBlogSession →
                 isAdmin → listPlaylists() → filtre public + (unlisted
                 si admin) → rend hero + CTA Gérer conditionnel +
                 grille <PlaylistCard /> + empty state.

ecosystem:       Blog = [
                   ... (voir tableau de référence)
                 ]

relatedFiles:    ["@/app/blog/lib/services/playlist.ts",
                  "@/app/blog/lib/session.ts",
                  "@/app/blog/lib/admin.ts",
                  "@/app/blog/components/PlaylistCard.tsx"]

imports:         ["react", "next/link", "next/cache", "lucide-react",
                  "@/app/blog/lib/services/playlist",
                  "@/app/blog/lib/session",
                  "@/app/blog/lib/admin",
                  "@/app/blog/components/PlaylistCard",
                  "@/components/ui/button",
                  "@/components/ui/skeleton"]

exports:         ["default BlogPlaylistsPage", "metadata"]

useBy:           []

userStories:     ["*en tant que lecteur je veux parcourir les playlists"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { Suspense } from "react";
import Link from "next/link";
import { io } from "next/cache";
import type { Metadata } from "next";
import { ListVideo, Settings } from "lucide-react";

import { listPlaylists } from "@/app/blog/lib/services/playlist";
import { getBlogSession } from "@/app/blog/lib/session";
import { isAdmin } from "@/app/blog/lib/admin";
import { PlaylistCard } from "@/app/blog/components/PlaylistCard";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Playlists",
  description:
    "Parcours éditoriaux ordonnés autour de Genesis et du développement produit.",
};

export default function BlogPlaylistsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:py-14">
      <Suspense fallback={<PlaylistsSkeleton />}>
        <PlaylistsSection />
      </Suspense>
    </div>
  );
}

async function PlaylistsSection() {
  await io();

  const session = await getBlogSession();
  const admin = await isAdmin();
  const canManage = admin || Boolean(session?.user);

  const all = await listPlaylists();
  const visible = all.filter((p) => {
    if (p.visibility === "public") return true;
    if (p.visibility === "unlisted") return canManage;
    return false;
  });

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-4">
            Parcours éditoriaux
          </p>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
            <ListVideo className="size-6 text-chart-4" aria-hidden />
            Playlists
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Des collections ordonnées d&apos;articles, pour suivre un parcours
            ou une série.
          </p>
        </div>
        {canManage && (
          <Link
            href="/blog/playlists/manage"
            className={`${buttonVariants({ variant: "outline" })} gap-2`}
          >
            <Settings className="size-4" aria-hidden />
            Gérer
          </Link>
        )}
      </header>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <ListVideo
            className="mx-auto mb-2 size-8 text-muted-foreground"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">
            Aucune playlist publique pour l&apos;instant.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}
    </>
  );
}

function PlaylistsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}