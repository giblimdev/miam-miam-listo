/*
path :           app/blog/articles/new/page.tsx
tag :            ["blog", "page", "admin", "article", "new", "playlist", "io"]
projectId:       new-genesis
type:            page
generic:         false

role:            Page de création d'article. Sync page + Suspense ; charge
                 thèmes + tags + playlists + manifeste médias dans un
                 composant async et rend ArticleForm (mode="create").
                 `currentPlaylistId` est null (aucune assignation initiale).

                 ⚠️ `await io()` AVANT le premier `readBlog()` : Prisma 7
                 n'est pas ici en cause, mais `readBlog()` appelle
                 `migrateToCurrentVersion()` qui utilise `new Date()`
                 (updatedAt du document). Sans point de suspension
                 préalable sous <Suspense>, Next.js 16 (Cache Components)
                 rencontre cette valeur non-déterministe pendant le
                 prérendu et lève « Blocking Route ».
                 Cf. https://nextjs.org/docs/messages/blocking-prerender-current-time

flow:            NewArticlePage (sync) → Suspense → NewArticleSection
                 async → await io() → Promise.all([listThemes, listTags,
                 listPlaylists]) + getMediaManifest → <ArticleForm
                 mode="create" ... />.

ecosystem:       Blog = [
                   "@/app/blog/[slug]/page.tsx",
                   "@/app/blog/admin/articles/[id]/edit/page.tsx",
                   "@/app/blog/admin/articles/new/page.tsx",
                   "@/app/blog/admin/articles/page.tsx",
                   "@/app/blog/admin/setup/page.tsx",
                   "@/app/blog/admin/taxonomy/page.tsx",
                   "@/app/blog/articles/[id]/edit/page.tsx",
                   "@/app/blog/articles/ArticleRow.tsx",
                   "@/app/blog/articles/new/page.tsx",
                   "@/app/blog/articles/page.tsx",
                   "@/app/blog/community/[groupSlug]/[discussionId]/page.tsx",
                   "@/app/blog/community/[groupSlug]/page.tsx",
                   "@/app/blog/community/[groupSlug]/requests/page.tsx",
                   "@/app/blog/community/new/page.tsx",
                   "@/app/blog/community/page.tsx",
                   "@/app/blog/help/page.tsx",
                   "@/app/blog/notifications/page.tsx",
                   "@/app/blog/page.tsx",
                   "@/app/blog/search/page.tsx",
                   "@/app/blog/tag/[slug]/page.tsx",
                   "@/app/blog/theme/[slug]/[category]/[subCategory]/page.tsx",
                   "@/app/blog/theme/[slug]/[category]/page.tsx",
                   "@/app/blog/theme/[slug]/page.tsx",
                   "@/app/blog/user/articles/page.tsx",
                   "@/app/blog/user/favorites/page.tsx",
                 ]

relatedFiles:    ["@/app/blog/components/ArticleForm.tsx",
                  "@/app/blog/lib/services/taxonomy.ts",
                  "@/app/blog/lib/services/playlist.ts",
                  "@/app/blog/lib/media.ts",
                  "@/app/blog/lib/storage.ts"]

imports:         ["react", "next/cache",
                  "@/app/blog/lib/services/taxonomy",
                  "@/app/blog/lib/services/playlist",
                  "@/app/blog/lib/media",
                  "@/app/blog/components/ArticleForm",
                  "@/components/ui/skeleton"]

exports:         ["default BlogAdminNewArticlePage"]

useBy:           []

userStories:     ["us1100005"]

status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { io } from "next/cache";

import { listTags, listThemes } from "@/app/blog/lib/services/taxonomy";
import { listPlaylists } from "@/app/blog/lib/services/playlist";
import { getMediaManifest } from "@/app/blog/lib/media";
import { ArticleForm } from "@/app/blog/components/ArticleForm";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Page (sync)                                                        */
/* ------------------------------------------------------------------ */

export default function BlogAdminNewArticlePage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-1">
          Administration
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Nouvel article
        </h1>
      </header>
      <Suspense fallback={<FormSkeleton />}>
        <NewArticleSection />
      </Suspense>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section async                                                      */
/* ------------------------------------------------------------------ */

async function NewArticleSection() {
  /* ⚠️ io() AVANT le premier readBlog().
     readBlog() → migrateToCurrentVersion() utilise `new Date()`.
     Sans point de suspension préalable sous <Suspense>, Next.js 16
     (Cache Components) rencontre cette valeur non-déterministe pendant
     le prérendu et lève « Blocking Route ». */
  await io();

  const [themes, tags, playlists] = await Promise.all([
    listThemes(),
    listTags(),
    listPlaylists(),
  ]);
  const mediaManifest = getMediaManifest();
  return (
    <ArticleForm
      mode="create"
      themes={themes}
      tags={tags}
      playlists={playlists}
      currentPlaylistId={null}
      mediaManifest={mediaManifest}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function FormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}
