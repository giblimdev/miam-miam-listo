/*
path :           app/blog/lib/services/favorite.ts
tag :            ["blog", "service", "favorite", "folder", "user-content"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service des favoris personnels stockés sous
                 userContent[userId] : unfiledFavorites[] (non classés)
                 + favoriteFolders[] (dossiers nommés). Un article figure
                 au plus une fois dans l'ensemble (dossier ou non classé).
                 Toute écriture passe par mutateBlog.

flow:            getUserFavorites(userId) → lit userContent[userId] ou
                 retourne structure vide.
                 toggleFavorite(userId, articleId) → si présent (unfiled
                 ou dans un dossier) : retire ; sinon push dans unfiled
                 → retourne { favorited }.
                 moveFavoriteToFolder(userId, articleId, folderId|null) →
                 retire de partout puis push dans la cible (folder ou
                 unfiled).
                 createFolder(userId, name) → id, order = max+1.
                 deleteFolder(userId, folderId) → remet les articleIds
                 dans unfiledFavorites.
                 renameFolder(userId, folderId, name).

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
                  "@/app/blog/lib/types.ts"]

imports:         ["@/app/blog/lib/storage",
                  "@/app/blog/lib/types"]

exports:         ["getUserFavorites", "toggleFavorite",
                  "moveFavoriteToFolder", "createFolder",
                  "deleteFolder", "renameFolder", "EmptyUserContent"]

useBy:           ["@/app/blog/lib/actions/favorite.ts"]

userStories:     ["us2100005", "us2100006"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { mutateBlog, readBlog } from "@/app/blog/lib/storage";
import type { FavoriteFolder, UserContent } from "@/app/blog/lib/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

export function EmptyUserContent(): UserContent {
  return {
    notifications: [],
    unfiledFavorites: [],
    favoriteFolders: [],
  };
}

function getUserContent(
  map: Record<string, UserContent>,
  userId: string,
): UserContent {
  return map[userId] ?? EmptyUserContent();
}

function isFavoriteIn(userContent: UserContent, articleId: string): boolean {
  if (userContent.unfiledFavorites.includes(articleId)) return true;
  return userContent.favoriteFolders.some((f) =>
    f.articleIds.includes(articleId),
  );
}

/* ------------------------------------------------------------------ */
/*  Lecture                                                            */
/* ------------------------------------------------------------------ */

export async function getUserFavorites(
  userId: string,
): Promise<UserContent> {
  const doc = await readBlog();
  return getUserContent(doc.userContent, userId);
}

/* ------------------------------------------------------------------ */
/*  Toggle favori (non classé par défaut)                              */
/* ------------------------------------------------------------------ */

export interface ToggleFavoriteResult {
  readonly favorited: boolean;
  readonly count: number;
}

export async function toggleFavorite(
  userId: string,
  articleId: string,
): Promise<ToggleFavoriteResult> {
  let result: ToggleFavoriteResult = { favorited: false, count: 0 };

  await mutateBlog((doc) => {
    const userContent = getUserContent(doc.userContent, userId);
    const already = isFavoriteIn(userContent, articleId);

    const next: UserContent = already
      ? {
          ...userContent,
          unfiledFavorites: userContent.unfiledFavorites.filter(
            (id) => id !== articleId,
          ),
          favoriteFolders: userContent.favoriteFolders.map((f) => ({
            ...f,
            articleIds: f.articleIds.filter((id) => id !== articleId),
          })),
        }
      : {
          ...userContent,
          unfiledFavorites: [...userContent.unfiledFavorites, articleId],
        };

    const count =
      next.unfiledFavorites.length +
      next.favoriteFolders.reduce((sum, f) => sum + f.articleIds.length, 0);

    result = { favorited: !already, count };

    return {
      ...doc,
      userContent: { ...doc.userContent, [userId]: next },
    };
  });

  return result;
}

/* ------------------------------------------------------------------ */
/*  Déplacement vers un dossier (ou null pour non classé)             */
/* ------------------------------------------------------------------ */

export async function moveFavoriteToFolder(
  userId: string,
  articleId: string,
  folderId: string | null,
): Promise<void> {
  await mutateBlog((doc) => {
    const userContent = getUserContent(doc.userContent, userId);

    /* 1. Retirer de partout */
    const cleaned: UserContent = {
      ...userContent,
      unfiledFavorites: userContent.unfiledFavorites.filter(
        (id) => id !== articleId,
      ),
      favoriteFolders: userContent.favoriteFolders.map((f) => ({
        ...f,
        articleIds: f.articleIds.filter((id) => id !== articleId),
      })),
    };

    /* 2. Pousser à la cible */
    let next: UserContent;
    if (folderId === null) {
      next = {
        ...cleaned,
        unfiledFavorites: [...cleaned.unfiledFavorites, articleId],
      };
    } else {
      const folder = cleaned.favoriteFolders.find((f) => f.id === folderId);
      if (!folder) {
        throw new Error(`[blog/favorite] Dossier introuvable : ${folderId}`);
      }
      next = {
        ...cleaned,
        favoriteFolders: cleaned.favoriteFolders.map((f) =>
          f.id === folderId
            ? {
                ...f,
                articleIds: [...f.articleIds, articleId],
                updatedAt: nowIso(),
              }
            : f,
        ),
      };
    }

    return {
      ...doc,
      userContent: { ...doc.userContent, [userId]: next },
    };
  });
}

/* ------------------------------------------------------------------ */
/*  CRUD dossiers                                                      */
/* ------------------------------------------------------------------ */

export async function createFolder(
  userId: string,
  name: string,
): Promise<FavoriteFolder> {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error("[blog/favorite] Nom de dossier requis.");
  }

  const createdAt = nowIso();
  let created!: FavoriteFolder;

  await mutateBlog((doc) => {
    const userContent = getUserContent(doc.userContent, userId);
    const order = userContent.favoriteFolders.reduce(
      (max, f) => Math.max(max, f.order),
      -1,
    ) + 1;

    created = {
      id: newId(),
      name: trimmed,
      order,
      articleIds: [],
      createdAt,
      updatedAt: createdAt,
    };

    const next: UserContent = {
      ...userContent,
      favoriteFolders: [...userContent.favoriteFolders, created],
    };

    return {
      ...doc,
      userContent: { ...doc.userContent, [userId]: next },
    };
  });

  return created;
}

export async function renameFolder(
  userId: string,
  folderId: string,
  name: string,
): Promise<void> {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error("[blog/favorite] Nom de dossier requis.");
  }
  await mutateBlog((doc) => {
    const userContent = getUserContent(doc.userContent, userId);
    const exists = userContent.favoriteFolders.some((f) => f.id === folderId);
    if (!exists) {
      throw new Error(`[blog/favorite] Dossier introuvable : ${folderId}`);
    }
    const next: UserContent = {
      ...userContent,
      favoriteFolders: userContent.favoriteFolders.map((f) =>
        f.id === folderId
          ? { ...f, name: trimmed, updatedAt: nowIso() }
          : f,
      ),
    };
    return {
      ...doc,
      userContent: { ...doc.userContent, [userId]: next },
    };
  });
}

export async function deleteFolder(
  userId: string,
  folderId: string,
): Promise<void> {
  await mutateBlog((doc) => {
    const userContent = getUserContent(doc.userContent, userId);
    const folder = userContent.favoriteFolders.find((f) => f.id === folderId);
    if (!folder) {
      throw new Error(`[blog/favorite] Dossier introuvable : ${folderId}`);
    }
    /* Remettre les articleIds dans unfiled (aucun favori perdu) */
    const merged = Array.from(
      new Set([...userContent.unfiledFavorites, ...folder.articleIds]),
    );
    const next: UserContent = {
      ...userContent,
      unfiledFavorites: merged,
      favoriteFolders: userContent.favoriteFolders.filter(
        (f) => f.id !== folderId,
      ),
    };
    return {
      ...doc,
      userContent: { ...doc.userContent, [userId]: next },
    };
  });
}