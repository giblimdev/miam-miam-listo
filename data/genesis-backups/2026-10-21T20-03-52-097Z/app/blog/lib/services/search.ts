/*
path :           app/blog/lib/services/search.ts
tag :            ["blog", "service", "search", "filter", "in-memory"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service de recherche et filtres, 100 % en mémoire sur
                 le document JSON. Recherche plein texte insensible à la
                 casse et aux accents (helper normalizeToLowercase) sur
                 title + summary + texte des blocs paragraph du content[].
                 Filtres combinables : themeSlug, categorySlug,
                 subCategorySlug, tagSlugs[], authorId, featured, période
                 (from/to ISO). Seuls les articles published +
                 visibility=public (ou unlisted si authorId = viewer)
                 sont retournés. Pagination applicative. Aucun index
                 externe.

flow:            searchArticles(query) → lit le document → filtre
                 published+public → applique q (title/summary/blocs)
                 → applique chaque filtre → tri publishedAt DESC →
                 pagine (page, pageSize) → retourne { items, total,
                 page, pageSize, totalPages }.

ecosystem:       BlogServices = [
                   "@/app/blog/lib/services/article.ts",
                   "@/app/blog/lib/services/comment.ts",
                   "@/app/blog/lib/services/favorite.ts",
                   "@/app/blog/lib/services/group.ts",
                   "@/app/blog/lib/services/like.ts",
                   "@/app/blog/lib/services/notification.ts",
                   "@/app/blog/lib/services/search.ts",
                   "@/app/blog/lib/services/taxonomy.ts",
                 ]

relatedFiles:    ["@/app/blog/lib/storage.ts",
                  "@/app/blog/lib/types.ts",
                  "@/utils/normalizeToLowercase.ts"]

imports:         ["@/app/blog/lib/storage",
                  "@/app/blog/lib/types",
                  "@/utils/normalizeToLowercase"]

exports:         ["searchArticles", "SearchQuery", "SearchResult",
                  "collectParagraphText"]

useBy:           ["@/app/blog/[slug]/page.tsx",
                  "@/app/blog/search/page.tsx",
                  "@/app/blog/theme/[slug]/page.tsx",
                  "@/app/blog/tag/[slug]/page.tsx"]

userStories:     ["us4100001", "us4100002", "us4100004"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { readBlog } from "@/app/blog/lib/storage";
import type { Article, ContentBlock } from "@/app/blog/lib/types";
import { normalizeToLowercase } from "@/utils/normalizeToLowercase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SearchQuery {
  readonly q?: string;
  readonly themeSlug?: string;
  readonly categorySlug?: string;
  readonly subCategorySlug?: string;
  readonly tagSlugs?: readonly string[];
  readonly authorId?: string;
  readonly featured?: boolean;
  readonly from?: string; // ISO
  readonly to?: string; // ISO
  readonly page?: number;
  readonly pageSize?: number;
}

export interface SearchResult {
  readonly items: readonly Article[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_PAGE_SIZE = 20;

export function collectParagraphText(
  blocks: readonly ContentBlock[],
): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type === "paragraph") parts.push(b.text);
  }
  return parts.join(" ");
}

function articleMatchesText(article: Article, needle: string): boolean {
  if (needle.length === 0) return true;
  const haystack = [
    article.title,
    article.summary,
    collectParagraphText(article.content),
  ]
    .map(normalizeToLowercase)
    .join(" \u0001 ");
  return haystack.includes(needle);
}

/* ------------------------------------------------------------------ */
/*  Résolution taxonomie (slug → id)                                   */
/* ------------------------------------------------------------------ */

interface TaxonomyIndex {
  readonly themeIdBySlug: ReadonlyMap<string, string>;
  readonly categoryIdBySlug: ReadonlyMap<string, string>;
  readonly subCategoryIdBySlug: ReadonlyMap<string, string>;
  readonly tagIdBySlug: ReadonlyMap<string, string>;
}

function buildTaxonomyIndex(
  taxonomy: Awaited<ReturnType<typeof readBlog>>["taxonomy"],
): TaxonomyIndex {
  const themeIdBySlug = new Map<string, string>();
  const categoryIdBySlug = new Map<string, string>();
  const subCategoryIdBySlug = new Map<string, string>();
  const tagIdBySlug = new Map<string, string>();

  for (const theme of taxonomy.themes) {
    themeIdBySlug.set(theme.slug, theme.id);
    for (const cat of theme.categories) {
      categoryIdBySlug.set(cat.slug, cat.id);
      for (const sub of cat.subCategories) {
        subCategoryIdBySlug.set(sub.slug, sub.id);
      }
    }
  }
  for (const tag of taxonomy.tags) tagIdBySlug.set(tag.slug, tag.id);

  return {
    themeIdBySlug,
    categoryIdBySlug,
    subCategoryIdBySlug,
    tagIdBySlug,
  };
}

/* ------------------------------------------------------------------ */
/*  Recherche                                                          */
/* ------------------------------------------------------------------ */

export async function searchArticles(
  query: SearchQuery,
): Promise<SearchResult> {
  const doc = await readBlog();
  const index = buildTaxonomyIndex(doc.taxonomy);

  const q = normalizeToLowercase(query.q ?? "");
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE);

  const themeId = query.themeSlug
    ? index.themeIdBySlug.get(query.themeSlug)
    : undefined;
  const categoryId = query.categorySlug
    ? index.categoryIdBySlug.get(query.categorySlug)
    : undefined;
  const subCategoryId = query.subCategorySlug
    ? index.subCategoryIdBySlug.get(query.subCategorySlug)
    : undefined;
  const tagIds = (query.tagSlugs ?? [])
    .map((slug) => index.tagIdBySlug.get(slug))
    .filter((id): id is string => Boolean(id));

  const fromTs = query.from ? Date.parse(query.from) : undefined;
  const toTs = query.to ? Date.parse(query.to) : undefined;

  const filtered = doc.articles.filter((article) => {
    /* published + visibilité publique uniquement (sauf auteur) */
    if (article.status !== "published") return false;
    const isAuthor = query.authorId && article.authorId === query.authorId;
    if (!isAuthor && article.visibility !== "public") return false;

    if (!articleMatchesText(article, q)) return false;
    if (themeId && article.themeId !== themeId) return false;
    if (categoryId && article.categoryId !== categoryId) return false;
    if (subCategoryId && article.subCategoryId !== subCategoryId) return false;
    if (tagIds.length > 0) {
      const hasAll = tagIds.every((id) => article.tagIds.includes(id));
      if (!hasAll) return false;
    }
    if (query.authorId && article.authorId !== query.authorId) return false;
    if (query.featured !== undefined && article.featured !== query.featured)
      return false;
    if (fromTs !== undefined && article.publishedAt) {
      const t = Date.parse(article.publishedAt);
      if (!Number.isFinite(t) || t < fromTs) return false;
    }
    if (toTs !== undefined && article.publishedAt) {
      const t = Date.parse(article.publishedAt);
      if (!Number.isFinite(t) || t > toTs) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta; // DESC
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);

  return { items, total, page: safePage, pageSize, totalPages };
}