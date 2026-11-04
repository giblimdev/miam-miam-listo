/*
path :           app/scrum/lib/services/idee.ts
tag :            ["scrum", "service", "idee", "crud", "reorder"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD + reorder pour la section "idée" du module
                 Scrum. Délègue à makeCrudService (factory générique) en
                 fournissant la clé de collection "idea" et le schéma
                 ideeInputSchema. Plus de duplication : la factory gère
                 la génération d'id, le calcul d'order, le cycle
                 find + replace, la vérification de présence et la
                 normalisation d'ordre.

flow:            makeCrudService("idea", ideeInputSchema) →
                 { list, create, update, delete, reorder } ré-exportés sous
                 les noms listIdees / createIdee / updateIdee /
                 deleteIdee / reorderIdees.

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
                   "@/app/scrum/lib/validations.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/_crud.ts",
                  "@/app/scrum/lib/validations.ts"]

imports:         ["@/app/scrum/lib/services/_crud",
                  "@/app/scrum/lib/validations"]

exports:         ["listIdees", "createIdee", "updateIdee", "deleteIdee",
                  "reorderIdees"]

useBy:           ["@/app/scrum/lib/actions/idee.ts"]

userStories:     ["*en tant que développeur je veux CRUD et réorganiser les idées Scrum"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { makeCrudService } from "@/app/scrum/lib/services/_crud";
import { ideeInputSchema } from "@/app/scrum/lib/validations";

export const {
  list: listIdees,
  create: createIdee,
  update: updateIdee,
  delete: deleteIdee,
  reorder: reorderIdees,
} = makeCrudService("idea", ideeInputSchema);
