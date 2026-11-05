/*
path :           app/scrum/lib/actions/section-json.ts
tag :            ["scrum", "action", "section-json", "server-action", "persist"]
projectId :      <à fournir>
type:            action
generic:         false

role:            Server Action GÉNÉRIQUE pour l'édition JSON en masse
                 d'UNE section d'un flux Scrum. Remplace intégralement
                 le tableau de la section (pas de fusion par id) après
                 validation Zod et après avoir injecté les champs
                 système (id, order, createdAt, updatedAt) pour les
                 items qui n'en ont pas — ce qui permet à l'utilisateur
                 de coller uniquement les champs métier (ex. { name,
                 goal, scope, personas } pour un epic) sans devoir
                 générer un id. Utilise writeScrumFile (écriture
                 atomique déjà en place) et revalide la page de la
                 section concernée. Aucune réécriture du document
                 entier : seuls les champs de la section sont modifiés.
                 Le meta.schemaVersion/updatedAt est géré par
                 writeScrumFile (jamais exposé dans le JSON éditable).

flow:            updateSectionJsonAction(flow, section, rawJson) →
                 JSON.parse → si non-tableau : erreur → Zod parse via
                 getSectionArraySchema(section) → normalisation
                 (id/order/timestamps injectés si absents, tri stable
                 par order) → readScrumFile → remplace
                 doc[section] par la nouvelle valeur → writeScrumFile
                 → revalidateScrumFlow(flow, section) → ActionResult.

ecosystem:       Scrum = [
                   "@/app/scrum/lib/actions/section-json.ts",
                   "@/app/scrum/lib/actions/_helpers.ts",
                   "@/app/scrum/lib/validations.ts",
                   "@/app/scrum/lib/validations/sections.ts",
                   "@/app/scrum/lib/storage.ts",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/actions/_helpers.ts",
                  "@/app/scrum/lib/validations.ts",
                  "@/app/scrum/lib/validations/sections.ts",
                  "@/app/scrum/lib/storage.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["node:crypto",
                  "@/app/scrum/lib/actions/_helpers",
                  "@/app/scrum/lib/validations/sections",
                  "@/app/scrum/lib/storage",
                  "@/app/scrum/lib/types"]

exports:         ["updateSectionJsonAction"]

useBy:           ["@/components/scrum/SectionJsonEditor.tsx"]

userStories:     ["*en tant que développeur je veux éditer le JSON d'une section Scrum via une Server Action"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use server";

import { randomUUID } from "node:crypto";

import {
  handleActionError,
  revalidateScrumFlow,
  type ActionResult,
} from "@/app/scrum/lib/actions/_helpers";
import {
  EDITABLE_SECTIONS,
  getSectionArraySchema,
  type EditableSection,
} from "@/app/scrum/lib/validations/sections";
import { readScrumFile, writeScrumFile } from "@/app/scrum/lib/storage";
import type { ScrumDocument, ScrumFlow } from "@/app/scrum/lib/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

interface WithSystemFields {
  id?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Injecte id/order/timestamps manquants et normalise l'ordre (0..n-1
 * stable). Les items existants (id déjà présent) conservent leur id et
 * leurs timestamps (sauf updatedAt réécrit). C'est ce qui permet à
 * l'utilisateur de coller uniquement les champs métier.
 */
function normalizeSectionItems(
  rawItems: readonly WithSystemFields[],
): readonly WithSystemFields[] {
  const ts = nowIso();
  return rawItems.map((item, index) => ({
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : randomUUID(),
    order: typeof item.order === "number" ? item.order : index,
    createdAt:
      typeof item.createdAt === "string" && item.createdAt.length > 0
        ? item.createdAt
        : ts,
    updatedAt: ts,
    ...item,
  }));
}

/* ------------------------------------------------------------------ */
/*  Action                                                             */
/* ------------------------------------------------------------------ */

/**
 * Remplace intégralement le tableau d'une section Scrum à partir du
 * JSON fourni par l'utilisateur.
 *
 * - Le JSON DOIT être un tableau.
 * - Chaque item est validé par le schéma d'input de la section
 *   (mêmes règles que le formulaire). Les champs système manquants
 *   (id, order, createdAt, updatedAt) sont injectés côté serveur.
 * - Le meta du document n'est PAS exposé : writeScrumFile le réécrit.
 */
export async function updateSectionJsonAction(
  flow: ScrumFlow,
  section: EditableSection,
  rawJson: string,
): Promise<ActionResult<readonly WithSystemFields[]>> {
  try {
    if (!(EDITABLE_SECTIONS as readonly string[]).includes(section)) {
      throw new Error(`Section non éditable : "${section}".`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch (error) {
      throw new Error(
        `JSON mal formé : ${error instanceof Error ? error.message : "erreur inconnue"}`,
      );
    }

    if (!Array.isArray(parsed)) {
      throw new Error(
        "Le JSON doit être un tableau (array) d'objets pour cette section.",
      );
    }

    const schema = getSectionArraySchema(section);
    const validated = schema.safeParse(parsed);
    if (!validated.success) {
      throw new Error(`JSON non conforme : ${validated.error.message}`);
    }

    const normalized = normalizeSectionItems(
      validated.data as WithSystemFields[],
    );

    const doc = await readScrumFile(flow);
    const nextDoc: ScrumDocument = {
      ...doc,
      [section]: normalized,
    } as ScrumDocument;

    await writeScrumFile(flow, nextDoc);
    revalidateScrumFlow(flow, section);

    return { ok: true, data: normalized };
  } catch (error) {
    return handleActionError(error);
  }
}