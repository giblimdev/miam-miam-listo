/*
path :           app/blog/lib/services/group.ts
tag :            ["blog", "service", "group", "discussion", "post", "tree"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD des groupes de discussion et de leurs
                 discussions/posts. Groupes stockés à plat (groups[]),
                 members[] imbriqués avec rôle (owner/moderator/member) et
                 statut (active/pending/banned), discussions[] imbriquées
                 dans le groupe, posts[] en tableau plat avec parentId
                 (racine = discussion.id) — même pattern que content[] et
                 comments[]. Réutilise insertBlock / removeBlock. Toute
                 écriture passe par mutateBlog.

flow:            listGroups(visibility?) → filtre groups[] par visibilité.
                 getGroupBySlug(slug) → find.
                 createGroup(ownerId, input) → slug unique + members
                 [{ userId: ownerId, role: "owner", status: "active" }]
                 → push.
                 joinGroup(groupId, userId) → public : member+active ;
                 private : member+pending.
                 approveMember / rejectMember (owner|moderator).
                 leaveGroup(groupId, userId) → sauf owner.
                 banMember (owner|moderator), owner non bannissable.
                 createDiscussion(groupId, authorId, input) → member
                 active requis → push dans group.discussions[].
                 createPost(groupId, discussionId, authorId, input) →
                 insertBlock dans discussion.posts[] (profondeur ≤ 5).
                 softDeletePost (owner|moderator).
                 toggleLikeOnPost.

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
                  "@/utils/slugify.ts",
                  "@/utils/slug.ts"]

imports:         ["@/app/blog/lib/storage",
                  "@/app/blog/lib/tree",
                  "@/app/blog/lib/types",
                  "@/utils/slugify",
                  "@/utils/slug"]

exports:         ["listGroups", "getGroupBySlug", "createGroup",
                  "joinGroup", "approveMember", "rejectMember",
                  "leaveGroup", "banMember", "createDiscussion",
                  "createPost", "softDeletePost", "toggleLikeOnPost",
                  "GroupInputLite"]

useBy:           ["@/app/blog/lib/actions/group.ts",
                  "@/app/blog/lib/actions/discussion.ts"]

userStories:     ["us3100001", "us3100002", "us3100003", "us3100004",
                  "us3100005"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { mutateBlog, readBlog } from "@/app/blog/lib/storage";
import { insertBlock } from "@/app/blog/lib/tree";
import type {
  Discussion,
  Group,
  GroupMember,
  Post,
  Visibility,
} from "@/app/blog/lib/types";
import { findFreeSlug } from "@/utils/slug";
import { slugifyWithFallback } from "@/utils/slugify";

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const MAX_POST_DEPTH = 5;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function findGroup(doc: Awaited<ReturnType<typeof readBlog>>, groupId: string): Group {
  const g = doc.groups.find((x) => x.id === groupId);
  if (!g) throw new Error(`[blog/group] Groupe introuvable : ${groupId}`);
  return g;
}

function isOwnerOrModerator(group: Group, userId: string): boolean {
  const m = group.members.find(
    (x) => x.userId === userId && x.status === "active",
  );
  return m?.role === "owner" || m?.role === "moderator";
}

function isActiveMember(group: Group, userId: string): boolean {
  return group.members.some(
    (x) => x.userId === userId && x.status === "active",
  );
}

function computePostDepth(
  posts: readonly Post[],
  postId: string,
  rootId: string,
): number {
  const byId = new Map(posts.map((p) => [p.id, p]));
  let depth = 0;
  let current = byId.get(postId)?.parentId;
  const seen = new Set<string>();
  while (current && current !== rootId) {
    if (seen.has(current)) break;
    seen.add(current);
    depth += 1;
    current = byId.get(current)?.parentId;
  }
  return depth;
}

/* ------------------------------------------------------------------ */
/*  Lecture                                                            */
/* ------------------------------------------------------------------ */

export async function listGroups(
  visibility?: Visibility,
): Promise<readonly Group[]> {
  const doc = await readBlog();
  return visibility
    ? doc.groups.filter((g) => g.visibility === visibility)
    : doc.groups;
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  const doc = await readBlog();
  return doc.groups.find((g) => g.slug === slug) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Création                                                           */
/* ------------------------------------------------------------------ */

export interface GroupInputLite {
  readonly name: string;
  readonly description?: string;
  readonly coverImage?: string;
  readonly visibility: Visibility;
}

export async function createGroup(
  ownerId: string,
  input: GroupInputLite,
): Promise<Group> {
  const createdAt = nowIso();
  const id = newId();
  const base = slugifyWithFallback(input.name, "group");
  let entity!: Group;

  await mutateBlog((doc) => {
    const slugs = new Set(doc.groups.map((g) => g.slug));
    return (async () => {
      const slug = await findFreeSlug(base, async (c) => slugs.has(c));
      const owner: GroupMember = {
        userId: ownerId,
        role: "owner",
        status: "active",
        joinedAt: createdAt,
      };
      entity = {
        id,
        slug,
        name: input.name,
        description: input.description,
        coverImage: input.coverImage,
        visibility: input.visibility,
        ownerId,
        createdAt,
        updatedAt: createdAt,
        order: doc.groups.length,
        members: [owner],
        discussions: [],
      };
      return { ...doc, groups: [...doc.groups, entity] };
    })();
  });

  return entity;
}

/* ------------------------------------------------------------------ */
/*  Adhésion                                                           */
/* ------------------------------------------------------------------ */

export async function joinGroup(
  groupId: string,
  userId: string,
): Promise<void> {
  await mutateBlog((doc) => ({
    ...doc,
    groups: doc.groups.map((g) => {
      if (g.id !== groupId) return g;
      if (g.members.some((m) => m.userId === userId)) return g;
      const status = g.visibility === "public" ? "active" : "pending";
      const next: GroupMember = {
        userId,
        role: "member",
        status,
        joinedAt: nowIso(),
      };
      return {
        ...g,
        members: [...g.members, next],
        updatedAt: nowIso(),
      };
    }),
  }));
}

export async function approveMember(
  groupId: string,
  actorId: string,
  userId: string,
): Promise<void> {
  await mutateBlog((doc) => ({
    ...doc,
    groups: doc.groups.map((g) => {
      if (g.id !== groupId) return g;
      if (!isOwnerOrModerator(g, actorId)) return g;
      return {
        ...g,
        members: g.members.map((m) =>
          m.userId === userId ? { ...m, status: "active" as const } : m,
        ),
        updatedAt: nowIso(),
      };
    }),
  }));
}

export async function rejectMember(
  groupId: string,
  actorId: string,
  userId: string,
): Promise<void> {
  await mutateBlog((doc) => ({
    ...doc,
    groups: doc.groups.map((g) => {
      if (g.id !== groupId) return g;
      if (!isOwnerOrModerator(g, actorId)) return g;
      return {
        ...g,
        members: g.members.filter((m) => m.userId !== userId),
        updatedAt: nowIso(),
      };
    }),
  }));
}

export async function leaveGroup(
  groupId: string,
  userId: string,
): Promise<void> {
  await mutateBlog((doc) => ({
    ...doc,
    groups: doc.groups.map((g) => {
      if (g.id !== groupId) return g;
      if (g.ownerId === userId) return g; // owner ne peut pas partir
      return {
        ...g,
        members: g.members.filter((m) => m.userId !== userId),
        updatedAt: nowIso(),
      };
    }),
  }));
}

export async function banMember(
  groupId: string,
  actorId: string,
  userId: string,
): Promise<void> {
  await mutateBlog((doc) => ({
    ...doc,
    groups: doc.groups.map((g) => {
      if (g.id !== groupId) return g;
      if (!isOwnerOrModerator(g, actorId)) return g;
      if (g.ownerId === userId) return g; // owner non bannissable
      return {
        ...g,
        members: g.members.map((m) =>
          m.userId === userId ? { ...m, status: "banned" as const } : m,
        ),
        updatedAt: nowIso(),
      };
    }),
  }));
}

/* ------------------------------------------------------------------ */
/*  Discussions                                                        */
/* ------------------------------------------------------------------ */

export interface DiscussionInputLite {
  readonly title: string;
  readonly content: string;
}

export async function createDiscussion(
  groupId: string,
  authorId: string,
  input: DiscussionInputLite,
): Promise<Discussion> {
  const createdAt = nowIso();
  const discussion: Discussion = {
    id: newId(),
    title: input.title,
    content: input.content,
    authorId,
    createdAt,
    updatedAt: createdAt,
    order: 0,
    posts: [],
  };

  await mutateBlog((doc) => ({
    ...doc,
    groups: doc.groups.map((g) => {
      if (g.id !== groupId) return g;
      if (!isActiveMember(g, authorId)) {
        throw new Error("[blog/group] Membre actif requis.");
      }
      return {
        ...g,
        discussions: [
          { ...discussion, order: g.discussions.length },
          ...g.discussions,
        ],
        updatedAt: nowIso(),
      };
    }),
  }));

  return discussion;
}

/* ------------------------------------------------------------------ */
/*  Posts (réponses aux discussions)                                   */
/* ------------------------------------------------------------------ */

export interface PostInputLite {
  readonly parentId: string;
  readonly content: string;
}

export async function createPost(
  groupId: string,
  discussionId: string,
  authorId: string,
  input: PostInputLite,
): Promise<Post> {
  const createdAt = nowIso();
  let created!: Post;

  await mutateBlog((doc) => ({
    ...doc,
    groups: doc.groups.map((g) => {
      if (g.id !== groupId) return g;
      if (!isActiveMember(g, authorId)) {
        throw new Error("[blog/group] Membre actif requis.");
      }
      return {
        ...g,
        discussions: g.discussions.map((d) => {
          if (d.id !== discussionId) return d;

          const isRoot = input.parentId === d.id;
          const parentExists = d.posts.some((p) => p.id === input.parentId);
          if (!isRoot && !parentExists) {
            throw new Error(
              `[blog/group] parentId orphelin : ${input.parentId}`,
            );
          }
          if (!isRoot) {
            const pd = computePostDepth(d.posts, input.parentId, d.id);
            if (pd + 1 > MAX_POST_DEPTH) {
              throw new Error(
                `[blog/group] Profondeur maximale dépassée (${MAX_POST_DEPTH}).`,
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
          const posts = insertBlock(d.posts, created);
          return { ...d, posts: [...posts], updatedAt: nowIso() };
        }),
        updatedAt: nowIso(),
      };
    }),
  }));

  return created;
}

export async function softDeletePost(
  groupId: string,
  discussionId: string,
  postId: string,
  actorId: string,
): Promise<void> {
  await mutateBlog((doc) => ({
    ...doc,
    groups: doc.groups.map((g) => {
      if (g.id !== groupId) return g;
      if (!isOwnerOrModerator(g, actorId)) {
        throw new Error("[blog/group] Modération requise.");
      }
      return {
        ...g,
        discussions: g.discussions.map((d) =>
          d.id !== discussionId
            ? d
            : {
                ...d,
                posts: d.posts.map((p) =>
                  p.id === postId
                    ? { ...p, deletedAt: nowIso(), updatedAt: nowIso() }
                    : p,
                ),
              },
        ),
        updatedAt: nowIso(),
      };
    }),
  }));
}

export interface TogglePostLikeResult {
  readonly liked: boolean;
  readonly count: number;
}

export async function toggleLikeOnPost(
  groupId: string,
  discussionId: string,
  postId: string,
  userId: string,
): Promise<TogglePostLikeResult> {
  let result: TogglePostLikeResult = { liked: false, count: 0 };

  await mutateBlog((doc) => ({
    ...doc,
    groups: doc.groups.map((g) => {
      if (g.id !== groupId) return g;
      if (!isActiveMember(g, userId)) {
        throw new Error("[blog/group] Membre actif requis.");
      }
      return {
        ...g,
        discussions: g.discussions.map((d) => {
          if (d.id !== discussionId) return d;
          const posts = d.posts.map((p) => {
            if (p.id !== postId) return p;
            const already = p.likedBy.includes(userId);
            const likedBy = already
              ? p.likedBy.filter((id) => id !== userId)
              : [...p.likedBy, userId];
            result = { liked: !already, count: likedBy.length };
            return { ...p, likedBy };
          });
          return { ...d, posts };
        }),
      };
    }),
  }));

  return result;
}