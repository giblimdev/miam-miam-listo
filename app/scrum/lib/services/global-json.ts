/*
path :           app/scrum/lib/services/global-json.ts
tag :            ["scrum", "service", "global-json", "export", "persist"]
projectId:       new-genesis
type:            helper
generic:         true 

role:            Service d'export et de persistance du document Scrum complet.
                 Expose getGlobalJson (document tel quel), serializeGlobalJson
                 (chaîne JSON indentée 2 espaces) et saveGlobalJson (parse le
                 JSON fourni, injecte un meta frais, valide via Zod, puis écrit
                 de manière atomique via storage). Seul point d'entrée d'écriture
                 pour le flux Global JSON.

flow:            getGlobalJson(flow) → readScrumFile → ScrumDocument.
                 serializeGlobalJson(flow) → readScrumFile → JSON.stringify(doc, null, 2).
                 saveGlobalJson(flow, rawJson) → JSON.parse → garde-fou racine objet
                 → injection meta frais (schemaVersion + updatedAt) → scrumDocumentSchema
                 .safeParse → writeScrumFile (atomique tmp + rename) → ScrumDocument validé.

ecosystem:       Scrum = [
                   "@/app/scrum/lib/actions/epic.ts",
                   "@/app/scrum/lib/actions/feature.ts",
                   "@/app/scrum/lib/actions/global-json.ts",
                   "@/app/scrum/lib/actions/idee.ts",
                   "@/app/scrum/lib/actions/persona.ts",
                   "@/app/scrum/lib/actions/sprint.ts",
                   "@/app/scrum/lib/actions/user-story.ts",
                   "@/app/scrum/lib/services/epic.ts",
                   "@/app/scrum/lib/services/feature.ts",
                   "@/app/scrum/lib/services/global-json.ts",
                   "@/app/scrum/lib/services/idee.ts",
                   "@/app/scrum/lib/services/persona.ts",
                   "@/app/scrum/lib/services/sprint.ts",
                   "@/app/scrum/lib/services/user-story.ts",
                   "@/app/scrum/lib/services/storage.ts",
                   "@/app/scrum/lib/services/types.ts",
                   "@/app/scrum/lib/validations.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/storage.ts",
                  "@/app/scrum/lib/validations.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["@/app/scrum/lib/services/storage",
                  "@/app/scrum/lib/validations",
                  "@/app/scrum/lib/types"]

exports:         ["getGlobalJson", "serializeGlobalJson", "saveGlobalJson"]

useBy:           ["@/app/scrum/lib/actions/global-json.ts"]

userStories:     ["*en tant que développeur je veux exporter et persister le document Scrum complet"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { readScrumFile, writeScrumFile } from "@/app/scrum/lib/storage";
import { scrumDocumentSchema } from "@/app/scrum/lib/validations";
import {
  SCRUM_SCHEMA_VERSION,
  type ScrumDocument,
  type ScrumFlow,
} from "@/app/scrum/lib/types";

/* ------------------------------------------------------------------ */
/*  Lecture                                                            */
/* ------------------------------------------------------------------ */

export async function getGlobalJson(flow: ScrumFlow): Promise<ScrumDocument> {
  return readScrumFile(flow);
}

/* ------------------------------------------------------------------ */
/*  Sérialisation                                                      */
/* ------------------------------------------------------------------ */

export async function serializeGlobalJson(flow: ScrumFlow): Promise<string> {
  const doc = await readScrumFile(flow);
  return JSON.stringify(doc, null, 2);
}

/* ------------------------------------------------------------------ */
/*  Persistance                                                        */
/* ------------------------------------------------------------------ */

/**
 * Parse le JSON brut fourni par l'utilisateur, le valide via Zod,
 * puis l'écrit de manière atomique (writeScrumFile : tmp + rename).
 *
 * - meta est ignoré : writeScrumFile le réécrit de toute façon
 *   (schemaVersion + updatedAt), donc un meta absent ou obsolète côté
 *   utilisateur ne doit pas bloquer l'enregistrement.
 * - Lève une erreur explicite si le JSON est mal formé, si la racine
 *   n'est pas un objet, ou si la forme ne respecte pas le schéma.
 */
export async function saveGlobalJson(
  flow: ScrumFlow,
  rawJson: string,
): Promise<ScrumDocument> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (error) {
    throw new Error(
      `JSON mal formé : ${error instanceof Error ? error.message : "erreur inconnue"}`,
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(
      "Document non conforme : la racine doit être un objet JSON.",
    );
  }

  // meta est toujours réécrit par writeScrumFile : on injecte une valeur
  // fraîche AVANT validation pour ne pas bloquer l'utilisateur sur un
  // champ qui sera de toute façon normalisé côté serveur.
  const candidate = {
    ...(parsed as Record<string, unknown>),
    meta: {
      schemaVersion: SCRUM_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
    },
  };

  const validated = scrumDocumentSchema.safeParse(candidate);
  if (!validated.success) {
    throw new Error(`Document non conforme : ${validated.error.message}`);
  }

  const doc = validated.data as ScrumDocument;
  await writeScrumFile(flow, doc);
  return doc;
}
