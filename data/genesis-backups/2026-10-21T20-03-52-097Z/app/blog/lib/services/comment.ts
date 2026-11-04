/*
path :           app/blog/lib/services/comment.ts
tag :            ["blog", "service", "comment", "crud", "tree", "soft-delete"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD des commentaires d'article. Les commentaires
                 sont stockés en tableau plat sous article.comments[]
                 (parentId racine = article.id). Réutilise insertBlock,
                 moveBlock, removeBlock de @/app/blog/lib/tree. Soft delete
                 (deletedAt) pour modération non destructive. Profondeur
                 max 5. Toute écriture passe par mutateBlog (mutex +
                 atomicité + revalidation Zod).

flow:            listComments(articleId) → readBlog().articles[..].comments.
                 createComment(articleId, authorId, input) → vérifie parentId
                 résolvable + profondeur ≤ 5 → insertBlock (order = max+1)
                 → mutateBlog → retourne le commentaire créé.
                 softDeleteComment(articleId, commentId) → pose deletedAt
                 (conserve les réponses).
                 toggleLikeOnComment(articleId, commentId, userId) → push/filter
                 likedBy[] sous mutex → retourne { liked }.

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
                  "@/app/blog/lib/tree.ts",
                  "@/app/blog/lib/types.ts",
                  "@/app/blog/lib/validations.ts"]

imports:         ["@/app/blog/lib/storage",
                  "@/app/blog/lib/tree",
                  "@/app/blog/lib/types"]

exports:         ["listComments", "createComment", "softDeleteComment",
                  "toggleLikeOnComment"]

useBy:           ["@/app/blog/lib/actions/comment.ts",
                  "@/app/blog/lib/actions/like.ts"]

userStories:     ["us2100001", "us2100002", "us2100004"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { mutateBlog, readBlog } from "@/app/blog/lib/storage";
import { insertBlock } from "@/app/blog/lib/tree";
import type { Article, Comment, CommentInput } from "@/app/blog/lib/types";

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const MAX_DEPTH = 5;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

/**
 * Calcule la profondeur d'un commentaire dans l'arbre article.comments[].
 * Racine (parentId === article.id) → profondeur 0.
 * Lève si parentId est orphelin (pas article.id, pas un commentaire existant).
 */
function computeDepth(
  comments: readonly Comment[],
  commentId: string,
  rootId: string,
): number {
  const byId = new Map(comments.map((c) => [c.id, c]));
  let depth = 0;
  let current = byId.get(commentId)?.parentId;
  const seen = new Set<string>();
  while (current && current !== rootId) {
    if (seen.has(current)) break;
    seen.add(current);
    depth += 1;
    current = byId.get(current)?.parentId;
  }
  return depth;
}

function findArticle(doc: Awaited<ReturnType<typeof readBlog>>, articleId: string): Article {
  const article = doc.articles.find((a) => a.id === articleId);
  if (!article) {
    throw new Error(`[blog/comment] Article introuvable : ${articleId}`);
  }
  return article;
}

/* ------------------------------------------------------------------ */
/*  Lecture                                                            */
/* ------------------------------------------------------------------ */

export async function listComments(
  articleId: string,
): Promise<readonly Comment[]> {
  const doc = await readBlog();
  return findArticle(doc, articleId).comments;
}

/* ------------------------------------------------------------------ */
/*  Création                                                           */
/* ------------------------------------------------------------------ */

export async function createComment(
  articleId: string,
  authorId: string,
  input: CommentInput,
): Promise<Comment> {
  const createdAt = nowIso();
  let created!: Comment;

  await mutateBlog((doc) => {
    const articles = doc.articles.map((article) => {
      if (article.id !== articleId) return article;

      /* 1. parentId résolvable ? */
      const isRoot = input.parentId === article.id;
      const parentExists = article.comments.some((c) => c.id === input.parentId);
      if (!isRoot && !parentExists) {
        throw new Error(
          `[blog/comment] parentId orphelin : ${input.parentId}`,
        );
      }

      /* 2. Profondeur ≤ MAX_DEPTH (profondeur du parent + 1) */
      if (!isRoot) {
        const parentDepth = computeDepth(
          article.comments,
          input.parentId,
          article.id,
        );
        if (parentDepth + 1 > MAX_DEPTH) {
          throw new Error(
            `[blog/comment] Profondeur maximale dépassée (${MAX_DEPTH}).`,
          );
        }
      }

      created = {
        id: newId(),
        parentId: input.parentId,
        authorId,
        content: input.content,
        order: 0, // calculé par insertBlock
        createdAt,
        updatedAt: createdAt,
        deletedAt: undefined,
        likedBy: [],
      };

      const comments = insertBlock(article.comments, created);
      return { ...article, comments: [...comments] };
    });

    return { ...doc, articles };
  });

  return created;
}

/* ------------------------------------------------------------------ */
/*  Soft delete                                                        */
/* ------------------------------------------------------------------ */

export async function softDeleteComment(
  articleId: string,
  commentId: string,
): Promise<void> {
  await mutateBlog((doc) => ({
    ...doc,
    articles: doc.articles.map((article) => {
      if (article.id !== articleId) return article;
      const comments = article.comments.map((c) =>
        c.id === commentId
          ? { ...c, deletedAt: nowIso(), updatedAt: nowIso() }
          : c,
      );
      return { ...article, comments };
    }),
  }));
}

/* ------------------------------------------------------------------ */
/*  Like toggle sur commentaire                                        */
/* ------------------------------------------------------------------ */

export interface ToggleCommentLikeResult {
  readonly liked: boolean;
  readonly count: number;
}

export async function toggleLikeOnComment(
  articleId: string,
  commentId: string,
  userId: string,
): Promise<ToggleCommentLikeResult> {
  let result: ToggleCommentLikeResult = { liked: false, count: 0 };

  await mutateBlog((doc) => ({
    ...doc,
    articles: doc.articles.map((article) => {
      if (article.id !== articleId) return article;
      const comments = article.comments.map((c) => {
        if (c.id !== commentId) return c;
        const already = c.likedBy.includes(userId);
        const likedBy = already
          ? c.likedBy.filter((id) => id !== userId)
          : [...c.likedBy, userId];
        result = { liked: !already, count: likedBy.length };
        return { ...c, likedBy };
      });
      return { ...article, comments };
    }),
  }));

  return result;
}