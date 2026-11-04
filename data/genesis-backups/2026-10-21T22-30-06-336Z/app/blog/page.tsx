/*
path :           app/blog/page.tsx
tag :            ["blog", "page", "articles", "list", "public", "cta-author", "io"]
projectId:       new-genesis
type :           page
generic:         false

role:            Page d'index du blog. Affiche les articles published +
                 public via searchArticles (tri publishedAt DESC) et la
                 TaxonomyNav pour la découverte. Sync page + Suspense ;
                 le composant async charge thèmes + articles en parallèle.

                 Ajout : un CTA « Ajouter un article » est affiché dans
                 le hero UNIQUEMENT aux utilisateurs dont le rôle est
                 admin ou author. Le rôle est calculé côté serveur via
                 getBlogSession() + prisma.user.role, puis passé au
                 rendu conditionnel. Le bouton pointe vers
                 /blog/articles/new (page physique réelle).

                 ⚠️ `await io()` AVANT getBlogSession() et AVANT
                 prisma.user.findUnique : Prisma 7 lit new Date() de
                 manière synchrone dans son NowGenerator (bug connu,
                 cf. nextjs.org/docs/messages/blocking-prerender-
                 current-time). Sans point de suspension préalable,
                 Next.js considère `new Date()` comme rencontré pendant
                 le prérendu statique → « Blocking Route ». C'est le
                 même correctif que dans app/layout.tsx et
                 app/blog/articles/page.tsx.

flow:            BlogPage (sync) → Suspense → BlogSection async →
                 await io() → Promise.all([listThemes(),
                 searchArticles({ page: 1, pageSize: 20 })]) →
                 getBlogSession() + prisma.user.findUnique({ role }) →
                 canCreate = role ∈ {"admin","author"} → rend hero
                 (avec CTA conditionnel « Ajouter un article ») +
                 TaxonomyNav + grille ArticleCard + pagination.

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

relatedFiles:    ["@/app/blog/lib/services/search.ts",
                  "@/app/blog/lib/services/taxonomy.ts",
                  "@/app/blog/lib/session.ts",
                  "@/lib/prisma.ts",
                  "@/app/blog/components/ArticleCard.tsx",
                  "@/app/blog/components/TaxonomyNav.tsx"]

imports:         ["react", "next/link", "next/cache", "lucide-react", "next",
                  "@/app/blog/lib/services/search",
                  "@/app/blog/lib/services/taxonomy",
                  "@/app/blog/lib/session",
                  "@/lib/prisma",
                  "@/app/blog/components/ArticleCard",
                  "@/app/blog/components/TaxonomyNav",
                  "@/components/ui/skeleton"]

exports:         ["default BlogPage", "metadata"]

useBy:           ["@/components/layout/header/nav/frontWorkSpace.ts"]

userStories:     ["us4100001", "us4100004", "us1100005"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import Link from "next/link";
import { io } from "next/cache";
import { BookOpen, Plus, Sparkles, Tag as TagIcon } from "lucide-react";
import type { Metadata } from "next";

import { searchArticles } from "@/app/blog/lib/services/search";
import { listThemes } from "@/app/blog/lib/services/taxonomy";
import { getBlogSession } from "@/app/blog/lib/session";
import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/app/blog/components/ArticleCard";
import { TaxonomyNav } from "@/app/blog/components/TaxonomyNav";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Articles, retours d'expérience et tutoriels autour de Genesis et du développement produit.",
};

/* ------------------------------------------------------------------ */
/*  Page (sync)                                                        */
/* ------------------------------------------------------------------ */

export default function BlogPage() {
  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-muted/30">
      <Suspense fallback={<BlogSkeleton />}>
        <BlogSection />
      </Suspense>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section async                                                      */
/* ------------------------------------------------------------------ */

async function BlogSection() {
  /* ⚠️ io() AVANT Prisma : Prisma 7 lit new Date() de façon
     synchrone dans son NowGenerator (bug connu). Sans point de
     suspension préalable sous <Suspense>, Next.js considère
     `new Date()` comme rencontré pendant le prérendu statique et
     lève « Blocking Route ». Même correctif que dans
     app/layout.tsx et app/blog/articles/page.tsx. */
  await io();

  /* 1. Charger thèmes + articles en parallèle */
  const [themes, result] = await Promise.all([
    listThemes(),
    searchArticles({ page: 1, pageSize: 20 }),
  ]);

  /* 2. Déterminer si l'utilisateur peut créer un article.
        On lit la session + le rôle Prisma. Seuls admin et author
        voient le CTA « Ajouter un article ». */
  const session = await getBlogSession();
  const role = session?.user
    ? (
        await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        })
      )?.role ?? "user"
    : null;
  const canCreate = role === "admin" || role === "author";

  return (
    <>
      {/* ---------------------------------------------------------- */}
      {/*  Hero                                                       */}
      {/* ---------------------------------------------------------- */}
      <section className="relative overflow-hidden px-4 pt-16 pb-10 sm:px-6 sm:pt-20 sm:pb-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-chart-1/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-12 size-96 rounded-full bg-chart-3/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <TagIcon className="size-3.5 text-chart-2" aria-hidden />
            Blog · Articles & tutoriels
          </span>

          <h1 className="mt-5 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Articles & tutoriels
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Retours d&apos;expérience, guides pratiques et explorations autour
            de Genesis.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {canCreate && (
              <Link
                href="/blog/articles/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Plus className="size-4" aria-hidden />
                Ajouter un article
              </Link>
            )}
            <Link
              href="/blog/search"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <BookOpen className="size-4" aria-hidden />
              Rechercher
            </Link>
            <Link
              href="/blog/community"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Sparkles className="size-4" aria-hidden />
              Communauté
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Navigation taxonomique                                     */}
      {/* ---------------------------------------------------------- */}
      {themes.length > 0 && (
        <section className="px-4 pb-6 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <TaxonomyNav themes={themes} />
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- */}
      {/*  Grille d'articles                                          */}
      {/* ---------------------------------------------------------- */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {result.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aucun article publié pour l&apos;instant.
              </p>
              {canCreate && (
                <Link
                  href="/blog/articles/new"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <Plus className="size-4" aria-hidden />
                  Créer le premier article
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}

          {result.totalPages > 1 && (
            <nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: result.totalPages }).map((_, i) => {
                const p = i + 1;
                const active = p === result.page;
                return (
                  <Link
                    key={p}
                    href={`/blog?page=${p}`}
                    className={
                      active
                        ? "inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                        : "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border/60 px-3 text-sm text-muted-foreground hover:bg-muted"
                    }
                    aria-current={active ? "page" : undefined}
                  >
                    {p}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function BlogSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-4 w-32" />
        <Skeleton className="mx-auto h-12 w-3/4" />
        <Skeleton className="mx-auto h-4 w-1/2" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}