/*
path :           app/blog/lib/services/playlist.ts
tag :            ["blog", "service", "playlist", "editorial", "crud", "split-files"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD des playlists éditoriales. Une playlist est
                 une collection ORDONNÉE d'articles (articleIds[]), avec
                 nom, description optionnelle, couverture optionnelle,
                 visibilité (public / unlisted / private). SOURCE DE
                 VÉRITÉ = playlist.articleIds[] stocké dans le document
                 résiduel (data/blog/_index.json) — les articles vivent
                 dans data/blog/[slug].json.

                 ⚠️ Depuis le split : le superRefine de
                 blogDocumentSchema ne vérifie plus l'existence de
                 `playlist.articleIds[]` (les articles sont hors
                 document). C'est `addArticleToPlaylist` qui vérifie
                 désormais que l'article existe (via getArticleById) avant
                 de l'ajouter. L'unicité 1-1 article↔playlist est toujours
                 garantie par le superRefine (seule vérification restée
                 côté document) ET par addArticleToPlaylist (retrait
                 préalable des autres playlists).

flow:            listPlaylists / getPlaylistBySlug / getPlaylistById /
                 getPlaylistForArticle → readBlog().playlists.
                 createPlaylist(input) → slug unique → push → write.
                 updatePlaylist(id, input) → throw si introuvable → map.
                 deletePlaylist(id) → filter (articles préservés).
                 reorderPlaylists(orderedIds) → normalise order.
                 addArticleToPlaylist(playlistId, articleId) → getArticleById
                 (⚠️ vérifie l'existence) → retire de toutes les autres
                 playlists → push dans la cible.
                 removeArticleFromPlaylist / reorderArticlesInPlaylist →
                 throw si introuvable.

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
                  "@/app/blog/lib/services/article.ts",
                  "@/app/blog/lib/types.ts",
                  "@/app/blog/lib/validations.ts",
                  "@/utils/slugify.ts",
                  "@/utils/slug.ts"]

imports:         ["@/app/blog/lib/storage",
                  "@/app/blog/lib/services/article",
                  "@/app/blog/lib/types",
                  "@/utils/slugify",
                  "@/utils/slug"]

exports:         ["listPlaylists", "getPlaylistBySlug", "getPlaylistById",
                  "getPlaylistForArticle", "createPlaylist", "updatePlaylist",
                  "deletePlaylist", "reorderPlaylists", "addArticleToPlaylist",
                  "removeArticleFromPlaylist", "reorderArticlesInPlaylist"]

useBy:           ["@/app/blog/lib/actions/playlist.ts",
                  "@/app/blog/lib/services/search.ts"]

userStories:     ["*en tant qu'auteur je veux regrouper mes articles en playlists"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { mutateBlog, readBlog } from "@/app/blog/lib/storage";
import { getArticleById } from "@/app/blog/lib/services/article";
import type {
  Playlist,
  PlaylistInput,
  PlaylistVisibility,
} from "@/app/blog/lib/types";
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

export async function listPlaylists(
  visibility?: PlaylistVisibility,
): Promise<readonly Playlist[]> {
  const doc = await readBlog();
  return visibility
    ? doc.playlists.filter((p) => p.visibility === visibility)
    : doc.playlists;
}

export async function getPlaylistBySlug(
  slug: string,
): Promise<Playlist | null> {
  const doc = await readBlog();
  return doc.playlists.find((p) => p.slug === slug) ?? null;
}

export async function getPlaylistById(id: string): Promise<Playlist | null> {
  const doc = await readBlog();
  return doc.playlists.find((p) => p.id === id) ?? null;
}

export async function getPlaylistForArticle(
  articleId: string,
): Promise<Playlist | null> {
  const doc = await readBlog();
  return doc.playlists.find((p) => p.articleIds.includes(articleId)) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Création                                                          */
/* ------------------------------------------------------------------ */

export async function createPlaylist(
  input: PlaylistInput,
): Promise<Playlist> {
  const id = newId();
  const createdAt = nowIso();
  const base = slugifyWithFallback(input.name, "playlist");
  let entity!: Playlist;

  await mutateBlog((doc) => {
    const slugs = new Set(doc.playlists.map((p) => p.slug));
    return (async () => {
      const slug = await findFreeSlug(base, async (c) => slugs.has(c));
      entity = {
        id,
        slug,
        name: input.name,
        description: input.description,
        coverImage: input.coverImage,
        articleIds: [],
        visibility: input.visibility,
        order: doc.playlists.length,
        createdAt,
        updatedAt: createdAt,
      };
      return { ...doc, playlists: [...doc.playlists, entity] };
    })();
  });

  return entity;
}

/* ------------------------------------------------------------------ */
/*  Mise à jour                                                       */
/* ------------------------------------------------------------------ */

export async function updatePlaylist(
  playlistId: string,
  input: PlaylistInput,
): Promise<Playlist> {
  const doc = await readBlog();
  const existing = doc.playlists.find((p) => p.id === playlistId);
  if (!existing) {
    throw new Error(`[blog/playlist] Playlist introuvable : ${playlistId}`);
  }

  let updated!: Playlist;
  await mutateBlog((current) => {
    const playlists = current.playlists.map((playlist) => {
      if (playlist.id !== playlistId) return playlist;
      updated = {
        ...playlist,
        name: input.name,
        description: input.description,
        coverImage: input.coverImage,
        visibility: input.visibility,
        updatedAt: nowIso(),
      };
      return updated;
    });
    return { ...current, playlists };
  });
  return updated;
}

/* ------------------------------------------------------------------ */
/*  Suppression                                                       */
/* ------------------------------------------------------------------ */

export async function deletePlaylist(playlistId: string): Promise<void> {
  await mutateBlog((doc) => ({
    ...doc,
    playlists: doc.playlists.filter((p) => p.id !== playlistId),
  }));
}

/* ------------------------------------------------------------------ */
/*  Réordonnancement des playlists                                    */
/* ------------------------------------------------------------------ */

export async function reorderPlaylists(
  orderedIds: readonly string[],
): Promise<readonly Playlist[]> {
  let result: readonly Playlist[] = [];
  await mutateBlog((doc) => {
    const positionById = new Map(orderedIds.map((id, i) => [id, i]));
    const playlists = doc.playlists.map((p) => ({
      ...p,
      order: positionById.get(p.id) ?? p.order,
    }));
    result = playlists;
    return { ...doc, playlists };
  });
  return result;
}

/* ------------------------------------------------------------------ */
/*  Gestion des articles dans une playlist                            */
/* ------------------------------------------------------------------ */

/**
 * Ajoute un article à la playlist cible en le RETIRANT d'abord de toute
 * autre playlist (garantit l'unicité 1-1 article↔playlist).
 *
 * ⚠️ Vérifie que l'article existe (getArticleById). Depuis le split
 * articles, la validation Zod ne peut plus le faire (les articles sont
 * hors document) — c'est ICI que la règle est désormais appliquée.
 *
 * Lève si la playlist cible OU l'article n'existe pas.
 */
export async function addArticleToPlaylist(
  playlistId: string,
  articleId: string,
): Promise<Playlist> {
  const article = await getArticleById(articleId);
  if (!article) {
    throw new Error(`[blog/playlist] Article introuvable : ${articleId}`);
  }

  const doc = await readBlog();
  const target = doc.playlists.find((p) => p.id === playlistId);
  if (!target) {
    throw new Error(`[blog/playlist] Playlist introuvable : ${playlistId}`);
  }

  let updated!: Playlist;
  await mutateBlog((current) => {
    const playlists = current.playlists.map((playlist) => {
      if (
        playlist.id !== playlistId &&
        playlist.articleIds.includes(articleId)
      ) {
        return {
          ...playlist,
          articleIds: playlist.articleIds.filter((id) => id !== articleId),
          updatedAt: nowIso(),
        };
      }
      if (playlist.id === playlistId) {
        const already = playlist.articleIds.includes(articleId);
        updated = {
          ...playlist,
          articleIds: already
            ? playlist.articleIds
            : [...playlist.articleIds, articleId],
          updatedAt: nowIso(),
        };
        return updated;
      }
      return playlist;
    });
    return { ...current, playlists };
  });
  return updated;
}

export async function removeArticleFromPlaylist(
  playlistId: string,
  articleId: string,
): Promise<Playlist> {
  const doc = await readBlog();
  const target = doc.playlists.find((p) => p.id === playlistId);
  if (!target) {
    throw new Error(`[blog/playlist] Playlist introuvable : ${playlistId}`);
  }

  let updated!: Playlist;
  await mutateBlog((current) => {
    const playlists = current.playlists.map((playlist) => {
      if (playlist.id !== playlistId) return playlist;
      updated = {
        ...playlist,
        articleIds: playlist.articleIds.filter((id) => id !== articleId),
        updatedAt: nowIso(),
      };
      return updated;
    });
    return { ...current, playlists };
  });
  return updated;
}

export async function reorderArticlesInPlaylist(
  playlistId: string,
  orderedIds: readonly string[],
): Promise<Playlist> {
  const doc = await readBlog();
  const target = doc.playlists.find((p) => p.id === playlistId);
  if (!target) {
    throw new Error(`[blog/playlist] Playlist introuvable : ${playlistId}`);
  }

  let updated!: Playlist;
  await mutateBlog((current) => {
    const playlists = current.playlists.map((playlist) => {
      if (playlist.id !== playlistId) return playlist;
      const positionById = new Map(orderedIds.map((id, i) => [id, i]));
      const sorted = [...playlist.articleIds].sort((a, b) => {
        const posA = positionById.get(a) ?? Number.MAX_SAFE_INTEGER;
        const posB = positionById.get(b) ?? Number.MAX_SAFE_INTEGER;
        return posA - posB;
      });
      updated = {
        ...playlist,
        articleIds: sorted,
        updatedAt: nowIso(),
      };
      return updated;
    });
    return { ...current, playlists };
  });
  return updated;
}