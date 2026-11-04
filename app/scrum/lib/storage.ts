/*
path :           app/scrum/lib/storage.ts
tag :            ["scrum", "storage", "json", "fs", "server-only"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Seul fichier autorisé à toucher le système de fichiers pour
                 le module Scrum. Lit et écrit les documents JSON de chaque
                 flux. Écriture atomique (fichier temporaire + rename) pour
                 éviter toute corruption. readScrumFile trie chaque tableau
                 (dont le nouveau tableau `task`) par `order` après
                 validation, ce qui garantit que tous les consommateurs
                 (services, actions, pages, Global JSON) reçoivent l'ordre
                 correct sans traitement local. Importable UNIQUEMENT côté
                 serveur.

flow:            readScrumFile(flow) → résout le path → lit → parse +
                 valide → trie chaque tableau par order → retourne. Si
                 absent → crée vide. writeScrumFile(flow, doc) → met à jour
                 meta.updatedAt → écrit dans .tmp → rename atomique.

ecosystem:       Scrum = [
                   "@/app/scrum/lib/actions/epic.ts",
                   "@/app/scrum/lib/actions/feature.ts",
                   "@/app/scrum/lib/actions/global-json.ts",
                   "@/app/scrum/lib/actions/idee.ts",
                   "@/app/scrum/lib/actions/persona.ts",
                   "@/app/scrum/lib/actions/sprint.ts",
                   "@/app/scrum/lib/actions/task.ts",
                   "@/app/scrum/lib/actions/user-story.ts",
                   "@/app/scrum/lib/services/epic.ts",
                   "@/app/scrum/lib/services/feature.ts",
                   "@/app/scrum/lib/services/global-json.ts",
                   "@/app/scrum/lib/services/idee.ts",
                   "@/app/scrum/lib/services/persona.ts",
                   "@/app/scrum/lib/services/sprint.ts",
                   "@/app/scrum/lib/services/task.ts",
                   "@/app/scrum/lib/services/user-story.ts",
                   "@/app/scrum/lib/storage.ts",
                   "@/app/scrum/lib/types.ts",
                   "@/app/scrum/lib/validations.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/validations.ts"]

imports:         ["server-only", "node:fs/promises", "node:path",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/validations"]

exports:         ["scrumFilePath", "readScrumFile", "writeScrumFile"]

useBy:           ["@/app/scrum/lib/services/idee.ts",
                  "@/app/scrum/lib/services/feature.ts",
                  "@/app/scrum/lib/services/persona.ts",
                  "@/app/scrum/lib/services/epic.ts",
                  "@/app/scrum/lib/services/user-story.ts",
                  "@/app/scrum/lib/services/sprint.ts",
                  "@/app/scrum/lib/services/task.ts",
                  "@/app/scrum/lib/services/global-json.ts"]

userStories:     ["*en tant que développeur je veux lire et écrire les JSON Scrum de manière atomique"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import {
  createEmptyScrumDocument,
  SCRUM_FLOWS,
  SCRUM_SCHEMA_VERSION,
  type ScrumDocument,
  type ScrumFlow,
} from "@/app/scrum/lib/types";
import { scrumDocumentSchema } from "@/app/scrum/lib/validations";

/* ------------------------------------------------------------------ */
/*  Chemins                                                            */
/* ------------------------------------------------------------------ */

const DATA_DIR = join(process.cwd(), "data");

export function scrumFilePath(flow: ScrumFlow): string {
  return join(DATA_DIR, `${flow}.json`);
}

/* ------------------------------------------------------------------ */
/*  Garde-fou runtime                                                  */
/* ------------------------------------------------------------------ */

function assertValidFlow(flow: string): asserts flow is ScrumFlow {
  if (!SCRUM_FLOWS.includes(flow as ScrumFlow)) {
    throw new Error(
      `[scrum/storage] Flow inconnu : "${flow}". Attendu : ${SCRUM_FLOWS.join(", ")}.`,
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Lecture                                                            */
/* ------------------------------------------------------------------ */

export async function readScrumFile(flow: ScrumFlow): Promise<ScrumDocument> {
  assertValidFlow(flow);

  const path = scrumFilePath(flow);

  try {
    const raw = await readFile(path, "utf-8");
    const parsed = JSON.parse(raw);
    const validated = scrumDocumentSchema.safeParse(parsed);

    if (!validated.success) {
      throw new Error(
        `[scrum/storage] Document invalide (${flow}) : ${validated.error.message}`,
      );
    }

    // Tri stable par `order` sur chaque tableau. Les items sans `order`
    // (documents antérieurs) ont reçu `order: 0` via le `.default(0)` du
    // schéma Zod ; leur ordre d'insertion initial est préservé par la
    // stabilité du tri natif Array.prototype.sort (ES2019+).
    const sorted: ScrumDocument = {
      idea: [...validated.data.idea].sort((a, b) => a.order - b.order),
      feature: [...validated.data.feature].sort((a, b) => a.order - b.order),
      persona: [...validated.data.persona].sort((a, b) => a.order - b.order),
      epic: [...validated.data.epic].sort((a, b) => a.order - b.order),
      userStory: [...validated.data.userStory].sort(
        (a, b) => a.order - b.order,
      ),
      sprint: [...validated.data.sprint].sort((a, b) => a.order - b.order),
      task: [...validated.data.task].sort((a, b) => a.order - b.order), // ← AJOUT
      meta: validated.data.meta,
    };

    return sorted;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      const empty = createEmptyScrumDocument();
      await writeScrumFile(flow, empty);
      return empty;
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/*  Écriture atomique                                                  */
/* ------------------------------------------------------------------ */

export async function writeScrumFile(
  flow: ScrumFlow,
  doc: ScrumDocument,
): Promise<void> {
  assertValidFlow(flow);

  const path = scrumFilePath(flow);
  const tmpPath = `${path}.tmp`;

  const finalDoc: ScrumDocument = {
    ...doc,
    meta: {
      schemaVersion: SCRUM_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
    },
  };

  await mkdir(dirname(path), { recursive: true });
  await writeFile(tmpPath, JSON.stringify(finalDoc, null, 2), "utf-8");
  await rename(tmpPath, path);
}
