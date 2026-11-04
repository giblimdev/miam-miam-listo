/*
path :           app/blog/lib/services/notification.ts
tag :            ["blog", "service", "notification", "purge", "plafond"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service des notifications in-app stockées sous
                 userContent[userId].notifications[]. Types : reply,
                 group_invite, group_join_approved, group_new_discussion.
                 Plafond 200 par utilisateur (les plus anciennes lues
                 sortent d'abord). Purge automatique des entrées dont
                 createdAt > 90 jours, exécutée à chaque lecture. Anti-
                 auto-notification : refuse si actorId === destinataire.

flow:            listNotifications(userId) → getUserContent → purge
                 > 90 jours → tri createdAt DESC.
                 countUnread(userId) → lit readAt null.
                 pushNotification(userId, input) → si actorId === userId
                 : return ; sinon push { id, ...input, readAt: undefined,
                 createdAt } → tronque à 200 (retire les plus anciennes
                 lues en premier) → mutateBlog.
                 markAsRead(userId, notificationId) → readAt = now.
                 markAllAsRead(userId) → toutes lues.
                 deleteNotification(userId, notificationId).

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

exports:         ["listNotifications", "countUnread", "pushNotification",
                  "markAsRead", "markAllAsRead", "deleteNotification",
                  "PushNotificationInput"]

useBy:           ["@/app/blog/lib/actions/notification.ts",
                  "@/app/blog/lib/actions/comment.ts",
                  "@/app/blog/lib/actions/group.ts"]

userStories:     ["us5100001", "us5100002", "us5100003"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { mutateBlog, readBlog } from "@/app/blog/lib/storage";
import type { Notification, UserContent } from "@/app/blog/lib/types";

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const MAX_NOTIFICATIONS = 200;
const MAX_AGE_DAYS = 90;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function emptyUserContent(): UserContent {
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
  return map[userId] ?? emptyUserContent();
}

/** Purge les entrées > 90 jours. Retourne un tableau filtré. */
function purgeOld(
  notifications: readonly Notification[],
): readonly Notification[] {
  const cutoff = Date.now() - MAX_AGE_MS;
  return notifications.filter((n) => {
    const t = new Date(n.createdAt).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
}

/**
 * Tronque à MAX_NOTIFICATIONS : on retire d'abord les plus anciennes
 * déjà lues, puis les plus anciennes non lues si nécessaire.
 */
function truncate(
  notifications: readonly Notification[],
): readonly Notification[] {
  if (notifications.length <= MAX_NOTIFICATIONS) return notifications;
  const sorted = [...notifications].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  ); // DESC
  const readFirst = [
    ...sorted.filter((n) => n.readAt),
    ...sorted.filter((n) => !n.readAt),
  ];
  return readFirst.slice(0, MAX_NOTIFICATIONS);
}

/* ------------------------------------------------------------------ */
/*  Lecture                                                            */
/* ------------------------------------------------------------------ */

export async function listNotifications(
  userId: string,
): Promise<readonly Notification[]> {
  const doc = await readBlog();
  const userContent = getUserContent(doc.userContent, userId);
  const purged = purgeOld(userContent.notifications);
  return [...purged].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export async function countUnread(userId: string): Promise<number> {
  const list = await listNotifications(userId);
  return list.filter((n) => !n.readAt).length;
}

/* ------------------------------------------------------------------ */
/*  Création                                                           */
/* ------------------------------------------------------------------ */

export interface PushNotificationInput {
  readonly type: Notification["type"];
  readonly actorId: string;
  readonly targetType: Notification["targetType"];
  readonly targetId: string;
  readonly excerpt: string;
}

export async function pushNotification(
  userId: string,
  input: PushNotificationInput,
): Promise<void> {
  if (input.actorId === userId) return; // anti-auto-notification

  const createdAt = nowIso();

  await mutateBlog((doc) => {
    const userContent = getUserContent(doc.userContent, userId);
    const entry: Notification = {
      id: newId(),
      type: input.type,
      actorId: input.actorId,
      targetType: input.targetType,
      targetId: input.targetId,
      excerpt: input.excerpt.slice(0, 500),
      readAt: undefined,
      createdAt,
    };

    const merged = purgeOld([entry, ...userContent.notifications]);
    const next: UserContent = {
      ...userContent,
      notifications: [...truncate(merged)],
    };

    return {
      ...doc,
      userContent: { ...doc.userContent, [userId]: next },
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Marquage lu / suppression                                          */
/* ------------------------------------------------------------------ */

export async function markAsRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  await mutateBlog((doc) => {
    const userContent = getUserContent(doc.userContent, userId);
    const next: UserContent = {
      ...userContent,
      notifications: userContent.notifications.map((n) =>
        n.id === notificationId ? { ...n, readAt: nowIso() } : n,
      ),
    };
    return {
      ...doc,
      userContent: { ...doc.userContent, [userId]: next },
    };
  });
}

export async function markAllAsRead(userId: string): Promise<void> {
  const readAt = nowIso();
  await mutateBlog((doc) => {
    const userContent = getUserContent(doc.userContent, userId);
    const next: UserContent = {
      ...userContent,
      notifications: userContent.notifications.map((n) =>
        n.readAt ? n : { ...n, readAt },
      ),
    };
    return {
      ...doc,
      userContent: { ...doc.userContent, [userId]: next },
    };
  });
}

export async function deleteNotification(
  userId: string,
  notificationId: string,
): Promise<void> {
  await mutateBlog((doc) => {
    const userContent = getUserContent(doc.userContent, userId);
    const next: UserContent = {
      ...userContent,
      notifications: userContent.notifications.filter(
        (n) => n.id !== notificationId,
      ),
    };
    return {
      ...doc,
      userContent: { ...doc.userContent, [userId]: next },
    };
  });
}