/*
path :           app/blog/components/ArticleCard.tsx
tag :            ["blog", "component", "article", "card", "ui"]
projectId:       new-genesis
type :           component
generic:         false

role:            Carte d'article pour les listings (home, taxonomie,
                 recherche). Affiche couverture (ou placeholder gradient),
                 statut featured, titre, résumé, tags, date formatée,
                 temps de lecture. Server Component pur. Importe
                 resolveMediaUrl depuis @/app/blog/lib/media-url (module
                 client-safe) — plus aucune dépendance server-only.

flow:            Reçoit article + tagNames → rend <article> avec
                 <Link> vers /blog/[slug]. Aucun état.

ecosystem:       BlogUI = [
                   ... (identique à Livraison 1)
                 ]

relatedFiles:    ["@/app/blog/lib/types.ts",
                  "@/app/blog/lib/media-url.ts"]

imports:         ["next/link", "lucide-react",
                  "@/app/blog/lib/types",
                  "@/app/blog/lib/media-url"]

exports:         ["ArticleCard", "ArticleCardProps"]

useBy:           ["@/app/blog/page.tsx",
                  "@/app/blog/search/page.tsx",
                  "@/app/blog/theme/[slug]/page.tsx",
                  "@/app/blog/theme/[slug]/[category]/[subCategory]/page.tsx",
                  "@/app/blog/tag/[slug]/page.tsx"]

userStories:     ["us4100001", "us4100002", "us4100004"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import Link from "next/link";
import { Calendar, Clock, Eye, Sparkles, Tag as TagIcon } from "lucide-react";

import type { Article } from "@/app/blog/lib/types";
import { resolveMediaUrl } from "@/app/blog/lib/media-url";

export interface ArticleCardProps {
  readonly article: Article;
  readonly tagNames?: readonly string[];
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ArticleCard({ article, tagNames = [] }: ArticleCardProps) {
  const cover = article.coverImage
    ? resolveMediaUrl(article.coverImage)
    : undefined;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow duration-300 hover:shadow-xl">
      <Link
        href={`/blog/${article.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-chart-1/15 via-chart-2/15 to-chart-3/15">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-chart-2">
              <Sparkles className="size-10" aria-hidden />
            </div>
          )}
          {article.featured && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-chart-2 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
              <Sparkles className="size-3" aria-hidden />
              À la une
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          {tagNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tagNames.slice(0, 2).map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 rounded-full bg-chart-2/10 px-2 py-0.5 text-[11px] font-medium text-chart-2"
                >
                  <TagIcon className="size-3" aria-hidden />
                  {name}
                </span>
              ))}
              {tagNames.length > 2 && (
                <span className="text-[11px] text-muted-foreground">
                  +{tagNames.length - 2}
                </span>
              )}
            </div>
          )}

          <h2 className="line-clamp-2 text-lg font-bold tracking-tight text-foreground">
            {article.title}
          </h2>

          <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
            {article.summary}
          </p>

          <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {article.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" aria-hidden />
                {formatDate(article.publishedAt)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden />
              {article.readingTimeMin} min
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5" aria-hidden />
              {article.viewCount}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}