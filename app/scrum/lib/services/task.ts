/*
path :           app/scrum/lib/services/task.ts
tag :            ["scrum", "service", "task", "crud", "reorder", "validate", "move"]
projectId:       <à fournir>
type:            helper
generic:         true

role:            Service CRUD + reorder + move pour la section "task" du
                 module Scrum. Délègue à makeCrudService avec la clé "task"
                 et le schéma taskInputSchema. Le hook validate vérifie
                 que storyId référence une UserStory existante SI fourni
                 (mode backlog implicite : storyId peut être undefined,
                 la task apparaît alors dans la colonne "Non rattachées"
                 du board Task↔US). Expose moveToStory pour rattacher /
                 détacher une task d'une US par DnD.

flow:            makeCrudService("task", taskInputSchema,
                 { validate: (input, doc) => {
                     if (input.storyId) {
                       const exists = doc.userStory.some(us => us.id === input.storyId);
                       if (!exists) throw new Error(...);
                     }
                   }
                 })
                 → { list, create, update, delete, reorder } ré-exportés.
                 + moveToStory(flow, taskId, storyId | null) :
                   readScrumFile → find task → update storyId
                   → writeScrumFile → retourne la task mise à jour.

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

exports:         ["listTasks", "createTask", "updateTask", "deleteTask",
                  "reorderTasks", "moveToStory"]

useBy:           ["@/app/scrum/lib/actions/task.ts"]

userStories:     ["*en tant que développeur je veux CRUD, réorganiser et déplacer les tasks Scrum"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { makeCrudService } from "@/app/scrum/lib/services/_crud";
import { readScrumFile, writeScrumFile } from "@/app/scrum/lib/storage";
import type { ScrumFlow, Task } from "@/app/scrum/lib/types";
import { taskInputSchema } from "@/app/scrum/lib/validations";

export const {
  list: listTasks,
  create: createTask,
  update: updateTask,
  delete: deleteTask,
  reorder: reorderTasks,
} = makeCrudService("task", taskInputSchema, {
  /* Backlog implicite : storyId peut être undefined (task non rattachée).
     Si fourni, on vérifie qu'il existe (intégrité référentielle). */
  validate: (input, doc) => {
    if (input.storyId) {
      const exists = doc.userStory.some((us) => us.id === input.storyId);
      if (!exists) {
        throw new Error(
          `[scrum/task] UserStory introuvable : ${input.storyId}`,
        );
      }
    }
  },
});

/* ------------------------------------------------------------------ */
/*  Move : rattacher / détacher une task à une US                      */
/* ------------------------------------------------------------------ */

export async function moveToStory(
  flow: ScrumFlow,
  taskId: string,
  storyId: string | null,
): Promise<Task> {
  const doc = await readScrumFile(flow);

  const existing = doc.task.find((t) => t.id === taskId);
  if (!existing) {
    throw new Error(`[scrum/task] Task introuvable : ${taskId}`);
  }

  if (storyId !== null) {
    const storyExists = doc.userStory.some((us) => us.id === storyId);
    if (!storyExists) {
      throw new Error(`[scrum/task] UserStory introuvable : ${storyId}`);
    }
  }

  const updated: Task = {
    ...existing,
    storyId: storyId ?? undefined,
    updatedAt: new Date().toISOString(),
  };

  const next = doc.task.map((t) => (t.id === taskId ? updated : t));
  await writeScrumFile(flow, { ...doc, task: next });
  return updated;
}