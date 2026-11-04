/*
path :           app/blog/theme/[slug]/[category]/page.tsx
tag :            ["blog", "page", "taxonomy", "theme", "category", "public"]
projectId:       new-genesis
type :           page
generic:         false

role:            Listing public d'une catégorie (niveau 2 de la
                 taxonomie). Sync page + Suspense ; résout le thème
                 parent par slug, puis la catégorie. Affiche un
                 breadcrumb (Thème > Catégorie), la TaxonomyNav avec
                 la hiérarchie active, et les articles filtrés sur
                 categorySlug. 404 si l'un des slugs est inconnu ou si
                 la catégorie n'appartient pas au thème. Pagination
                 via ?page=.

flow:            CategoryPage → Suspense → CategorySection →
                 await → listThemes → find theme → si null 404 →
                 find category → si null 404 →
                 searchArticles({ themeSlug, categorySlug, page }) →
                 rend breadcrumb + TaxonomyNav + grille + pagination.

ecosystem:       Blog = [
                   ... (identique à la page subCategory)
                 ]

relatedFiles:    ["@/app/blog/lib/services/taxonomy.ts",
                  "@/app/blog/lib/services/search.ts",
                  "@/app/blog/components/ArticleCard.tsx",
                  "@/app/blog/components/TaxonomyNav.tsx"]

imports:         ["react", "next/navigation", "next/link", "lucide-react",
                  "@/app/blog/lib/services/taxonomy",
                  "@/app/blog/lib/services/search",
                  "@/app/blog/components/ArticleCard",
                  "@/app/blog/components/TaxonomyNav",
                  "@/components/ui/skeleton"]

exports:         ["default BlogCategoryPage"]

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
import { ChevronRight } from "lucide-react";

import { listThemes } from "@/app/blog/lib/services/taxonomy";
import { searchArticles } from "@/app/blog/lib/services/search";
import { ArticleCard } from "@/app/blog/components/ArticleCard";
import { TaxonomyNav } from "@/app/blog/components/TaxonomyNav";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<{ slug: string; category: string }>;
type PageSearch = Promise<Record<string, string | undefined>>;

export default function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: PageSearch;
}) {
  return (
    <Suspense fallback={<CategorySkeleton />}>
      <CategorySection params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CategorySection({
  params,
  searchParams,
}: {
  readonly params: PageParams;
  readonly searchParams: PageSearch;
}) {
  const { slug, category: categorySlug } = await params;
  const sp = await searchParams;

  const themes = await listThemes();
  const theme = themes.find((t) => t.slug === slug);
  if (!theme) notFound();

  const category = theme.categories.find((c) => c.slug === categorySlug);
  if (!category) notFound();

  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const result = await searchArticles({
    themeSlug: slug,
    categorySlug,
    page,
    pageSize: 20,
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:py-14">
      <header className="space-y-3">
        <nav
          aria-label="Fil d'Ariane"
          className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        >
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <Link
            href={`/blog/theme/${theme.slug}`}
            className="hover:text-foreground"
          >
            {theme.name}
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-foreground">{category.name}</span>
        </nav>

        <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-2">
          Catégorie
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {category.name}
        </h1>
        {category.description && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {category.description}
          </p>
        )}

        <TaxonomyNav
          themes={themes}
          activeThemeId={theme.id}
          activeCategoryId={category.id}
        />
      </header>

      {result.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun article publié dans cette catégorie pour l&apos;instant.
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
            const href = `/blog/theme/${slug}/${categorySlug}?page=${p}`;
            return (
              <Link
                key={p}
                href={href}
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

function CategorySkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}