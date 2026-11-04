/*
path :           app/blog/lib/services/article.ts
tag :            ["blog", "service", "article", "crud", "editorial", "split-files", "taxonomy", "validate", "import"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD des articles, basé sur 1 fichier par article
                 (data/blog/[slug].json). Depuis les splits successifs :

                 - `createArticle` appelle `validateArticleTaxonomy` AVANT
                   `withGlobalArticleLock` : si themeId / categoryId /
                   subCategoryId / tagIds référencent des entités absentes
                   de data/blog/taxonomy.json, on throw AVANT d'écrire quoi
                   que ce soit.
                 - `createArticle` accepte `options.id` optionnel : permet à
                   l'import JSON (article-import.ts) de pré-générer l'id
                   pour normaliser les blocs (parentId = id d'article)
                   AVANT l'écriture, évitant 2 writes successifs. Seul
                   l'import utilise cette option — les appels standards
                   laissent createArticle générer l'id.
                 - `updateArticle` ne revalide PAS la taxonomie : un article
                   existant peut avoir des références orphelines (thème
                   supprimé, tag renommé). On préserve l'existant pour ne
                   pas bloquer l'auteur qui corrige son contenu. L'UI
                   affiche la référence manquante, à l'auteur de la corriger.
                 - Toutes les mutations (publish, archive, incrementViewCount,
                   content[] fine-grained) passent par mutateArticleFile
                   (mutex PAR SLUG — deux articles mutent en parallèle).

flow:            listArticles → listArticleFiles.
                 getArticleBySlug(slug) → readArticleFile.
                 getArticleById(id) → listArticleFiles → find (O(n)).
                 createArticle(authorId, input, options?) →
                 validateArticleTaxonomy → withGlobalArticleLock → slug
                 unique → writeArticleFile.
                 updateArticle / publish / archive / delete /
                 incrementViewCount / addContentBlock / updateContentBlock /
                 moveContentBlock / removeContentBlock →
                 getArticleById → mutateArticleFile (mutex par slug).

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
                  "@/app/blog/lib/services/taxonomy.ts",
                  "@/app/blog/lib/tree.ts",
                  "@/app/blog/lib/types.ts",
                  "@/app/blog/lib/utils/reading-time.ts",
                  "@/utils/slugify.ts",
                  "@/utils/slug.ts"]

imports:         ["@/app/blog/lib/storage",
                  "@/app/blog/lib/services/taxonomy",
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
                  "incrementViewCount",
                  "CreateArticleOptions"]

useBy:           ["@/app/blog/lib/actions/article.ts",
                  "@/app/blog/lib/actions/article-import.ts",
                  "@/app/blog/lib/services/search.ts"]

userStories:     ["us1100005", "us1100006", "us1100007",
                  "*en tant qu'auteur je veux que mes articles soient liés à une taxonomie valide",
                  "*en tant qu'auteur je veux importer un article depuis un JSON généré par une IA"]

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
import { validateArticleTaxonomy } from "@/app/blog/lib/services/taxonomy";
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
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/**
 * Options de création.
 * - `id` : force l'identifiant de l'article (utilisé par l'import JSON
 *   pour normaliser les blocs — parentId = id — avant l'écriture).
 *   Absent → createArticle génère un UUID.
 */
export interface CreateArticleOptions {
  readonly id?: string;
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
 * O(n) — scanne tous les data/blog/[slug].json.
 * Si le volume augmente, maintenir data/blog/_by-id.json.
 */
export async function getArticleById(id: string): Promise<Article | null> {
  const all = await listArticleFiles();
  return all.find((a) => a.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Création — valide la taxonomie AVANT le lock                      */
/* ------------------------------------------------------------------ */

export async function createArticle(
  authorId: string,
  input: ArticleInput,
  options?: CreateArticleOptions,
): Promise<Article> {
  /* 1. Valide la taxonomie (thème/catégorie/subCat/tags doivent exister).
     Fait AVANT withGlobalArticleLock : si invalide, on ne bloque pas
     le mutex global inutilement. */
  await validateArticleTaxonomy({
    themeId: input.themeId,
    categoryId: input.categoryId,
    subCategoryId: input.subCategoryId,
    tagIds: input.tagIds,
  });

  /* 2. Création sous lock global (attribution d'order atomique). */
  return withGlobalArticleLock(async () => {
    /* options.id permet à l'import JSON de pré-générer l'id (normalisation
       des blocs → parentId = id). Sans cette option, UUID généré ici. */
    const id = options?.id ?? newId();
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
/*  Mise à jour — ne revalide PAS la taxonomie                       */
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
/*  Vues                                                              */
/* ------------------------------------------------------------------ */

export async function incrementViewCount(articleId: string): Promise<void> {
  const current = await getArticleById(articleId);
  if (!current) return;
  await mutateArticleFile(current.slug, (article) => ({
    ...article,
    viewCount: article.viewCount + 1,
  }));
}