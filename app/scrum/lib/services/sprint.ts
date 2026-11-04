/*
path :           app/scrum/lib/services/sprint.ts
tag :            ["scrum", "service", "sprint", "crud", "reorder", "custom-update"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD + reorder pour la section "sprint" du module
                 Scrum. Cas particulier : l'édition est SCINDÉE en deux
                 opérations indépendantes (méta / stories) — la page
                 d'édition appelle deux Server Actions séquentielles — donc
                 on n'utilise PAS le update générique de la factory.
                 list / create / delete / reorder délèguent à
                 makeCrudService ; updateSprintMeta et updateSprintStories
                 restent des fonctions dédiées (logique métier propre :
                 validation de storyId, unicité inter-sprints, préservation
                 du publishedAt-like — ici aucun champ dérivé). 

flow:            makeCrudService("sprint", sprintInputSchema) → base.
                 Exports : base.list / base.create / base.delete /
                 base.reorder aliasés (listSprints, createSprint,
                 deleteSprint, reorderSprints).
                 updateSprintMeta(flow, id, input) → parse méta (sans
                 storyIds) → find + replace → write.
                 updateSprintStories(flow, id, storyIds) → parse → valide
                 chaque storyId → retire des autres sprints (unicité) →
                 réassigne au sprint courant → write.

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
                  "updateSprintStories", "deleteSprint", "reorderSprints"]

useBy:           ["@/app/scrum/lib/actions/sprint.ts"]

userStories:     ["*en tant que développeur je veux CRUD et réorganiser les sprints Scrum"]

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
/*  Édition des US (board DnD) — retire des autres sprints             */
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
