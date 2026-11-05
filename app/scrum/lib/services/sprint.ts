/*
path :           app/scrum/lib/services/sprint.ts
tag :            ["scrum", "service", "sprint", "crud", "reorder", "custom-update", "move"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD + reorder + move pour la section "sprint"
                 du module Scrum. L'édition est SCINDÉE en deux
                 opérations indépendantes (méta / stories) — donc on
                 n'utilise PAS le update générique de la factory.
                 list / create / delete / reorder délèguent à
                 makeCrudService ; updateSprintMeta et updateSprintStories
                 restent des fonctions dédiées (validation de storyId,
                 unicité inter-sprints). moveStoryToSprint est AJOUTÉE
                 pour le board DnD US↔Sprint (/sprint/board) :
                 rattache ou détache une US d'un sprint, en garantissant
                 l'unicité (une US ne peut être que dans un seul sprint).

flow:            makeCrudService("sprint", sprintInputSchema) → base.
                 Exports : base.list / base.create / base.delete /
                 base.reorder aliasés (listSprints, createSprint,
                 deleteSprint, reorderSprints).
                 updateSprintMeta(flow, id, input) → parse méta (sans
                 storyIds) → find + replace → write.
                 updateSprintStories(flow, id, storyIds) → parse → valide
                 chaque storyId → retire des autres sprints (unicité) →
                 réassigne au sprint courant → write.
                 moveStoryToSprint(flow, storyId, sprintId | null) :
                 - si sprintId !== null : vérifie que le sprint existe,
                   valide que storyId existe, retire l'US de tous les
                   autres sprints, l'ajoute en fin du sprint cible.
                 - si sprintId === null : retire l'US de tous les
                   sprints (retour au backlog).
                 → write → retourne { storyId, sprintId }.

ecosystem:       Scrum = [
                   "@/app/scrum/lib/actions/epic.ts",
                   "@/app/scrum/lib/actions/feature.ts",
                   "@/app/scrum/lib/actions/global-json.ts",
                   "@/app/scrum/lib/actions/idee.ts",
                   "@/app/scrum/lib/actions/persona.ts",
                   "@/app/scrum/lib/actions/sprint.ts",
                   "@/app/scrum/lib/actions/task.ts",
                   "@/app/scrum/lib/actions/user-story.ts",
                   "@/app/scrum/lib/services/_crud.ts",
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

relatedFiles:    ["@/app/scrum/lib/services/_crud.ts",
                  "@/app/scrum/lib/storage.ts",
                  "@/app/scrum/lib/types.ts",
                  "@/app/scrum/lib/validations.ts"]

imports:         ["@/app/scrum/lib/services/_crud",
                  "@/app/scrum/lib/storage",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/validations"]

exports:         ["listSprints", "createSprint", "updateSprintMeta",
                  "updateSprintStories", "deleteSprint", "reorderSprints",
                  "moveStoryToSprint"]

useBy:           ["@/app/scrum/lib/actions/sprint.ts"]

userStories:     ["*en tant que développeur je veux CRUD et réorganiser les sprints Scrum",
                  "*en tant qu'utilisateur je veux déplacer une US entre backlog et sprint"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { makeCrudService } from "@/app/scrum/lib/services/_crud";
import { readScrumFile, writeScrumFile } from "@/app/scrum/lib/storage";
import type { ScrumFlow, Sprint } from "@/app/scrum/lib/types";
import {
  sprintInputSchema,
  sprintMetaInputSchema,
  sprintStoriesInputSchema,
  type SprintMetaInput,
} from "@/app/scrum/lib/validations";

/* ------------------------------------------------------------------ */
/*  CRUD de base (list / create / delete / reorder)                    */
/* ------------------------------------------------------------------ */

const base = makeCrudService("sprint", sprintInputSchema);

export const listSprints = base.list;
export const createSprint = base.create;
export const deleteSprint = base.delete;
export const reorderSprints = base.reorder;

/* ------------------------------------------------------------------ */
/*  Édition méta (nom, objectif, dates) — sans toucher aux storyIds    */
/* ------------------------------------------------------------------ */

export async function updateSprintMeta(
  flow: ScrumFlow,
  id: string,
  input: SprintMetaInput,
): Promise<Sprint> {
  const valid = sprintMetaInputSchema.parse(input);
  const doc = await readScrumFile(flow);

  const existing = doc.sprint.find((item) => item.id === id);
  if (!existing) {
    throw new Error(`[scrum/sprint] Sprint introuvable : ${id}`);
  }

  const updated: Sprint = {
    ...existing,
    name: valid.name,
    goal: valid.goal,
    startDate: valid.startDate,
    endDate: valid.endDate,
    updatedAt: new Date().toISOString(),
  };

  const next = doc.sprint.map((item) => (item.id === id ? updated : item));
  await writeScrumFile(flow, { ...doc, sprint: next });
  return updated;
}

/* ------------------------------------------------------------------ */
/*  Édition des US (board DnD de l'éditeur) — retire des autres        */
/* ------------------------------------------------------------------ */

export async function updateSprintStories(
  flow: ScrumFlow,
  id: string,
  storyIds: readonly string[],
): Promise<Sprint> {
  const valid = sprintStoriesInputSchema.parse({ storyIds });
  const doc = await readScrumFile(flow);

  const existing = doc.sprint.find((item) => item.id === id);
  if (!existing) {
    throw new Error(`[scrum/sprint] Sprint introuvable : ${id}`);
  }

  const knownStoryIds = new Set(doc.userStory.map((us) => us.id));
  for (const storyId of valid.storyIds) {
    if (!knownStoryIds.has(storyId)) {
      throw new Error(`[scrum/sprint] UserStory inconnue : ${storyId}`);
    }
  }

  const targetIds = new Set(valid.storyIds);

  const next = doc.sprint.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        storyIds: valid.storyIds,
        updatedAt: new Date().toISOString(),
      };
    }
    const filtered = item.storyIds.filter((sid) => !targetIds.has(sid));
    if (filtered.length !== item.storyIds.length) {
      return { ...item, storyIds: filtered };
    }
    return item;
  });

  await writeScrumFile(flow, { ...doc, sprint: next });
  const updated = next.find((s) => s.id === id);
  if (!updated) {
    throw new Error(`[scrum/sprint] Sprint introuvable après écriture : ${id}`);
  }
  return updated;
}

/* ------------------------------------------------------------------ */
/*  Move : rattacher / détacher une US à un sprint (board DnD)         */
/* ------------------------------------------------------------------ */

/**
 * Rattache ou détache une US d'un sprint, en garantissant l'unicité
 * (une US ne peut être que dans un seul sprint).
 *
 * - `sprintId === null` : retire l'US de tous les sprints (retour
 *   backlog).
 * - `sprintId !== null` : retire l'US de tous les autres sprints et
 *   l'ajoute en fin du sprint cible.
 *
 * @throws si le sprint cible ou l'US n'existent pas.
 */
export async function moveStoryToSprint(
  flow: ScrumFlow,
  storyId: string,
  sprintId: string | null,
): Promise<{ readonly storyId: string; readonly sprintId: string | null }> {
  const doc = await readScrumFile(flow);

  const storyExists = doc.userStory.some((us) => us.id === storyId);
  if (!storyExists) {
    throw new Error(`[scrum/sprint] UserStory introuvable : ${storyId}`);
  }

  if (sprintId !== null) {
    const sprintExists = doc.sprint.some((s) => s.id === sprintId);
    if (!sprintExists) {
      throw new Error(`[scrum/sprint] Sprint introuvable : ${sprintId}`);
    }
  }

  const now = new Date().toISOString();

  const next = doc.sprint.map((sprint) => {
    const withoutStory = sprint.storyIds.filter((sid) => sid !== storyId);
    const wasInSprint = withoutStory.length !== sprint.storyIds.length;

    /* Sprint cible : ajoute en fin si pas déjà présent. */
    if (sprintId !== null && sprint.id === sprintId) {
      const alreadyInTarget = sprint.storyIds.includes(storyId);
      return {
        ...sprint,
        storyIds: alreadyInTarget
          ? sprint.storyIds
          : [...withoutStory, storyId],
        updatedAt: now,
      };
    }

    /* Autres sprints : retire l'US si elle y était. */
    if (wasInSprint) {
      return { ...sprint, storyIds: withoutStory, updatedAt: now };
    }

    return sprint;
  });

  await writeScrumFile(flow, { ...doc, sprint: next });
  return { storyId, sprintId };
}
