/*
path :           app/blog/lib/storage.ts
tag :            ["blog", "storage", "atomic", "mutex", "migration", "articles", "server-only", "race-condition"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Seul fichier autorisé à toucher data/blog/. Depuis le split
                 articles :

                 - `data/blog/_index.json` : document résiduel (meta, taxonomy,
                   playlists, groups, userContent, auditLog). Toujours
                   `articles: []`. Lu/écrit par readBlog() / mutateBlog()
                   avec le mutex global historique.
                 - `data/blog/[slug].json` : un fichier par article (avec
                   comments[], likedBy[], viewCount, content[]). Lu/écrit
                   par readArticleFile / writeArticleFile / mutateArticleFile
                   avec un MUTEX PAR ARTICLE (withArticleLock).
                 - `withGlobalArticleLock` : réutilise le mutex global pour
                   sérialiser l'attribution d'`order` lors des créations
                   concurrentes (createArticle).

                 ⚠️ ANTI-RACE sur le premier accès : writeAtomically génère
                 un nom de fichier temporaire UNIQUE par écriture
                 (`${path}.${uuid}.tmp`). Sans cela, deux readBlog()
                 simultanés sur un data/blog/ vide écrivaient tous les
                 deux le même `.tmp`, puis le premier rename le consommait
                 et le second levait ENOENT (source disparue) sur Windows.
                 Le `.tmp` est également supprimé si le rename échoue.
                 Et si la création initiale échoue parce qu'un autre
                 appelant a gagné la course, readBlog() relit le fichier
                 fraîchement créé au lieu de propager l'erreur.

                 ⚠️ MIGRATION : scripts/migrate-blog-split-articles.ts doit
                 être exécuté AVANT ce code (sinon le blog apparaît vide
                 jusqu'à exécution du script).

flow:            readBlog → readFile(_index.json) → migrateToCurrentVersion
                 → blogDocumentSchema.parse → BlogDocument.
                 ENOENT → writeAtomically(empty) :
                   - succès → retourne empty ;
                   - échec → re-tente une lecture (course gagnée par un
                     autre appelant) → si succès, retourne ; sinon relance
                     l'erreur d'écriture.
                 mutateBlog(fn) → acquire(global) → readBlog → fn → parse
                 → writeAtomically → release.
                 readArticleFile(slug) → readFile(blog/[slug].json) →
                 articleSchema.parse → Article | null (ENOENT → null).
                 writeArticleFile(article) → articleSchema.parse (revalidation
                 arbres) → writeAtomically(blog/[slug].json).
                 deleteArticleFile(slug) → unlink (ignore ENOENT).
                 listArticleFiles → readdir → readArticleFile × N → tri order.
                 mutateArticleFile(slug, fn) → withArticleLock(slug) →
                 readArticleFile → fn → parse → writeArticleFile → release.
                 withGlobalArticleLock(fn) → acquire(global) → fn → release.

ecosystem:       BlogCore = [
                   "@/app/blog/lib/admin.ts",
                   "@/app/blog/lib/ecosystem.ts",
                   "@/app/blog/lib/media-url.ts",
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
                  "@/scripts/migrate-blog-split-articles.ts"]

imports:         ["server-only", "node:fs/promises", "node:path",
                  "@/app/blog/lib/types",
                  "@/app/blog/lib/validations"]

exports:         ["readBlog", "mutateBlog", "blogFilePath",
                  "createEmptyBlogDocument",
                  "articleFilePath", "readArticleFile", "writeArticleFile",
                  "deleteArticleFile", "listArticleFiles",
                  "mutateArticleFile", "withGlobalArticleLock"]

useBy:           ["@/app/blog/lib/admin.ts",
                  "@/app/blog/lib/services/article.ts",
                  "@/app/blog/lib/services/comment.ts",
                  "@/app/blog/lib/services/favorite.ts",
                  "@/app/blog/lib/services/group.ts",
                  "@/app/blog/lib/services/like.ts",
                  "@/app/blog/lib/services/notification.ts",
                  "@/app/blog/lib/services/playlist.ts",
                  "@/app/blog/lib/services/taxonomy.ts"]

userStories:     ["us1100011",
                  "*en tant que développeur je veux un article par fichier JSON",
                  "*en tant que développeur je veux que readBlog soit sûr face aux appels concurrents"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import "server-only";

import {
  mkdir,
  readFile,
  readdir,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";

import type { Article, BlogDocument } from "@/app/blog/lib/types";
import {
  BLOG_SCHEMA_VERSION,
  articleSchema,
  blogDocumentSchema,
} from "@/app/blog/lib/validations";

/* ------------------------------------------------------------------ */
/*  Chemins                                                           */
/* ------------------------------------------------------------------ */

const DATA_DIR = join(process.cwd(), "data");
const ARTICLES_DIR = join(DATA_DIR, "blog");

/** Chemin du document résiduel (meta, taxonomy, playlists, groups, …). */
export function blogFilePath(): string {
  return join(ARTICLES_DIR, "_index.json");
}

/** Chemin du fichier d'un article (`data/blog/[slug].json`). */
export function articleFilePath(slug: string): string {
  return join(ARTICLES_DIR, `${slug}.json`);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function isENOENT(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

/* ------------------------------------------------------------------ */
/*  Document vide valide (résiduel, articles: [])                     */
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
/*  Migration v2 → v3 (silencieuse, en mémoire)                      */
/* ------------------------------------------------------------------ */

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
/*  Mutex global (document résiduel + créations d'articles)          */
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

/**
 * Sérialise une section critique globale : réutilise le mutex du document
 * résiduel. Utilisé par createArticle pour allouer un `order` sans race
 * avec les autres créations (mais SANS bloquer les mutations par article,
 * qui utilisent withArticleLock).
 */
export async function withGlobalArticleLock<T>(
  fn: () => Promise<T>,
): Promise<T> {
  const release = await acquire();
  try {
    return await fn();
  } finally {
    release();
  }
}

/* ------------------------------------------------------------------ */
/*  Mutex par article                                                 */
/* ------------------------------------------------------------------ */

const articleLocks = new Map<string, Promise<void>>();

async function withArticleLock<T>(
  slug: string,
  fn: () => Promise<T>,
): Promise<T> {
  const previous = articleLocks.get(slug) ?? Promise.resolve();
  let release!: Resolver;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = previous.then(() => current);
  articleLocks.set(slug, chained);
  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (articleLocks.get(slug) === chained) {
      articleLocks.delete(slug);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Lecture du document résiduel                                     */
/* ------------------------------------------------------------------ */

export async function readBlog(): Promise<BlogDocument> {
  const path = blogFilePath();

  try {
    const raw = await readFile(path, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    const migrated = migrateToCurrentVersion(parsed);
    return blogDocumentSchema.parse(migrated) as BlogDocument;
  } catch (error) {
    if (!isENOENT(error)) throw error;

    /* Fichier absent : on tente de le créer.
       writeAtomically utilise un .tmp UNIQUE par écriture, donc deux
       readBlog() simultanés ne peuvent plus se marcher dessus. */
    try {
      const empty = createEmptyBlogDocument();
      await writeAtomically(empty);
      return empty;
    } catch (writeError) {
      /* Course gagnée par un autre appelant : le fichier existe
         peut-être déjà. On relit — si succès, c'est gagné. */
      try {
        const raw = await readFile(path, "utf-8");
        const parsed: unknown = JSON.parse(raw);
        const migrated = migrateToCurrentVersion(parsed);
        return blogDocumentSchema.parse(migrated) as BlogDocument;
      } catch {
        /* Vraie erreur d'écriture : on la propage pour diagnostic. */
        throw writeError;
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Mutation du document résiduel                                    */
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
/*  Écriture atomique (nom de .tmp UNIQUE par appel)                 */
/* ------------------------------------------------------------------ */

/**
 * Écrit `doc` de manière atomique dans `data/blog/_index.json`.
 *
 * ⚠️ Le nom du fichier temporaire inclut un UUID : deux writeAtomically
 * concurrents (cas de readBlog() sur un blog vide appelé en parallèle
 * par plusieurs composants) ne partagent plus le même `.tmp`. Sans cela,
 * le premier rename consommait le `.tmp` et le second levait
 * « ENOENT : rename ... -> ... » sur Windows.
 *
 * En cas d'échec du rename, le `.tmp` est supprimé pour ne pas laisser
 * de fichiers orphelins.
 */
async function writeAtomically(doc: BlogDocument): Promise<void> {
  const path = blogFilePath();
  const tmp = `${path}.${crypto.randomUUID()}.tmp`;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(tmp, JSON.stringify(doc, null, 2), "utf-8");
  try {
    await rename(tmp, path);
  } catch (error) {
    await unlink(tmp).catch(() => {
      /* ignore : le .tmp peut déjà avoir été déplacé par un rename concurrent */
    });
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/*  Lecture d'un article                                              */
/* ------------------------------------------------------------------ */

/**
 * Lit `data/blog/[slug].json` et valide via articleSchema (arbres
 * content[]/comments[] inclus). Retourne null si le fichier n'existe pas
 * (l'appelant décide du 404).
 */
export async function readArticleFile(slug: string): Promise<Article | null> {
  try {
    const raw = await readFile(articleFilePath(slug), "utf-8");
    return articleSchema.parse(JSON.parse(raw)) as Article;
  } catch (error) {
    if (isENOENT(error)) return null;
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/*  Écriture atomique d'un article                                   */
/* ------------------------------------------------------------------ */

/**
 * Revalide l'article (arbres inclus) puis écrit atomiquement
 * data/blog/[slug].json. Lève si la structure est invalide — c'est le
 * garde-fou qui remplace l'ancien superRefine de blogDocumentSchema.
 *
 * Le `.tmp` est unique par écriture (UUID), comme pour le document
 * résiduel : même si un appelant contournait avecArticleLock, deux
 * writes concurrents ne se marcheraient pas dessus.
 */
export async function writeArticleFile(article: Article): Promise<void> {
  const validated = articleSchema.parse(article) as Article;
  const path = articleFilePath(validated.slug);
  const tmp = `${path}.${crypto.randomUUID()}.tmp`;
  await mkdir(ARTICLES_DIR, { recursive: true });
  await writeFile(tmp, JSON.stringify(validated, null, 2), "utf-8");
  try {
    await rename(tmp, path);
  } catch (error) {
    await unlink(tmp).catch(() => {
      /* ignore */
    });
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/*  Suppression d'un article                                         */
/* ------------------------------------------------------------------ */

export async function deleteArticleFile(slug: string): Promise<void> {
  try {
    await unlink(articleFilePath(slug));
  } catch (error) {
    if (!isENOENT(error)) throw error;
  }
}

/* ------------------------------------------------------------------ */
/*  Liste de tous les articles                                       */
/* ------------------------------------------------------------------ */

/**
 * Lit tous les fichiers `data/blog/[slug].json` (ignore `_index.json`
 * et les fichiers commençant par `_`), les trie par `order` croissant.
 * Coût O(n) en I/O — acceptable pour un blog local.
 */
export async function listArticleFiles(): Promise<readonly Article[]> {
  let entries: string[];
  try {
    entries = await readdir(ARTICLES_DIR);
  } catch (error) {
    if (isENOENT(error)) return [];
    throw error;
  }

  const files = entries.filter(
    (entry) => entry.endsWith(".json") && !entry.startsWith("_"),
  );
  const articles = await Promise.all(
    files.map((file) => readArticleFile(file.replace(/\.json$/, ""))),
  );
  return articles
    .filter((a): a is Article => a !== null)
    .sort((a, b) => a.order - b.order);
}

/* ------------------------------------------------------------------ */
/*  Mutation ciblée d'un article                                     */
/* ------------------------------------------------------------------ */

/**
 * Section critique PAR ARTICLE : lit le fichier, applique `fn`, revalide,
 * réécrit. Deux articles différents mutent en parallèle sans se bloquer.
 * Lève si l'article n'existe pas (l'appelant doit avoir vérifié avant).
 */
export async function mutateArticleFile(
  slug: string,
  fn: (article: Article) => Article | Promise<Article>,
): Promise<Article> {
  return withArticleLock(slug, async () => {
    const current = await readArticleFile(slug);
    if (!current) {
      throw new Error(`[blog/storage] Article introuvable : ${slug}`);
    }
    const next = await fn(current);
    const validated = articleSchema.parse({
      ...next,
      updatedAt: new Date().toISOString(),
    }) as Article;
    await writeArticleFile(validated);
    return validated;
  });
}
