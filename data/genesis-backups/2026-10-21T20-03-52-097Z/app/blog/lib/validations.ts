/*
path :           app/blog/lib/validations.ts
tag :            ["blog", "validations", "zod", "schema", "canonical", "config"]
projectId:       new-genesis
type:            config
generic:         true

role:            Schéma Zod canonique du document Blog (schemaVersion === 3).
                 Source unique de vérité : tous les types TS du module sont
                 dérivés par z.infer dans @/app/blog/lib/types.ts. Valide
                 strictement (mode .strict()) l'intégralité de data/blog.json :
                 meta, taxonomy, playlists (NOUVEAU), articles (avec content[]
                 en blocs hiérarchiques), groups, userContent et auditLog.
                 Le superRefine vérifie, pour chaque arbre (content[],
                 comments[] et posts[]), l'unicité des ids, la résolvabilité
                 des parentId, l'absence de cycle, la profondeur max et
                 l'unicité de order parmi les frères. Il vérifie AUSSI (NOUVEAU)
                 que les playlists sont cohérentes : ids uniques, articleIds
                 résolvables, et qu'un article n'appartient qu'à UNE playlist.
                 Exporte aussi les schémas d'input par entité pour les
                 Server Actions.

flow:            Module TypeScript pur → export de tous les schémas Zod.
                 Aucun état, aucun effet. blogDocumentSchema.superRefine
                 utilise validateTreeStructure pour content/comments/posts,
                 puis une vérification dédiée pour playlists.

ecosystem:       BlogCore = [
                   "@/app/blog/lib/admin.ts",
                   "@/app/blog/lib/ecosystem.ts",
                   "@/app/blog/lib/media.ts",
                   "@/app/blog/lib/session.ts",
                   "@/app/blog/lib/storage.ts",
                   "@/app/blog/lib/tree.ts",
                   "@/app/blog/lib/types.ts",
                   "@/app/blog/lib/utils/reading-time.ts",
                   "@/app/blog/lib/validations.ts",
                 ]

relatedFiles:    ["@/app/blog/lib/types.ts",
                  "@/app/blog/lib/storage.ts",
                  "@/app/blog/lib/tree.ts"]

imports:         ["zod"]

exports:         ["BLOG_SCHEMA_VERSION", "isoDate",
                  "sectionBlockSchema", "paragraphBlockSchema",
                  "imageBlockSchema", "videoBlockSchema",
                  "audioBlockSchema", "codeBlockSchema",
                  "embedBlockSchema", "documentBlockSchema",
                  "contentBlockSchema",
                  "commentSchema", "postSchema", "discussionSchema",
                  "groupMemberSchema", "groupSchema",
                  "subCategorySchema", "categorySchema", "themeSchema",
                  "tagSchema", "taxonomySchema",
                  "playlistVisibilityEnum", "PlaylistVisibility",
                  "playlistSchema", "playlistInputSchema", "PlaylistInput",
                  "notificationSchema", "favoriteFolderSchema",
                  "userContentSchema", "userContentMapSchema",
                  "auditEntrySchema", "blogMetaSchema",
                  "articleSchema", "articleStatusEnum", "visibilityEnum",
                  "blogDocumentSchema",
                  "articleInputSchema", "commentInputSchema",
                  "discussionInputSchema", "postInputSchema",
                  "groupInputSchema", "notificationInputSchema",
                  "favoriteFolderInputSchema",
                  "ArticleStatus", "Visibility"]

useBy:           ["@/app/blog/lib/types.ts",
                  "@/app/blog/lib/storage.ts",
                  "@/app/blog/lib/tree.ts",
                  "@/app/blog/lib/services/article.ts",
                  "@/app/blog/lib/services/comment.ts",
                  "@/app/blog/lib/services/favorite.ts",
                  "@/app/blog/lib/services/group.ts",
                  "@/app/blog/lib/services/like.ts",
                  "@/app/blog/lib/services/notification.ts",
                  "@/app/blog/lib/services/playlist.ts",
                  "@/app/blog/lib/services/search.ts",
                  "@/app/blog/lib/services/taxonomy.ts",
                  "@/app/blog/lib/actions/article.ts",
                  "@/app/blog/lib/actions/comment.ts",
                  "@/app/blog/lib/actions/favorite.ts",
                  "@/app/blog/lib/actions/group.ts",
                  "@/app/blog/lib/actions/like.ts",
                  "@/app/blog/lib/actions/notification.ts",
                  "@/app/blog/lib/actions/playlist.ts",
                  "@/app/blog/lib/actions/taxonomy.ts"]

userStories:     ["us1100010", "us1100011",
                  "*en tant qu'auteur je veux regrouper mes articles en playlists"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */

export const BLOG_SCHEMA_VERSION = 3 as const;

/** Date ISO 8601 stricte (avec timezone). */
export const isoDate = z.string().datetime({ offset: true });

/* ------------------------------------------------------------------ */
/*  Enums partagés                                                    */
/* ------------------------------------------------------------------ */

export const articleStatusEnum = z.enum(["draft", "published", "archived"]);
export type ArticleStatus = z.infer<typeof articleStatusEnum>;

export const visibilityEnum = z.enum(["public", "private", "unlisted"]);
export type Visibility = z.infer<typeof visibilityEnum>;

export const playlistVisibilityEnum = z.enum([
  "public",
  "unlisted",
  "private",
]);
export type PlaylistVisibility = z.infer<typeof playlistVisibilityEnum>;

/* ------------------------------------------------------------------ */
/*  Bloc de contenu — base                                             */
/* ------------------------------------------------------------------ */

const baseBlockSchema = z
  .object({
    id: z.string().min(1),
    parentId: z.string().min(1),
    order: z.number().int().min(0),
    createdAt: isoDate,
    updatedAt: isoDate,
  })
  .strict();

/* ------------------------------------------------------------------ */
/*  Blocs — discriminatedUnion sur `type`                             */
/* ------------------------------------------------------------------ */

export const sectionBlockSchema = baseBlockSchema
  .extend({
    type: z.literal("section"),
    title: z.string().trim().min(1).max(200),
  })
  .strict();

export const paragraphBlockSchema = baseBlockSchema
  .extend({
    type: z.literal("paragraph"),
    text: z.string().min(1),
  })
  .strict();

export const imageBlockSchema = baseBlockSchema
  .extend({
    type: z.literal("image"),
    path: z.string().min(1),
    alt: z.string().trim().min(1).max(300),
    caption: z.string().max(500).optional(),
    credit: z.string().max(200).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  })
  .strict();

export const videoBlockSchema = baseBlockSchema
  .extend({
    type: z.literal("video"),
    path: z.string().min(1),
    caption: z.string().max(500).optional(),
    durationSec: z.number().int().positive().optional(),
    poster: z.string().min(1).optional(),
  })
  .strict();

export const audioBlockSchema = baseBlockSchema
  .extend({
    type: z.literal("audio"),
    path: z.string().min(1),
    caption: z.string().max(500).optional(),
    durationSec: z.number().int().positive().optional(),
  })
  .strict();

export const codeBlockSchema = baseBlockSchema
  .extend({
    type: z.literal("code"),
    language: z.string().trim().min(1).max(50),
    code: z.string().min(1),
    caption: z.string().max(200).optional(),
  })
  .strict();

export const embedBlockSchema = baseBlockSchema
  .extend({
    type: z.literal("embed"),
    url: z.url(),
    provider: z.enum(["youtube", "vimeo", "codesandbox", "twitter", "other"]),
    caption: z.string().max(500).optional(),
  })
  .strict();

export const documentBlockSchema = baseBlockSchema
  .extend({
    type: z.literal("document"),
    path: z.string().min(1),
    title: z.string().trim().min(1).max(200),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
  })
  .strict();

export const contentBlockSchema = z.discriminatedUnion("type", [
  sectionBlockSchema,
  paragraphBlockSchema,
  imageBlockSchema,
  videoBlockSchema,
  audioBlockSchema,
  codeBlockSchema,
  embedBlockSchema,
  documentBlockSchema,
]);

/* ------------------------------------------------------------------ */
/*  Commentaire (flat tree, soft delete)                              */
/* ------------------------------------------------------------------ */

export const commentSchema = z
  .object({
    id: z.string().min(1),
    parentId: z.string().min(1),
    authorId: z.string().min(1),
    content: z.string().min(1),
    order: z.number().int().min(0),
    createdAt: isoDate,
    updatedAt: isoDate,
    deletedAt: isoDate.optional(),
    likedBy: z.array(z.string().min(1)),
  })
  .strict();

/* ------------------------------------------------------------------ */
/*  Article                                                           */
/* ------------------------------------------------------------------ */

export const articleSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1).max(200),
    title: z.string().trim().min(1).max(200),
    summary: z.string().trim().min(1).max(500),
    coverImage: z.string().min(1).optional(),
    readingTimeMin: z.number().int().min(0),
    viewCount: z.number().int().min(0),
    featured: z.boolean(),
    authorId: z.string().min(1),
    themeId: z.string().min(1),
    categoryId: z.string().min(1).optional(),
    subCategoryId: z.string().min(1).optional(),
    tagIds: z.array(z.string().min(1)),
    status: articleStatusEnum,
    visibility: visibilityEnum,
    publishedAt: isoDate.optional(),
    createdAt: isoDate,
    updatedAt: isoDate,
    order: z.number().int().min(0),
    content: z.array(contentBlockSchema),
    comments: z.array(commentSchema),
    likedBy: z.array(z.string().min(1)),
  })
  .strict();

/* ------------------------------------------------------------------ */
/*  Taxonomie — imbrication thème → catégorie → sous-catégorie        */
/* ------------------------------------------------------------------ */

export const subCategorySchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(100),
    description: z.string().max(500).optional(),
    order: z.number().int().min(0),
    createdAt: isoDate,
    updatedAt: isoDate,
  })
  .strict();

export const categorySchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(100),
    description: z.string().max(500).optional(),
    order: z.number().int().min(0),
    createdAt: isoDate,
    updatedAt: isoDate,
    subCategories: z.array(subCategorySchema),
  })
  .strict();

export const themeSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(100),
    description: z.string().max(500).optional(),
    color: z.string().min(1).max(50),
    icon: z.string().min(1).max(50),
    order: z.number().int().min(0),
    createdAt: isoDate,
    updatedAt: isoDate,
    categories: z.array(categorySchema),
  })
  .strict();

export const tagSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(50),
    color: z.string().min(1).max(50).optional(),
    createdAt: isoDate,
    updatedAt: isoDate,
  })
  .strict();

export const taxonomySchema = z
  .object({
    themes: z.array(themeSchema),
    tags: z.array(tagSchema),
  })
  .strict();

/* ------------------------------------------------------------------ */
/*  Playlist — collection éditoriale ordonnée                         */
/* ------------------------------------------------------------------ */

export const playlistSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(100),
    description: z.string().max(500).optional(),
    coverImage: z.string().min(1).optional(),
    articleIds: z.array(z.string().min(1)),
    visibility: playlistVisibilityEnum,
    order: z.number().int().min(0),
    createdAt: isoDate,
    updatedAt: isoDate,
  })
  .strict();

export const playlistInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).optional(),
    coverImage: z.string().min(1).optional(),
    visibility: playlistVisibilityEnum,
  })
  .strict();

export type PlaylistInput = z.infer<typeof playlistInputSchema>;

/* ------------------------------------------------------------------ */
/*  Groupes, membres, discussions, posts                              */
/* ------------------------------------------------------------------ */

export const groupMemberSchema = z
  .object({
    userId: z.string().min(1),
    role: z.enum(["owner", "moderator", "member"]),
    status: z.enum(["active", "pending", "banned"]),
    joinedAt: isoDate,
  })
  .strict();

export const postSchema = z
  .object({
    id: z.string().min(1),
    parentId: z.string().min(1),
    authorId: z.string().min(1),
    content: z.string().min(1),
    order: z.number().int().min(0),
    createdAt: isoDate,
    updatedAt: isoDate,
    deletedAt: isoDate.optional(),
    likedBy: z.array(z.string().min(1)),
  })
  .strict();

export const discussionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().min(1).max(200),
    content: z.string().min(1),
    authorId: z.string().min(1),
    createdAt: isoDate,
    updatedAt: isoDate,
    order: z.number().int().min(0),
    posts: z.array(postSchema),
  })
  .strict();

export const groupSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(100),
    description: z.string().max(1000).optional(),
    coverImage: z.string().min(1).optional(),
    visibility: visibilityEnum,
    ownerId: z.string().min(1),
    createdAt: isoDate,
    updatedAt: isoDate,
    order: z.number().int().min(0),
    members: z.array(groupMemberSchema),
    discussions: z.array(discussionSchema),
  })
  .strict();

/* ------------------------------------------------------------------ */
/*  Contenu personnel — notifications + favoris                       */
/* ------------------------------------------------------------------ */

export const notificationSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum([
      "reply",
      "group_invite",
      "group_join_approved",
      "group_new_discussion",
    ]),
    actorId: z.string().min(1),
    targetType: z.enum(["article", "comment", "group", "discussion", "post"]),
    targetId: z.string().min(1),
    excerpt: z.string().max(500),
    readAt: isoDate.optional(),
    createdAt: isoDate,
  })
  .strict();

export const favoriteFolderSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(100),
    order: z.number().int().min(0),
    articleIds: z.array(z.string().min(1)),
    createdAt: isoDate,
    updatedAt: isoDate,
  })
  .strict();

export const userContentSchema = z
  .object({
    notifications: z.array(notificationSchema),
    unfiledFavorites: z.array(z.string().min(1)),
    favoriteFolders: z.array(favoriteFolderSchema),
  })
  .strict();

export const userContentMapSchema = z.record(
  z.string().min(1),
  userContentSchema,
);

/* ------------------------------------------------------------------ */
/*  Journal d'audit                                                   */
/* ------------------------------------------------------------------ */

export const auditEntrySchema = z
  .object({
    id: z.string().min(1),
    actorId: z.string().min(1),
    action: z.string().min(1).max(100),
    resourceId: z.string().min(1),
    createdAt: isoDate,
    metadata: z.record(z.string(), z.string()).optional(),
  })
  .strict();

/* ------------------------------------------------------------------ */
/*  Méta du document                                                  */
/* ------------------------------------------------------------------ */

export const blogMetaSchema = z
  .object({
    schemaVersion: z.literal(BLOG_SCHEMA_VERSION),
    updatedAt: isoDate,
    adminIds: z.array(z.string().min(1)),
  })
  .strict();

/* ------------------------------------------------------------------ */
/*  Document complet + superRefine d'arbre                            */
/* ------------------------------------------------------------------ */

function validateTreeStructure(
  blocks: readonly { id: string; parentId: string; order: number }[],
  rootId: string,
  maxDepth: number,
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[],
): void {
  /* 1. Unicité des ids */
  const byId = new Map<
    string,
    { id: string; parentId: string; order: number }
  >();
  for (const b of blocks) {
    if (byId.has(b.id)) {
      ctx.addIssue({
        code: "custom",
        message: `Id dupliqué dans l'arbre : "${b.id}"`,
        path: pathPrefix,
      });
      return;
    }
    byId.set(b.id, b);
  }

  /* 2. parentId résolvable (racine = rootId) */
  for (const b of blocks) {
    if (b.parentId !== rootId && !byId.has(b.parentId)) {
      ctx.addIssue({
        code: "custom",
        message: `parentId orphelin "${b.parentId}" (bloc "${b.id}")`,
        path: pathPrefix,
      });
    }
  }

  /* 3. Cycle + profondeur maximale */
  for (const b of blocks) {
    let depth = 0;
    let current: string | undefined = b.id;
    const seen = new Set<string>();
    while (current && current !== rootId) {
      if (seen.has(current)) {
        ctx.addIssue({
          code: "custom",
          message: `Cycle détecté à partir du bloc "${b.id}"`,
          path: pathPrefix,
        });
        return;
      }
      seen.add(current);
      const parent = byId.get(current);
      if (!parent) break;
      current = parent.parentId;
      depth += 1;
      if (depth > maxDepth) {
        ctx.addIssue({
          code: "custom",
          message: `Profondeur > ${maxDepth} pour le bloc "${b.id}" (${depth})`,
          path: pathPrefix,
        });
        return;
      }
    }
  }

  /* 4. order unique parmi les frères */
  const ordersByParent = new Map<string, Set<number>>();
  for (const b of blocks) {
    const set = ordersByParent.get(b.parentId) ?? new Set<number>();
    if (set.has(b.order)) {
      ctx.addIssue({
        code: "custom",
        message: `order dupliqué (${b.order}) parmi les frères de "${b.parentId}"`,
        path: pathPrefix,
      });
    }
    set.add(b.order);
    ordersByParent.set(b.parentId, set);
  }
}

export const blogDocumentSchema = z
  .object({
    meta: blogMetaSchema,
    taxonomy: taxonomySchema,
    playlists: z.array(playlistSchema),
    articles: z.array(articleSchema),
    groups: z.array(groupSchema),
    userContent: userContentMapSchema,
    auditLog: z.array(auditEntrySchema),
  })
  .strict()
  .superRefine((doc, ctx) => {
    /* 1. Arbres content[] et comments[] de chaque article */
    doc.articles.forEach((article, i) => {
      validateTreeStructure(
        article.content,
        article.id,
        6,
        ctx,
        ["articles", i, "content"],
      );
      validateTreeStructure(
        article.comments,
        article.id,
        5,
        ctx,
        ["articles", i, "comments"],
      );
    });

    /* 2. Arbres posts[] de chaque discussion */
    doc.groups.forEach((group, gi) => {
      group.discussions.forEach((disc, di) => {
        validateTreeStructure(
          disc.posts,
          disc.id,
          5,
          ctx,
          ["groups", gi, "discussions", di, "posts"],
        );
      });
    });

    /* 3. Cohérence playlists ↔ articles */
    const playlistIds = new Set<string>();
    const articleToPlaylist = new Map<string, string>();
    const knownArticleIds = new Set(doc.articles.map((a) => a.id));

    doc.playlists.forEach((playlist, pi) => {
      if (playlistIds.has(playlist.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Playlist id dupliqué : "${playlist.id}"`,
          path: ["playlists", pi],
        });
      }
      playlistIds.add(playlist.id);

      playlist.articleIds.forEach((articleId, ai) => {
        if (!knownArticleIds.has(articleId)) {
          ctx.addIssue({
            code: "custom",
            message: `articleId orphelin "${articleId}" dans playlist "${playlist.id}"`,
            path: ["playlists", pi, "articleIds", ai],
          });
        }
        if (articleToPlaylist.has(articleId)) {
          ctx.addIssue({
            code: "custom",
            message: `Article "${articleId}" présent dans plusieurs playlists ("${articleToPlaylist.get(articleId)}" et "${playlist.id}")`,
            path: ["playlists", pi, "articleIds", ai],
          });
        } else {
          articleToPlaylist.set(articleId, playlist.id);
        }
      });
    });
  });

/* ------------------------------------------------------------------ */
/*  Schémas d'input (Server Actions)                                  */
/* ------------------------------------------------------------------ */

export const articleInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    summary: z.string().trim().min(1).max(500),
    coverImage: z.string().min(1).optional(),
    themeId: z.string().min(1),
    categoryId: z.string().min(1).optional(),
    subCategoryId: z.string().min(1).optional(),
    tagIds: z.array(z.string().min(1)),
    status: articleStatusEnum,
    visibility: visibilityEnum,
    featured: z.boolean(),
    content: z.array(contentBlockSchema),
  })
  .strict();

export const commentInputSchema = z
  .object({
    articleId: z.string().min(1),
    parentId: z.string().min(1),
    content: z.string().trim().min(1).max(5000),
  })
  .strict();

export const discussionInputSchema = z
  .object({
    groupSlug: z.string().min(1),
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(10000),
  })
  .strict();

export const postInputSchema = z
  .object({
    discussionId: z.string().min(1),
    parentId: z.string().min(1),
    content: z.string().trim().min(1).max(5000),
  })
  .strict();

export const groupInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(1000).optional(),
    coverImage: z.string().min(1).optional(),
    visibility: visibilityEnum,
  })
  .strict();

export const notificationInputSchema = z
  .object({
    type: z.enum([
      "reply",
      "group_invite",
      "group_join_approved",
      "group_new_discussion",
    ]),
    actorId: z.string().min(1),
    targetType: z.enum(["article", "comment", "group", "discussion", "post"]),
    targetId: z.string().min(1),
    excerpt: z.string().max(500),
  })
  .strict();

export const favoriteFolderInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
  })
  .strict();