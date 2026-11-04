/*
path :           app/blog/lib/storage.ts
tag :            ["blog", "storage", "atomic", "mutex", "migration", "server-only"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Seul fichier autorisé à toucher data/blog.json. Expose
                 readBlog() (lecture + auto-migration v2→v3 + parse +
                 validation Zod) et mutateBlog(fn) (lecture + fn + validation
                 Zod + écriture atomique temp + rename, protégée par un mutex
                 global). Si le fichier est absent, un document vide valide
                 est créé au boot — createEmptyBlogDocument inclut désormais
                 playlists: [] (schéma v3). La fonction migrateToCurrentVersion
                 détecte un document v2 (schemaVersion: 2, playlists absent)
                 et le transforme en v3 en mémoire ; la persistance se fait
                 au prochain mutateBlog (ou immédiatement via le script
                 scripts/migrate-blog-v3.ts). Importable UNIQUEMENT côté
                 serveur.

flow:            readBlog → readFile → JSON.parse → migrateToCurrentVersion
                 (v2 → ajoute playlists: [], bump schemaVersion à 3) →
                 blogDocumentSchema.parse (fail-fast) → BlogDocument.
                 mutateBlog(fn) → acquire(blogMutex) → readBlog → fn(doc)
                 → blogDocumentSchema.parse (revalidation) → écriture
                 data/blog.json.tmp → rename → release(blogMutex).

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
                  "@/app/blog/lib/validations.ts",
                  "@/scripts/migrate-blog-v3.ts"]

imports:         ["server-only", "node:fs/promises", "node:path",
                  "@/app/blog/lib/types",
                  "@/app/blog/lib/validations"]

exports:         ["readBlog", "mutateBlog", "blogFilePath",
                  "createEmptyBlogDocument"]

useBy:           ["@/app/blog/lib/admin.ts",
                  "@/app/blog/lib/services/article.ts",
                  "@/app/blog/lib/services/comment.ts",
                  "@/app/blog/lib/services/favorite.ts",
                  "@/app/blog/lib/services/group.ts",
                  "@/app/blog/lib/services/like.ts",
                  "@/app/blog/lib/services/notification.ts",
                  "@/app/blog/lib/services/playlist.ts",
                  "@/app/blog/lib/services/taxonomy.ts"]

userStories:     ["us1100011"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { BlogDocument } from "@/app/blog/lib/types";
import {
  BLOG_SCHEMA_VERSION,
  blogDocumentSchema,
} from "@/app/blog/lib/validations";

/* ------------------------------------------------------------------ */
/*  Chemins                                                           */
/* ------------------------------------------------------------------ */

const DATA_DIR = join(process.cwd(), "data");

export function blogFilePath(): string {
  return join(DATA_DIR, "blog.json");
}

/* ------------------------------------------------------------------ */
/*  Document vide valide                                              */
/* ------------------------------------------------------------------ */

export function createEmptyBlogDocument(): BlogDocument {
  return {
    meta: {
      schemaVersion: BLOG_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      adminIds: [],
    },
    taxonomy: {
      themes: [],
      tags: [],
    },
    playlists: [],
    articles: [],
    groups: [],
    userContent: {},
    auditLog: [],
  };
}

/* ------------------------------------------------------------------ */
/*  Migration v2 → v3 (silencieuse, en mémoire)                       */
/* ------------------------------------------------------------------ */

/**
 * Détecte un document v2 (schemaVersion === 2, playlists absent) et le
 * transforme en v3. Ne lève jamais : si le document n'est pas un objet
 * ou si la version est inconnue, retourne l'objet tel quel (Zod lèvera
 * une erreur explicite derrière).
 */
function migrateToCurrentVersion(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const doc = raw as Record<string, unknown>;
  const meta = doc.meta as Record<string, unknown> | undefined;
  const version =
    typeof meta?.schemaVersion === "number" ? meta.schemaVersion : undefined;

  if (version === undefined || version === BLOG_SCHEMA_VERSION) return raw;

  if (version === 2) {
    return {
      ...doc,
      playlists: Array.isArray(doc.playlists) ? doc.playlists : [],
      meta: {
        ...meta,
        schemaVersion: BLOG_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  return raw;
}

/* ------------------------------------------------------------------ */
/*  Mutex global (un seul slot)                                       */
/* ------------------------------------------------------------------ */

type Resolver = () => void;

let pending: Promise<void> = Promise.resolve();

async function acquire(): Promise<Resolver> {
  let release!: Resolver;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previous = pending;
  pending = pending.then(() => next);
  await previous;
  return release;
}

/* ------------------------------------------------------------------ */
/*  Lecture                                                           */
/* ------------------------------------------------------------------ */

export async function readBlog(): Promise<BlogDocument> {
  const path = blogFilePath();

  try {
    const raw = await readFile(path, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    const migrated = migrateToCurrentVersion(parsed);
    return blogDocumentSchema.parse(migrated) as BlogDocument;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      const empty = createEmptyBlogDocument();
      await writeAtomically(empty);
      return empty;
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/*  Mutation                                                          */
/* ------------------------------------------------------------------ */

export async function mutateBlog<T>(
  fn: (doc: BlogDocument) => BlogDocument | Promise<BlogDocument>,
): Promise<T> {
  const release = await acquire();
  try {
    const current = await readBlog();
    const next = await fn(current);
    const validated = blogDocumentSchema.parse({
      ...next,
      meta: { ...next.meta, updatedAt: new Date().toISOString() },
    }) as BlogDocument;
    await writeAtomically(validated);
    return validated as unknown as T;
  } finally {
    release();
  }
}

/* ------------------------------------------------------------------ */
/*  Écriture atomique                                                 */
/* ------------------------------------------------------------------ */

async function writeAtomically(doc: BlogDocument): Promise<void> {
  const path = blogFilePath();
  const tmp = `${path}.tmp`;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(tmp, JSON.stringify(doc, null, 2), "utf-8");
  await rename(tmp, path);
}
