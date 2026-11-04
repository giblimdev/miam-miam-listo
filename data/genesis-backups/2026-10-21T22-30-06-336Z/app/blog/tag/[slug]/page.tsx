/*
path :           app/blog/tag/[slug]/page.tsx
tag :            ["blog", "page", "taxonomy", "tag", "public"]
projectId:       new-genesis
type :           page
generic:         false

role:            Listing public d'un tag. Même pattern que
                 /blog/theme/[slug] mais filtré par tagSlug.
                 Affiche le nom + couleur du tag.

flow:            TagPage → Suspense → TagSection → listTags → find
                 → searchArticles({ tagSlugs: [slug] }) → rend.

ecosystem:       Blog = [
                   ... (identique à [slug]/page.tsx)
                 ]

relatedFiles:    ["@/app/blog/lib/services/taxonomy.ts",
                  "@/app/blog/lib/services/search.ts",
                  "@/app/blog/components/ArticleCard.tsx"]

imports:         ["react", "next/navigation", "next/link",
                  "@/app/blog/lib/services/taxonomy",
                  "@/app/blog/lib/services/search",
                  "@/app/blog/components/ArticleCard",
                  "@/components/ui/skeleton"]

exports:         ["default BlogTagPage"]

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

import { listTags } from "@/app/blog/lib/services/taxonomy";
import { searchArticles } from "@/app/blog/lib/services/search";
import { ArticleCard } from "@/app/blog/components/ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<{ slug: string }>;
type PageSearch = Promise<Record<string, string | undefined>>;

export default function BlogTagPage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: PageSearch;
}) {
  return (
    <Suspense fallback={<TagSkeleton />}>
      <TagSection params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function TagSection({
  params,
  searchParams,
}: {
  readonly params: PageParams;
  readonly searchParams: PageSearch;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tags = await listTags();
  const tag = tags.find((t) => t.slug === slug);
  if (!tag) notFound();

  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const result = await searchArticles({
    tagSlugs: [slug],
    page,
    pageSize: 20,
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:py-14">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-2">
          Tag
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {tag.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {result.total} article{result.total > 1 ? "s" : ""}
        </p>
      </header>

      {result.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun article publié avec ce tag.
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
                href={`/blog/tag/${slug}?page=${p}`}
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

function TagSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <Skeleton className="h-9 w-40" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}