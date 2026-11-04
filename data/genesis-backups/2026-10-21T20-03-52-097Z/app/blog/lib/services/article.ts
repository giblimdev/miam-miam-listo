/*
path :           app/blog/lib/services/article.ts
tag :            ["blog", "service", "article", "content", "crud", "editorial"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD de l'article Blog. Gère le cycle de vie
                 complet : création (slug unique, readingTimeMin calculé,
                 order = max + 1), mise à jour (title, summary,
                 coverImage, taxonomie, tags, statut, visibilité,
                 featured, content[]), publication (renseigne
                 publishedAt une seule fois), archivage (préserve
                 commentaires, likes et favoris), suppression dure,
                 incrément de viewCount. Gère aussi les mutations fines
                 du content[] via les helpers d'arbre partagés
                 (insertBlock, moveBlock, removeBlock) : ajout d'un
                 bloc, mise à jour d'un bloc, déplacement (anti-cycle),
                 suppression récursive avec ses descendants. Toute
                 écriture passe par mutateBlog qui revalide le document
                 complet (dont l'arbre content[]).

flow:            listArticles() → readBlog().articles.
                 getArticleBySlug(slug) → find article.
                 getArticleById(id) → find article.
                 createArticle(input) → slug unique dans articles[] →
                 lecture des blocs (déjà structurés par l'éditeur :
                 id, parentId, order) → readingTimeMin via
                 computeReadingTimeMin → entité article complète (likedBy
                 [], comments [], viewCount 0, order max+1) → push.
                 updateArticle(id, input) → remplace les champs
                 modifiables → recalcule readingTimeMin → publishedAt
                 posé si status devient published et absent.
                 publishArticle(id) → status published + publishedAt
                 si absent.
                 archiveArticle(id) → status archived.
                 deleteArticle(id) → filter.
                 addContentBlock(articleId, block) → insertBlock.
                 updateContentBlock(articleId, blockId, patch) → map.
                 moveContentBlock(articleId, blockId, parentId, order) →
                 moveBlock.
                 removeContentBlock(articleId, blockId) → removeBlock
                 (retourne les ids retirés).
                 incrementViewCount(articleId) → viewCount + 1.

ecosystem:       BlogServices = [
                   "@/app/blog/lib/services/article.ts",
                   "@/app/blog/lib/services/comment.ts",
                   "@/app/blog/lib/services/discussion.ts",
                   "@/app/blog/lib/services/favorite.ts",
                   "@/app/blog/lib/services/group.ts",
                   "@/app/blog/lib/services/like.ts",
                   "@/app/blog/lib/services/notification.ts",
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
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { mutateBlog, readBlog } from "@/app/blog/lib/storage";
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
  const doc = await readBlog();
  return doc.articles;
}

export async function getArticleBySlug(
  slug: string,
): Promise<Article | null> {
  const doc = await readBlog();
  return doc.articles.find((a) => a.slug === slug) ?? null;
}

export async function getArticleById(id: string): Promise<Article | null> {
  const doc = await readBlog();
  return doc.articles.find((a) => a.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Création                                                          */
/* ------------------------------------------------------------------ */

export async function createArticle(
  authorId: string,
  input: ArticleInput,
): Promise<Article> {
  const id = newId();
  const createdAt = nowIso();
  const readingTimeMin = computeReadingTimeMin(input.content);
  const base = slugifyWithFallback(input.title, "article");
  let entity!: Article;

  await mutateBlog((doc) => {
    const slugs = new Set(doc.articles.map((a) => a.slug));
    return (async () => {
      const slug = await findFreeSlug(base, async (c) => slugs.has(c));
      entity = {
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
        order: doc.articles.length,
        content: input.content,
        comments: [],
        likedBy: [],
      };
      return { ...doc, articles: [...doc.articles, entity] };
    })();
  });

  return entity;
}

/* ------------------------------------------------------------------ */
/*  Mise à jour                                                       */
/* ------------------------------------------------------------------ */

export async function updateArticle(
  articleId: string,
  input: ArticleInput,
): Promise<Article> {
  const readingTimeMin = computeReadingTimeMin(input.content);
  let updated!: Article;

  await mutateBlog((doc) => {
    const articles = doc.articles.map((article) => {
      if (article.id !== articleId) return article;
      const publishedAt =
        input.status === "published" && !article.publishedAt
          ? nowIso()
          : article.publishedAt;
      updated = {
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
        updatedAt: nowIso(),
      };
      return updated;
    });
    return { ...doc, articles };
  });

  return updated;
}

/* ------------------------------------------------------------------ */
/*  Cycle de vie                                                      */
/* ------------------------------------------------------------------ */

export async function publishArticle(articleId: string): Promise<Article> {
  let updated!: Article;
  await mutateBlog((doc) => {
    const articles = doc.articles.map((article) => {
      if (article.id !== articleId) return article;
      updated = {
        ...article,
        status: "published",
        publishedAt: article.publishedAt ?? nowIso(),
        updatedAt: nowIso(),
      };
      return updated;
    });
    return { ...doc, articles };
  });
  return updated;
}

export async function archiveArticle(articleId: string): Promise<Article> {
  let updated!: Article;
  await mutateBlog((doc) => {
    const articles = doc.articles.map((article) => {
      if (article.id !== articleId) return article;
      updated = {
        ...article,
        status: "archived",
        updatedAt: nowIso(),
      };
      return updated;
    });
    return { ...doc, articles };
  });
  return updated;
}

export async function deleteArticle(articleId: string): Promise<void> {
  await mutateBlog((doc) => ({
    ...doc,
    articles: doc.articles.filter((a) => a.id !== articleId),
  }));
}

/* ------------------------------------------------------------------ */
/*  Mutations fines de content[]                                      */
/* ------------------------------------------------------------------ */

export async function addContentBlock(
  articleId: string,
  block: Omit<ContentBlock, "order">,
): Promise<Article> {
  let updated!: Article;
  await mutateBlog((doc) => {
    const articles = doc.articles.map((article) => {
      if (article.id !== articleId) return article;
      const content = insertBlock(article.content, block) as ContentBlock[];
      updated = {
        ...article,
        content,
        readingTimeMin: computeReadingTimeMin(content),
        updatedAt: nowIso(),
      };
      return updated;
    });
    return { ...doc, articles };
  });
  return updated;
}

export async function updateContentBlock(
  articleId: string,
  blockId: string,
  patch: Partial<ContentBlock>,
): Promise<Article> {
  let updated!: Article;
  await mutateBlog((doc) => {
    const articles = doc.articles.map((article) => {
      if (article.id !== articleId) return article;
      const content = article.content.map((b) =>
        b.id === blockId ? ({ ...b, ...patch } as ContentBlock) : b,
      );
      updated = {
        ...article,
        content,
        readingTimeMin: computeReadingTimeMin(content),
        updatedAt: nowIso(),
      };
      return updated;
    });
    return { ...doc, articles };
  });
  return updated;
}

export async function moveContentBlock(
  articleId: string,
  blockId: string,
  newParentId: string,
  newOrder: number,
): Promise<Article> {
  let updated!: Article;
  await mutateBlog((doc) => {
    const articles = doc.articles.map((article) => {
      if (article.id !== articleId) return article;
      const content = moveBlock(
        article.content,
        blockId,
        newParentId,
        newOrder,
      ) as ContentBlock[];
      updated = {
        ...article,
        content,
        updatedAt: nowIso(),
      };
      return updated;
    });
    return { ...doc, articles };
  });
  return updated;
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

  let updated!: Article;
  await mutateBlog((doc) => {
    const articles = doc.articles.map((article) => {
      if (article.id !== articleId) return article;
      updated = {
        ...article,
        content: after as ContentBlock[],
        readingTimeMin: computeReadingTimeMin(after as ContentBlock[]),
        updatedAt: nowIso(),
      };
      return updated;
    });
    return { ...doc, articles };
  });

  return { article: updated, removedIds };
}

/* ------------------------------------------------------------------ */
/*  Vues                                                              */
/* ------------------------------------------------------------------ */

export async function incrementViewCount(articleId: string): Promise<void> {
  await mutateBlog((doc) => ({
    ...doc,
    articles: doc.articles.map((a) =>
      a.id === articleId ? { ...a, viewCount: a.viewCount + 1 } : a,
    ),
  }));
}