/*
path :           app/blog/lib/services/comment.ts
tag :            ["blog", "service", "comment", "crud", "tree", "soft-delete", "split-files"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD des commentaires, désormais stockés DANS
                 l'article (article.comments[] dans data/blog/[slug].json).
                 Chaque mutation de commentaire ne réécrit que le fichier
                 de l'article concerné — pas le document résiduel. Utilise
                 mutateArticleFile (mutex PAR article), donc deux articles
                 différents peuvent recevoir des commentaires en parallèle.

                 Mêmes règles qu'avant : parentId racine = article.id,
                 profondeur ≤ 5, soft delete non destructif, helpers
                 d'arbre partagés (insertBlock).

flow:            listComments(articleId) → getArticleById → comments[].
                 createComment(articleId, authorId, input) → getArticleById
                 → mutateArticleFile → valide parentId + profondeur ≤ 5 →
                 insertBlock → retourne le commentaire créé.
                 softDeleteComment(articleId, commentId) → getArticleById →
                 mutateArticleFile → pose deletedAt.
                 toggleLikeOnComment(articleId, commentId, userId) →
                 getArticleById → mutateArticleFile → push/filter likedBy.

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
                  "@/app/blog/lib/services/article.ts"]

imports:         ["@/app/blog/lib/storage",
                  "@/app/blog/lib/tree",
                  "@/app/blog/lib/types",
                  "@/app/blog/lib/services/article"]

exports:         ["listComments", "createComment", "softDeleteComment",
                  "toggleLikeOnComment"]

useBy:           ["@/app/blog/lib/actions/comment.ts",
                  "@/app/blog/lib/actions/like.ts"]

userStories:     ["us2100001", "us2100002", "us2100004"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { mutateArticleFile } from "@/app/blog/lib/storage";
import { insertBlock } from "@/app/blog/lib/tree";
import type { Article, Comment, CommentInput } from "@/app/blog/lib/types";
import { getArticleById } from "@/app/blog/lib/services/article";

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */

const MAX_DEPTH = 5;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

/**
 * Calcule la profondeur d'un commentaire dans article.comments[].
 * Racine (parentId === article.id) → profondeur 0.
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

async function requireArticle(articleId: string): Promise<Article> {
  const article = await getArticleById(articleId);
  if (!article) {
    throw new Error(`[blog/comment] Article introuvable : ${articleId}`);
  }
  return article;
}

/* ------------------------------------------------------------------ */
/*  Lecture                                                           */
/* ------------------------------------------------------------------ */

export async function listComments(
  articleId: string,
): Promise<readonly Comment[]> {
  const article = await requireArticle(articleId);
  return article.comments;
}

/* ------------------------------------------------------------------ */
/*  Création                                                          */
/* ------------------------------------------------------------------ */

export async function createComment(
  articleId: string,
  authorId: string,
  input: CommentInput,
): Promise<Comment> {
  const article = await requireArticle(articleId);
  const createdAt = nowIso();
  let created!: Comment;

  await mutateArticleFile(article.slug, (current) => {
    /* 1. parentId résolvable ? */
    const isRoot = input.parentId === current.id;
    const parentExists = current.comments.some((c) => c.id === input.parentId);
    if (!isRoot && !parentExists) {
      throw new Error(
        `[blog/comment] parentId orphelin : ${input.parentId}`,
      );
    }

    /* 2. Profondeur ≤ MAX_DEPTH (profondeur du parent + 1) */
    if (!isRoot) {
      const parentDepth = computeDepth(
        current.comments,
        input.parentId,
        current.id,
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
      order: 0,
      createdAt,
      updatedAt: createdAt,
      deletedAt: undefined,
      likedBy: [],
    };

    const comments = insertBlock(current.comments, created);
    return { ...current, comments: [...comments] };
  });

  return created;
}

/* ------------------------------------------------------------------ */
/*  Soft delete                                                       */
/* ------------------------------------------------------------------ */

export async function softDeleteComment(
  articleId: string,
  commentId: string,
): Promise<void> {
  const article = await requireArticle(articleId);

  await mutateArticleFile(article.slug, (current) => ({
    ...current,
    comments: current.comments.map((c) =>
      c.id === commentId
        ? { ...c, deletedAt: nowIso(), updatedAt: nowIso() }
        : c,
    ),
  }));
}

/* ------------------------------------------------------------------ */
/*  Like toggle sur commentaire                                       */
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
  const article = await requireArticle(articleId);
  let result: ToggleCommentLikeResult = { liked: false, count: 0 };

  await mutateArticleFile(article.slug, (current) => ({
    ...current,
    comments: current.comments.map((c) => {
      if (c.id !== commentId) return c;
      const already = c.likedBy.includes(userId);
      const likedBy = already
        ? c.likedBy.filter((id) => id !== userId)
        : [...c.likedBy, userId];
      result = { liked: !already, count: likedBy.length };
      return { ...c, likedBy };
    }),
  }));

  return result;
}