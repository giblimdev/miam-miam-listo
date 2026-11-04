/*
path :           app/blog/theme/[slug]/[category]/[subCategory]/page.tsx
tag :            ["blog", "page", "taxonomy", "theme", "category", "subcategory", "public"]
projectId:       new-genesis
type :           page
generic:         false

role:            Listing public d'une sous-catégorie (niveau 3 de la
                 taxonomie). Sync page + Suspense ; résout le thème
                 et la catégorie parents par leur slug, puis la
                 sous-catégorie. Affiche un breadcrumb complet
                 (Thème > Catégorie > Sous-catégorie), la TaxonomyNav
                 avec la hiérarchie active, et les articles filtrés
                 sur subCategorySlug. 404 si l'un des slugs est
                 inconnu ou si la sous-catégorie n'appartient pas à
                 la catégorie. Pagination via ?page=.

flow:            SubCategoryPage (sync) →
                 <Suspense fallback=<SubCategorySkeleton />> →
                 <SubCategorySection params searchParams /> async →
                 await → listThemes → find theme by slug → si null 404
                 → find category by slug → si null 404 → find
                 subCategory → si null 404 →
                 searchArticles({ themeSlug, categorySlug,
                 subCategorySlug, page }) → rend breadcrumb +
                 TaxonomyNav + grille ArticleCard + pagination.

ecosystem:       Blog = [
                   "@/app/blog/[slug]/page.tsx",
                   "@/app/blog/admin/articles/[id]/edit/page.tsx",
                   "@/app/blog/admin/articles/new/page.tsx",
                   "@/app/blog/admin/articles/page.tsx",
                   "@/app/blog/admin/setup/page.tsx",
                   "@/app/blog/admin/taxonomy/page.tsx",
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
                   "@/app/blog/user/favorites/page.tsx",
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

exports:         ["default BlogSubCategoryPage"]

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

type PageParams = Promise<{
  slug: string;
  category: string;
  subCategory: string;
}>;
type PageSearch = Promise<Record<string, string | undefined>>;

export default function BlogSubCategoryPage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: PageSearch;
}) {
  return (
    <Suspense fallback={<SubCategorySkeleton />}>
      <SubCategorySection params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function SubCategorySection({
  params,
  searchParams,
}: {
  readonly params: PageParams;
  readonly searchParams: PageSearch;
}) {
  const { slug, category: categorySlug, subCategory: subCategorySlug } =
    await params;
  const sp = await searchParams;

  const themes = await listThemes();
  const theme = themes.find((t) => t.slug === slug);
  if (!theme) notFound();

  const category = theme.categories.find((c) => c.slug === categorySlug);
  if (!category) notFound();

  const subCategory = category.subCategories.find(
    (s) => s.slug === subCategorySlug,
  );
  if (!subCategory) notFound();

  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const result = await searchArticles({
    themeSlug: slug,
    categorySlug,
    subCategorySlug,
    page,
    pageSize: 20,
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:py-14">
      <header className="space-y-3">
        {/* Breadcrumb */}
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
          <Link
            href={`/blog/theme/${theme.slug}/${category.slug}`}
            className="hover:text-foreground"
          >
            {category.name}
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-foreground">{subCategory.name}</span>
        </nav>

        <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-3">
          Sous-catégorie
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {subCategory.name}
        </h1>
        {subCategory.description && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {subCategory.description}
          </p>
        )}

        <TaxonomyNav
          themes={themes}
          activeThemeId={theme.id}
          activeCategoryId={category.id}
          activeSubCategoryId={subCategory.id}
        />
      </header>

      {result.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun article publié dans cette sous-catégorie pour
            l&apos;instant.
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
            const href = `/blog/theme/${slug}/${categorySlug}/${subCategorySlug}?page=${p}`;
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

function SubCategorySkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <Skeleton className="h-4 w-64" />
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