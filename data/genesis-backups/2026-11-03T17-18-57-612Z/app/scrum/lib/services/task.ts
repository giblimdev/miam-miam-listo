/*
path :           app/scrum/lib/services/task.ts
tag :            ["scrum", "service", "task", "crud", "reorder", "validate"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD + reorder pour la section "task" du module
                 Scrum. Délègue à makeCrudService avec la clé "task" et le
                 schéma taskInputSchema. Branche l'unique hook validate de
                 la factory pour vérifier que storyId référence une
                 UserStory existante (sur create et update), évitant les
                 tasks orphelines.

flow:            makeCrudService("task", taskInputSchema,
                 { validate: (input, doc) => {
                     if (!doc.userStory.some(us => us.id === input.storyId)) {
                       throw new Error(`[scrum/task] UserStory introuvable : ${input.storyId}`); 
                     }
                   }
                 })
                 → { list, create, update, delete, reorder } ré-exportés.

ecosystem:       Scrum = [
                   "@/app/core/lib/scrum/actions/epic.ts",
                                       "@/app/core/lib/scrum/services/_crud.ts",

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
                   "@/app/scrum/lib/services/storage.ts",
                   "@/app/scrum/lib/services/types.ts",
                   "@/app/scrum/lib/services/validations.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/_crud.ts",
                  "@/app/scrum/lib/services/validations.ts"]

imports:         ["@/app/scrum/lib/services/_crud",
                  "@/app/scrum/lib/services/validations"]

exports:         ["listTasks", "createTask", "updateTask", "deleteTask",
                  "reorderTasks"]

useBy:           ["@/app/scrum/lib/actions/task.ts"]

userStories:     ["*en tant que développeur je veux CRUD et réorganiser les tasks Scrum"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { makeCrudService } from "@/app/scrum/lib/services/_crud";
import { taskInputSchema } from "@/app/scrum/lib/validations";

export const {
  list: listTasks,
  create: createTask,
  update: updateTask,
  delete: deleteTask,
  reorder: reorderTasks,
} = makeCrudService("task", taskInputSchema, {
  validate: (input, doc) => {
    const exists = doc.userStory.some((us) => us.id === input.storyId);
    if (!exists) {
      throw new Error(`[scrum/task] UserStory introuvable : ${input.storyId}`);
    }
  },
});
