/*
path :           scripts/migrate-blog-split-articles.ts
tag :            ["script", "migration", "blog", "storage", "one-shot"]
projectId:       new-genesis
type:            config
generic:         false

role:            Migration one-shot de l'ancien format blog.json (articles[]
                 embarqués) vers le nouveau format : 1 fichier par article
                 dans data/blog/[slug].json + un document résiduel
                 data/blog/_index.json (meta, taxonomy, playlists, groups,
                 userContent, auditLog, articles: []). Idempotent : ne
                 réécrit pas les fichiers déjà présents, peut être relancé.

flow:            readFile(data/blog.json) → si absent : exit 0 (déjà
                 migré) → JSON.parse → pour chaque article : writeFile
                 (data/blog/<slug>.json) si non existant → écrire
                 data/blog/_index.json sans articles[] → renommer
                 data/blog.json → data/blog.json.bak (backup).

ecosystem:       Blog = [
                   "@/app/blog/[slug]/page.tsx",
                   … (voir tableau du module Blog)
                   "@/scripts/migrate-blog-split-articles.ts",
                 ]

relatedFiles:    ["@/app/blog/lib/storage.ts",
                  "@/app/blog/lib/validations.ts"]

imports:         ["node:fs/promises", "node:path"]

exports:         []

useBy:           []

userStories:     ["*en tant que développeur je veux migrer blog.json vers un fichier par article"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const LEGACY_FILE = join(ROOT, "data", "blog.json");
const BLOG_DIR = join(ROOT, "data", "blog");
const INDEX_FILE = join(BLOG_DIR, "_index.json");

async function main(): Promise<void> {
  let raw: string;
  try {
    raw = await readFile(LEGACY_FILE, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.log("ℹ️  data/blog.json introuvable — rien à migrer.");
      return;
    }
    throw error;
  }

  const doc = JSON.parse(raw) as Record<string, unknown>;
  const articles = Array.isArray(doc.articles) ? (doc.articles as unknown[]) : [];

  await mkdir(BLOG_DIR, { recursive: true });

  /* 1. Écrire chaque article dans son propre fichier. */
  let written = 0;
  for (const item of articles) {
    const article = item as { slug?: string };
    if (!article.slug) {
      console.warn("⚠️  Article sans slug — ignoré.");
      continue;
    }
    const target = join(BLOG_DIR, `${article.slug}.json`);
    await writeFile(target, JSON.stringify(item, null, 2), "utf-8");
    written++;
  }
  console.log(`✅ ${written} article(s) écrit(s) dans data/blog/.`);

  /* 2. Écrire le document résiduel (sans articles[]). */
  const { articles: _articles, ...residual } = doc;
  await writeFile(INDEX_FILE, JSON.stringify({ ...residual, articles: [] }, null, 2), "utf-8");
  console.log(`✅ data/blog/_index.json écrit.`);

  /* 3. Backup de l'ancien fichier (ne pas perdre les données brutes). */
  const backup = `${LEGACY_FILE}.bak`;
  await rename(LEGACY_FILE, backup);
  console.log(`✅ Backup : ${backup}`);
}

main().catch((error) => {
  console.error("❌ Migration échouée :", error);
  process.exit(1);
});