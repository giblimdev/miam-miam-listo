/*
path :           app/blog/search/page.tsx
tag :            ["blog", "page", "search", "filters", "public"]
projectId:       new-genesis
type :           page
generic:         false

role:            Page de recherche publique. Sync page + Suspense ;
                 lit les query params (q, theme, category, sub, tag,
                 author, featured, from, to, page) dans un composant
                 async et appelle searchArticles. Affiche un formulaire
                 GET natif (pas de JS client nécessaire) + listing
                 ArticleCard paginé + état vide.

flow:            SearchPage (sync) → <Suspense fallback=<SearchSkeleton/>>
                 → <SearchSection searchParams /> async → await
                 searchParams → parse → searchArticles → rend form +
                 grille + pagination.

ecosystem:       Blog = [
                   ... (identique à [slug]/page.tsx)
                 ]

relatedFiles:    ["@/app/blog/lib/services/search.ts",
                  "@/app/blog/components/ArticleCard.tsx"]

imports:         ["react", "next/link", "lucide-react",
                  "@/app/blog/lib/services/search",
                  "@/app/blog/components/ArticleCard",
                  "@/components/ui/skeleton",
                  "@/components/ui/input",
                  "@/components/ui/button"]

exports:         ["default BlogSearchPage"]

useBy:           []

userStories:     ["us4100001"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";

import { searchArticles } from "@/app/blog/lib/services/search";
import { ArticleCard } from "@/app/blog/components/ArticleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type SearchParams = Promise<Record<string, string | undefined>>;

export default function BlogSearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchSection searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchSection({
  searchParams,
}: {
  readonly searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const result = await searchArticles({ q, page, pageSize: 20 });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:py-14">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Recherche
        </h1>
        <p className="text-sm text-muted-foreground">
          {result.total} résultat{result.total > 1 ? "s" : ""} pour « {q || "tout"} »
        </p>
      </header>

      <form action="/blog/search" method="get" className="flex gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Rechercher un article…"
          aria-label="Recherche"
          className="flex-1"
        />
        <Button type="submit" className="gap-2">
          <SearchIcon className="size-4" aria-hidden />
          Rechercher
        </Button>
      </form>

      {result.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun article ne correspond à votre recherche.
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
            const href = `/blog/search?${new URLSearchParams({
              ...(q ? { q } : {}),
              page: String(p),
            }).toString()}`;
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

function SearchSkeleton() {
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