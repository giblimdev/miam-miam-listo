/*
path :           app/scrum/lib/services/user-story.ts
tag :            ["scrum", "service", "user-story", "crud", "reorder", "cascade", "move"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Service CRUD + reorder + move pour la section "user story"
                 du module Scrum. Délègue à makeCrudService avec la clé
                 "userStory" et le schéma userStoryInputSchema. Branche
                 le hook afterDelete pour DÉTACHER les tasks orphelines
                 (au lieu de les supprimer, mode backlog implicite) et
                 expose moveToEpic(flow, storyId, epicId | null) pour
                 rattacher/détacher une US à un epic.

flow:            makeCrudService("userStory", userStoryInputSchema,
                 { afterDelete: (doc, deleted) => ({
                     ...doc,
                     task: doc.task.map(t =>
                       t.storyId === deleted.id ? { ...t, storyId: undefined } : t
                     ),
                   })
                 })
                 → { list, create, update, delete, reorder } ré-exportés.
                 + moveToEpic(flow, storyId, epicId | null) :
                   readScrumFile → find US → update epicId
                   → writeScrumFile → retourne l'US mise à jour.

ecosystem:       Scrum = [
                   "@/app/scrum/lib/actions/_helpers.ts",
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
                  "@/app/scrum/lib/validations.ts"]

imports:         ["@/app/scrum/lib/services/_crud",
                  "@/app/scrum/lib/storage",
                  "@/app/scrum/lib/validations"]

exports:         ["listUserStories", "createUserStory", "updateUserStory",
                  "deleteUserStory", "reorderUserStories", "moveToEpic"]

useBy:           ["@/app/scrum/lib/actions/user-story.ts"]

userStories:     ["*en tant que développeur je veux CRUD, réorganiser et déplacer les user stories Scrum"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { makeCrudService } from "@/app/scrum/lib/services/_crud";
import { readScrumFile, writeScrumFile } from "@/app/scrum/lib/storage";
import type { ScrumFlow, UserStory } from "@/app/scrum/lib/types";
import { userStoryInputSchema } from "@/app/scrum/lib/validations";

export const {
  list: listUserStories,
  create: createUserStory,
  update: updateUserStory,
  delete: deleteUserStory,
  reorder: reorderUserStories,
} = makeCrudService("userStory", userStoryInputSchema, {
  /* Backlog implicite : on DÉTACHE les tasks au lieu de les supprimer.
     Les tasks sans storyId apparaissent dans la colonne "Non rattachées"
     du board Task↔US. */
  afterDelete: (doc, deleted) => ({
    ...doc,
    task: doc.task.map((t) =>
      t.storyId === deleted.id ? { ...t, storyId: undefined } : t,
    ),
  }),
});

/* ------------------------------------------------------------------ */
/*  Move : rattacher / détacher une US à un epic                       */
/* ------------------------------------------------------------------ */

export async function moveToEpic(
  flow: ScrumFlow,
  storyId: string,
  epicId: string | null,
): Promise<UserStory> {
  const doc = await readScrumFile(flow);

  const existing = doc.userStory.find((us) => us.id === storyId);
  if (!existing) {
    throw new Error(`[scrum/userStory] UserStory introuvable : ${storyId}`);
  }

  /* Si epicId est fourni, vérifier qu'il existe (intégrité référentielle). */
  if (epicId !== null) {
    const epicExists = doc.epic.some((e) => e.id === epicId);
    if (!epicExists) {
      throw new Error(`[scrum/userStory] Epic introuvable : ${epicId}`);
    }
  }

  const updated: UserStory = {
    ...existing,
    epicId: epicId ?? undefined,
    updatedAt: new Date().toISOString(),
  };

  const next = doc.userStory.map((us) =>
    us.id === storyId ? updated : us,
  );
  await writeScrumFile(flow, { ...doc, userStory: next });
  return updated;
}