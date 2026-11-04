/*
path :           scripts/migrate-blog-split-articles.ts
tag :            ["script", "migration", "blog", "storage", "one-shot", "split-files"]
projectId:       new-genesis
type:            config
generic:         false

role:            Migration one-shot de l'ancien format data/blog.json
                 (articles[] embarqués) vers le nouveau format :
                 - data/blog/[slug].json : un fichier par article (avec
                   comments[], likedBy[], viewCount, content[]).
                 - data/blog/_index.json : document résiduel (meta,
                   taxonomy, playlists, groups, userContent, auditLog,
                   articles: []).

                 Idempotent : ne réécrit pas les fichiers article déjà
                 présents (mais réécrit toujours _index.json pour rester
                 source de vérité). Un fichier data/blog.json.bak est
                 produit (renommage de l'ancien) — jamais de suppression.

                 ⚠️ À EXÉCUTER AVANT de déployer le nouveau storage.ts :
                 sinon readBlog() crée un _index.json vide et le blog
                 apparaît vide jusqu'à l'exécution du script.

flow:            readFile(data/blog.json) → si ENOENT : exit 0 (déjà
                 migré, message informatif) → JSON.parse → pour chaque
                 article du tableau articles[] : writeFile
                 (data/blog/<slug>.json) si non existant (préserve les
                 versions déjà migrées) → construire le document résiduel
                 sans articles[] → writeFile (data/blog/_index.json) →
                 rename (data/blog.json → data/blog.json.bak) → log.

ecosystem:       BlogMigration = [
                   "@/scripts/migrate-blog-split-articles.ts",
                 ]

relatedFiles:    ["@/app/blog/lib/storage.ts",
                  "@/app/blog/lib/validations.ts"]

imports:         ["node:fs/promises", "node:path"]

exports:         []

useBy:           []

userStories:     ["*en tant que développeur je veux migrer data/blog.json vers data/blog/[slug].json"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

/* ------------------------------------------------------------------ */
/*  Chemins                                                           */
/* ------------------------------------------------------------------ */

const ROOT = process.cwd();
const DATA_DIR = join(ROOT, "data");
const LEGACY_FILE = join(DATA_DIR, "blog.json");
const BLOG_DIR = join(DATA_DIR, "blog");
const INDEX_FILE = join(BLOG_DIR, "_index.json");
const BACKUP_FILE = `${LEGACY_FILE}.bak`;

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

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Migration                                                         */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  /* 1. Lire l'ancien fichier. */
  let raw: string;
  try {
    raw = await readFile(LEGACY_FILE, "utf-8");
  } catch (error) {
    if (isENOENT(error)) {
      console.log(
        "ℹ️  data/blog.json introuvable — migration déjà effectuée ou blog vide.",
      );
      return;
    }
    throw error;
  }

  const doc = JSON.parse(raw) as Record<string, unknown>;
  const articles = Array.isArray(doc.articles)
    ? (doc.articles as unknown[])
    : [];

  await mkdir(BLOG_DIR, { recursive: true });

  /* 2. Écrire chaque article dans son propre fichier. */
  let written = 0;
  let skipped = 0;
  for (const item of articles) {
    const article = item as { slug?: string };
    if (!article.slug) {
      console.warn("⚠️  Article sans slug — ignoré.");
      continue;
    }
    const target = join(BLOG_DIR, `${article.slug}.json`);

    if (await fileExists(target)) {
      skipped++;
      continue;
    }

    await writeFile(target, JSON.stringify(item, null, 2), "utf-8");
    written++;
  }
  console.log(
    `✅ ${written} article(s) écrit(s), ${skipped} déjà présent(s) (ignoré(s)).`,
  );

  /* 3. Écrire le document résiduel (_index.json) sans articles[]. */
  const { articles: _discarded, ...residual } = doc;
  await writeFile(
    INDEX_FILE,
    JSON.stringify({ ...residual, articles: [] }, null, 2),
    "utf-8",
  );
  console.log("✅ data/blog/_index.json écrit (articles: []).");

  /* 4. Backup de l'ancien fichier (jamais de perte). */
  await rename(LEGACY_FILE, BACKUP_FILE);
  console.log(`✅ Backup : ${BACKUP_FILE}`);
}

main().catch((error) => {
  console.error("❌ Migration échouée :", error);
  process.exit(1);
});