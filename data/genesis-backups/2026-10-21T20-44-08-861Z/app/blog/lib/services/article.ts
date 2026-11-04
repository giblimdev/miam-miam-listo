/*
path :           app/blog/lib/services/article.ts
tag :            ["blog", "service", "article", "content", "crud", "editorial", "split-files"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD de l'article Blog, désormais basé sur UN
                 FICHIER PAR ARTICLE (data/blog/[slug].json) au lieu du
                 tableau articles[] de data/blog.json.

                 - listArticles / getArticleBySlug / getArticleById : lecture.
                 - createArticle : sérialise l'attribution d'`order` via
                   withGlobalArticleLock puis writeArticleFile.
                 - updateArticle / publishArticle / archiveArticle /
                   incrementViewCount / mutations fines de content[] :
                   passent par mutateArticleFile (mutex PAR article — deux
                   articles différents mutent en parallèle).
                 - deleteArticle : deleteArticleFile.

                 `getArticleById` est O(n) — il scanne tous les fichiers
                 [slug].json (n petit en local). Si le volume explose :
                 ajouter un index id→slug maintenu par create/delete.

flow:            listArticles → listArticleFiles.
                 getArticleBySlug(slug) → readArticleFile.
                 getArticleById(id) → listArticleFiles → find.
                 createArticle(authorId, input) → withGlobalArticleLock →
                 slug unique via findFreeSlug sur les slugs existants →
                 writeArticleFile.
                 updateArticle(id, input) → getArticleById → mutateArticleFile.
                 publish / archive / delete / incrementViewCount → idem.
                 addContentBlock / updateContentBlock / moveContentBlock /
                 removeContentBlock → getArticleById → mutateArticleFile.

ecosystem:       BlogServices = [
                   "@/app/blog/lib/services/article.ts",
                   "@/app/blog/lib/services/author.ts",
                   "@/app/blog/lib/services/comment.ts",
                   "@/app/blog/lib/services/favorite.ts",
                   "@/app/blog/lib/services/group.ts",
                   "@/app/blog/lib/services/like.ts",
                   "@/app/blog/lib/services/notification.ts",
                   "@/app/blog/lib/services/playlist.ts",
                   "@/app/blog/lib/services/search.ts",
                   "@/app/blog/lib/services/taxonomy.ts",
                 ]

relatedFiles:    ["@/app/blog/lib/storage.ts",
                  "@/app/blog/lib/tree.ts",
                  "@/app/blog/lib/types.ts",
                  "@/app/blog/lib/utils/reading-time.ts",
                  "@/utils/slugify.ts",
                  "@/utils/slug.ts"]

imports:         ["@/app/blog/lib/storage",
                  "@/app/blog/lib/tree",
                  "@/app/blog/lib/types",
                  "@/app/blog/lib/utils/reading-time",
                  "@/utils/slugify",
                  "@/utils/slug"]

exports:         ["listArticles", "getArticleBySlug", "getArticleById",
                  "createArticle", "updateArticle", "publishArticle",
                  "archiveArticle", "deleteArticle",
                  "addContentBlock", "updateContentBlock",
                  "moveContentBlock", "removeContentBlock",
                  "incrementViewCount"]

useBy:           ["@/app/blog/lib/actions/article.ts"]

userStories:     ["us1100005", "us1100006", "us1100007"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import {
  deleteArticleFile,
  listArticleFiles,
  mutateArticleFile,
  readArticleFile,
  withGlobalArticleLock,
  writeArticleFile,
} from "@/app/blog/lib/storage";
import {
  insertBlock,
  moveBlock,
  removeBlock,
} from "@/app/blog/lib/tree";
import type {
  Article,
  ArticleInput,
  ContentBlock,
} from "@/app/blog/lib/types";
import { computeReadingTimeMin } from "@/app/blog/lib/utils/reading-time";
import { findFreeSlug } from "@/utils/slug";
import { slugifyWithFallback } from "@/utils/slugify";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

/* ------------------------------------------------------------------ */
/*  Lecture                                                           */
/* ------------------------------------------------------------------ */

export async function listArticles(): Promise<readonly Article[]> {
  return listArticleFiles();
}

export async function getArticleBySlug(
  slug: string,
): Promise<Article | null> {
  return readArticleFile(slug);
}

/**
 * O(n) — scanne tous les fichiers data/blog/[slug].json. Acceptable pour
 * un blog local ; si le volume augmente, maintenir un index id→slug dans
 * data/blog/_by-id.json (écrit par createArticle/deleteArticle).
 */
export async function getArticleById(id: string): Promise<Article | null> {
  const all = await listArticleFiles();
  return all.find((a) => a.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Création (order sérialisé via withGlobalArticleLock)             */
/* ------------------------------------------------------------------ */

export async function createArticle(
  authorId: string,
  input: ArticleInput,
): Promise<Article> {
  return withGlobalArticleLock(async () => {
    const id = newId();
    const createdAt = nowIso();
    const readingTimeMin = computeReadingTimeMin(input.content);
    const base = slugifyWithFallback(input.title, "article");

    const existing = await listArticleFiles();
    const slugs = new Set(existing.map((a) => a.slug));
    const slug = await findFreeSlug(base, async (c) => slugs.has(c));

    const article: Article = {
      id,
      slug,
      title: input.title,
      summary: input.summary,
      coverImage: input.coverImage,
      readingTimeMin,
      viewCount: 0,
      featured: input.featured,
      authorId,
      themeId: input.themeId,
      categoryId: input.categoryId,
      subCategoryId: input.subCategoryId,
      tagIds: input.tagIds,
      status: input.status,
      visibility: input.visibility,
      publishedAt: input.status === "published" ? createdAt : undefined,
      createdAt,
      updatedAt: createdAt,
      order: existing.length,
      content: input.content,
      comments: [],
      likedBy: [],
    };

    await writeArticleFile(article);
    return article;
  });
}

/* ------------------------------------------------------------------ */
/*  Mise à jour                                                       */
/* ------------------------------------------------------------------ */

export async function updateArticle(
  articleId: string,
  input: ArticleInput,
): Promise<Article> {
  const current = await getArticleById(articleId);
  if (!current) throw new Error(`Article introuvable : ${articleId}`);

  const readingTimeMin = computeReadingTimeMin(input.content);

  return mutateArticleFile(current.slug, (article) => {
    const publishedAt =
      input.status === "published" && !article.publishedAt
        ? nowIso()
        : article.publishedAt;
    return {
      ...article,
      title: input.title,
      summary: input.summary,
      coverImage: input.coverImage,
      readingTimeMin,
      featured: input.featured,
      themeId: input.themeId,
      categoryId: input.categoryId,
      subCategoryId: input.subCategoryId,
      tagIds: input.tagIds,
      status: input.status,
      visibility: input.visibility,
      publishedAt,
      content: input.content,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Cycle de vie                                                      */
/* ------------------------------------------------------------------ */

export async function publishArticle(articleId: string): Promise<Article> {
  const current = await getArticleById(articleId);
  if (!current) throw new Error(`Article introuvable : ${articleId}`);

  return mutateArticleFile(current.slug, (article) => ({
    ...article,
    status: "published",
    publishedAt: article.publishedAt ?? nowIso(),
  }));
}

export async function archiveArticle(articleId: string): Promise<Article> {
  const current = await getArticleById(articleId);
  if (!current) throw new Error(`Article introuvable : ${articleId}`);

  return mutateArticleFile(current.slug, (article) => ({
    ...article,
    status: "archived",
  }));
}

export async function deleteArticle(articleId: string): Promise<void> {
  const current = await getArticleById(articleId);
  if (!current) return;
  await deleteArticleFile(current.slug);
}

/* ------------------------------------------------------------------ */
/*  Mutations fines de content[]                                     */
/* ------------------------------------------------------------------ */

export async function addContentBlock(
  articleId: string,
  block: Omit<ContentBlock, "order">,
): Promise<Article> {
  const current = await getArticleById(articleId);
  if (!current) throw new Error(`Article introuvable : ${articleId}`);

  return mutateArticleFile(current.slug, (article) => {
    const content = insertBlock(article.content, block) as ContentBlock[];
    return {
      ...article,
      content,
      readingTimeMin: computeReadingTimeMin(content),
    };
  });
}

export async function updateContentBlock(
  articleId: string,
  blockId: string,
  patch: Partial<ContentBlock>,
): Promise<Article> {
  const current = await getArticleById(articleId);
  if (!current) throw new Error(`Article introuvable : ${articleId}`);

  return mutateArticleFile(current.slug, (article) => {
    const content = article.content.map((b) =>
      b.id === blockId ? ({ ...b, ...patch } as ContentBlock) : b,
    );
    return {
      ...article,
      content,
      readingTimeMin: computeReadingTimeMin(content),
    };
  });
}

export async function moveContentBlock(
  articleId: string,
  blockId: string,
  newParentId: string,
  newOrder: number,
): Promise<Article> {
  const current = await getArticleById(articleId);
  if (!current) throw new Error(`Article introuvable : ${articleId}`);

  return mutateArticleFile(current.slug, (article) => {
    const content = moveBlock(
      article.content,
      blockId,
      newParentId,
      newOrder,
    ) as ContentBlock[];
    return { ...article, content };
  });
}

export async function removeContentBlock(
  articleId: string,
  blockId: string,
): Promise<{ article: Article; removedIds: readonly string[] }> {
  const before = await getArticleById(articleId);
  if (!before) throw new Error(`Article introuvable : ${articleId}`);

  const after = removeBlock(before.content, blockId);
  const afterIds = new Set(after.map((b) => b.id));
  const removedIds = before.content
    .filter((b) => !afterIds.has(b.id))
    .map((b) => b.id);

  const updated = await mutateArticleFile(before.slug, (article) => ({
    ...article,
    content: after as ContentBlock[],
    readingTimeMin: computeReadingTimeMin(after as ContentBlock[]),
  }));

  return { article: updated, removedIds };
}

/* ------------------------------------------------------------------ */
/*  Vues (n'écrit QUE le fichier de l'article concerné)               */
/* ------------------------------------------------------------------ */

export async function incrementViewCount(articleId: string): Promise<void> {
  const current = await getArticleById(articleId);
  if (!current) return;
  await mutateArticleFile(current.slug, (article) => ({
    ...article,
    viewCount: article.viewCount + 1,
  }));
}