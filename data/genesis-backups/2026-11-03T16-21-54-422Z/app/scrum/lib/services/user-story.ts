/*
path :           app/scrum/lib/services/user-story.ts
tag :            ["scrum", "service", "user-story", "crud", "reorder", "cascade"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD + reorder pour la section "user story" du
                 module Scrum. Délègue à makeCrudService avec la clé
                 "userStory" et le schéma userStoryInputSchema. Branche
                 l'unique hook afterDelete de la factory pour effectuer la
                 cascade delete des tasks dont storyId référence l'US
                 supprimée (évite les orphelins en base).

flow:            makeCrudService("userStory", userStoryInputSchema,
                 { afterDelete: (doc, deleted) => ({
                     ...doc,
                     task: doc.task.filter(t => t.storyId !== deleted.id),
                   })
                 })
                 → { list, create, update, delete, reorder } ré-exportés.

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
                   "@/app/scrum/lib/services/storage.ts",
                   "@/app/scrum/lib/services/types.ts",
                   "@/app/scrum/lib/services/validations.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/_crud.ts",
                  "@/app/scrum/lib/services/validations.ts"]

imports:         ["@/app/scrum/lib/services/_crud",
                  "@/app/scrumlib/validations"]

exports:         ["listUserStories", "createUserStory", "updateUserStory",
                  "deleteUserStory", "reorderUserStories"]

useBy:           ["@/app/scrum/lib/actions/user-story.ts"]

userStories:     ["*en tant que développeur je veux CRUD et réorganiser les user stories Scrum"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { makeCrudService } from "@/app/scrum/lib/services/_crud";
import { userStoryInputSchema } from "@/app/scrum/lib/validations";

export const {
  list: listUserStories,
  create: createUserStory,
  update: updateUserStory,
  delete: deleteUserStory,
  reorder: reorderUserStories,
} = makeCrudService("userStory", userStoryInputSchema, {
  afterDelete: (doc, deleted) => ({
    ...doc,
    task: doc.task.filter((t) => t.storyId !== deleted.id),
  }),
});
