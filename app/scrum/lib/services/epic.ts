/*
path :           app/scrum/lib/services/epic.ts
tag :            ["scrum", "service", "epic", "crud", "reorder"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD + reorder pour la section "epic" du module
                 Scrum. Délègue à makeCrudService avec la clé "epic" et le
                 schéma epicInputSchema.

flow:            makeCrudService("epic", epicInputSchema) →
                 { list, create, update, delete, reorder } ré-exportés.

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
                    "@/app/scrum/lib/services/_crud.ts",
                   "@/app/scrum/lib/services/sprint.ts",
                   "@/app/scrum/lib/services/task.ts",
                   "@/app/scrum/lib/services/user-story.ts",
                   "@/app/scrum/lib/storage.ts",
                   "@/app/scrum/lib/types.ts",
                   "@/app/scrum/lib/validations.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/_crud.ts",
                  "@/app/scrum/lib/validations.ts"]

imports:         ["@/app/scrum/lib/services/_crud",
                  "@/app/scrum/lib/validations"]

exports:         ["listEpics", "createEpic", "updateEpic", "deleteEpic",
                  "reorderEpics"]

useBy:           ["@/app/scrum/lib/actions/epic.ts"]

userStories:     ["*en tant que développeur je veux CRUD et réorganiser les epics Scrum"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { makeCrudService } from "@/app/scrum/lib/services/_crud";
import { epicInputSchema } from "@/app/scrum/lib/validations";

export const {
  list: listEpics,
  create: createEpic,
  update: updateEpic,
  delete: deleteEpic,
  reorder: reorderEpics,
} = makeCrudService("epic", epicInputSchema);
