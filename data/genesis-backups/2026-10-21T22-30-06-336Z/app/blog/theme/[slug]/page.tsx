/*
path :           app/blog/theme/[slug]/page.tsx
tag :            ["blog", "page", "taxonomy", "theme", "public"]
projectId:       new-genesis
type :           page
generic:         false

role:            Listing public d'un thème. Sync page + Suspense ;
                 charge le thème (slug), affiche son header (nom,
                 description, couleur), TaxonomyNav pour naviguer,
                 et les articles published+public du thème via
                 searchArticles({ themeSlug }). Paginé.

flow:            ThemePage (sync) → <Suspense fallback=<ThemeSkeleton/>>
                 → <ThemeSection params searchParams /> async → await →
                 listThemes → find by slug → si absent 404 →
                 searchArticles({ themeSlug: slug, page }) → rend.

ecosystem:       Blog = [
                   ... (identique à [slug]/page.tsx)
                 ]

relatedFiles:    ["@/app/blog/lib/services/taxonomy.ts",
                  "@/app/blog/lib/services/search.ts",
                  "@/app/blog/components/ArticleCard.tsx",
                  "@/app/blog/components/TaxonomyNav.tsx"]

imports:         ["react", "next/navigation", "next/link",
                  "@/app/blog/lib/services/taxonomy",
                  "@/app/blog/lib/services/search",
                  "@/app/blog/components/ArticleCard",
                  "@/app/blog/components/TaxonomyNav",
                  "@/components/ui/skeleton"]

exports:         ["default BlogThemePage"]

useBy:           []

userStories:     ["us4100004"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { listThemes } from "@/app/blog/lib/services/taxonomy";
import { searchArticles } from "@/app/blog/lib/services/search";
import { ArticleCard } from "@/app/blog/components/ArticleCard";
import { TaxonomyNav } from "@/app/blog/components/TaxonomyNav";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<{ slug: string }>;
type PageSearch = Promise<Record<string, string | undefined>>;

export default function BlogThemePage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: PageSearch;
}) {
  return (
    <Suspense fallback={<ThemeSkeleton />}>
      <ThemeSection params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ThemeSection({
  params,
  searchParams,
}: {
  readonly params: PageParams;
  readonly searchParams: PageSearch;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const themes = await listThemes();
  const theme = themes.find((t) => t.slug === slug);
  if (!theme) notFound();

  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const result = await searchArticles({
    themeSlug: slug,
    page,
    pageSize: 20,
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:py-14">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-1">
          Thème
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {theme.name}
        </h1>
        {theme.description && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {theme.description}
          </p>
        )}
        <TaxonomyNav themes={themes} activeThemeId={theme.id} />
      </header>

      {result.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun article publié dans ce thème pour l&apos;instant.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {result.totalPages > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: result.totalPages }).map((_, i) => {
            const p = i + 1;
            const active = p === result.page;
            return (
              <Link
                key={p}
                href={`/blog/theme/${slug}?page=${p}`}
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
  );
}

function ThemeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}