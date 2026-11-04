/*
path :           app/scrum/lib/validations.ts
tag :            ["scrum", "validation", "zod", "strict", "config"]
projectId:       <à fournir>
type:            config
generic:         true

role:            Schémas Zod pour la validation runtime du module Scrum.
                 Un schéma d'input par entité (idee, feature, persona, epic,
                 userStory, sprint, task) + le schéma du document complet +
                 le payload de réordonnancement. Depuis l'ajout du backlog
                 implicite : taskInputSchema.storyId est OPTIONNEL (une task
                 peut exister sans être rattachée à une UserStory) et
                 userStoryInputSchema.epicId reste OPTIONNEL (une US peut
                 exister sans être rattachée à un Epic). scrumDocumentSchema
                 accueille `task` avec `.default([])` pour migrer
                 silencieusement les documents antérieurs (aucune clé
                 `task` → tableau vide), et `task.storyId` est
                 `.optional()` pour refléter le backlog implicite.
                 scrumDocumentSchema reste en mode strict (clés inconnues
                 rejetées). reorderInputSchema impose l'unicité des ids
                 (refine) en plus de la longueur minimale.

flow:            Module TypeScript pur → export des schémas Zod et des types
                 inférés. Aucun état, aucun effet, aucune dépendance runtime
                 autre que zod.

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

relatedFiles:    ["@/app/scrum/lib/types.ts"]

imports:         ["zod"]

exports:         ["ideeInputSchema", "featureInputSchema", "personaInputSchema",
                  "epicInputSchema", "userStoryInputSchema", "sprintInputSchema",
                  "sprintMetaInputSchema", "sprintStoriesInputSchema",
                  "taskInputSchema", "scrumDocumentSchema", "reorderInputSchema",
                  "IdeeInput", "FeatureInput", "PersonaInput", "EpicInput",
                  "UserStoryInput", "SprintInput", "SprintMetaInput",
                  "SprintStoriesInput", "TaskInput", "ScrumDocumentInput",
                  "ReorderInput"]

useBy:           ["@/app/scrum/lib/storage.ts",
                  "@/app/scrum/lib/services/idee.ts",
                  "@/app/scrum/lib/services/feature.ts",
                  "@/app/scrum/lib/services/persona.ts",
                  "@/app/scrum/lib/services/epic.ts",
                  "@/app/scrum/lib/services/user-story.ts",
                  "@/app/scrum/lib/services/sprint.ts",
                  "@/app/scrum/lib/services/task.ts",
                  "@/app/scrum/lib/services/global-json.ts",
                  "@/app/scrum/lib/actions/idee.ts",
                  "@/app/scrum/lib/actions/feature.ts",
                  "@/app/scrum/lib/actions/persona.ts",
                  "@/app/scrum/lib/actions/epic.ts",
                  "@/app/scrum/lib/actions/user-story.ts",
                  "@/app/scrum/lib/actions/sprint.ts",
                  "@/app/scrum/lib/actions/task.ts"]

userStories:     ["*en tant que développeur je veux valider les entrées Scrum avec Zod"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const requiredText = (max = 10000) =>
  z
    .string()
    .trim()
    .min(1, "Ce champ est requis.")
    .max(max, `Maximum ${max} caractères.`);

const optionalText = (max = 10000) =>
  z
    .string()
    .trim()
    .max(max, `Maximum ${max} caractères.`)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

const stringArray = z
  .array(z.string().trim().min(1))
  .default([])
  .transform((arr) => [...new Set(arr)]);

/* ------------------------------------------------------------------ */
/*  Idée                                                               */
/* ------------------------------------------------------------------ */

export const ideeInputSchema = z.object({
  title: requiredText(200),
  problem: requiredText(10000),
  hypotheses: requiredText(10000),
  context: optionalText(10000),
});

export type IdeeInput = z.input<typeof ideeInputSchema>;

/* ------------------------------------------------------------------ */
/*  Feature                                                            */
/* ------------------------------------------------------------------ */

export const featureInputSchema = z.object({
  title: requiredText(200),
  description: requiredText(5000),
  interest: requiredText(2000),
  personas: stringArray,
});

export type FeatureInput = z.input<typeof featureInputSchema>;

/* ------------------------------------------------------------------ */
/*  Persona                                                            */
/* ------------------------------------------------------------------ */

export const personaInputSchema = z.object({
  name: requiredText(200),
  kind: requiredText(100),
  need: requiredText(5000),
  relatedFeatures: stringArray,
});

export type PersonaInput = z.input<typeof personaInputSchema>;

/* ------------------------------------------------------------------ */
/*  Epic                                                               */
/* ------------------------------------------------------------------ */

export const epicInputSchema = z.object({
  name: requiredText(200),
  goal: requiredText(5000),
  scope: requiredText(5000),
  personas: stringArray,
});

export type EpicInput = z.input<typeof epicInputSchema>;

/* ------------------------------------------------------------------ */
/*  User Story — epicId OPTIONNEL (backlog implicite)                  */
/* ------------------------------------------------------------------ */

export const userStoryInputSchema = z.object({
  title: requiredText(200),
  story: requiredText(2000),
  acceptance: requiredText(5000),
  estimate: optionalText(100),
  epicId: optionalText(100),
});

export type UserStoryInput = z.input<typeof userStoryInputSchema>;

/* ------------------------------------------------------------------ */
/*  Sprint — trois schémas                                             */
/* ------------------------------------------------------------------ */

export const sprintInputSchema = z.object({
  name: requiredText(200),
  goal: requiredText(5000),
  storyIds: stringArray,
  startDate: optionalText(50),
  endDate: optionalText(50),
});

export type SprintInput = z.input<typeof sprintInputSchema>;

export const sprintMetaInputSchema = z.object({
  name: requiredText(200),
  goal: requiredText(5000),
  startDate: optionalText(50),
  endDate: optionalText(50),
});

export type SprintMetaInput = z.input<typeof sprintMetaInputSchema>;

export const sprintStoriesInputSchema = z.object({
  storyIds: stringArray,
});

export type SprintStoriesInput = z.input<typeof sprintStoriesInputSchema>;

/* ------------------------------------------------------------------ */
/*  Task — storyId OPTIONNEL (backlog implicite)                       */
/* ------------------------------------------------------------------ */

export const taskInputSchema = z.object({
  title: requiredText(200),
  description: optionalText(2000),
  status: z.enum(["todo", "in_progress", "done"]),
  storyId: optionalText(100),
  assignee: optionalText(100),
  estimate: optionalText(100),
});

export type TaskInput = z.input<typeof taskInputSchema>;

/* ------------------------------------------------------------------ */
/*  Document complet                                                   */
/* ------------------------------------------------------------------ */

const entityBaseSchema = z
  .object({
    id: z.string().min(1),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
    order: z.number().int().min(0).default(0),
  })
  .strict();

export const scrumDocumentSchema = z
  .object({
    idea: z.array(
      entityBaseSchema
        .extend({
          title: z.string(),
          problem: z.string(),
          hypotheses: z.string(),
          context: z.string().optional(),
        })
        .strict(),
    ),
    feature: z.array(
      entityBaseSchema
        .extend({
          title: z.string(),
          description: z.string(),
          interest: z.string(),
          personas: z.array(z.string()),
        })
        .strict(),
    ),
    persona: z.array(
      entityBaseSchema
        .extend({
          name: z.string(),
          kind: z.string(),
          need: z.string(),
          relatedFeatures: z.array(z.string()),
        })
        .strict(),
    ),
    epic: z.array(
      entityBaseSchema
        .extend({
          name: z.string(),
          goal: z.string(),
          scope: z.string(),
          personas: z.array(z.string()),
        })
        .strict(),
    ),
    userStory: z.array(
      entityBaseSchema
        .extend({
          title: z.string(),
          story: z.string(),
          acceptance: z.string(),
          estimate: z.string().optional(),
          epicId: z.string().optional(),
        })
        .strict(),
    ),
    sprint: z.array(
      entityBaseSchema
        .extend({
          name: z.string(),
          goal: z.string(),
          storyIds: z.array(z.string()),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
        .strict(),
    ),
    task: z
      .array(
        entityBaseSchema
          .extend({
            title: z.string(),
            description: z.string().optional(),
            status: z.enum(["todo", "in_progress", "done"]),
            storyId: z.string().optional(),
            assignee: z.string().optional(),
            estimate: z.string().optional(),
          })
          .strict(),
      )
      .default([]),
    meta: z
      .object({
        schemaVersion: z.number().int().positive(),
        updatedAt: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export type ScrumDocumentInput = z.input<typeof scrumDocumentSchema>;

/* ------------------------------------------------------------------ */
/*  Réordonnancement (payload d'action)                                */
/* ------------------------------------------------------------------ */

export const reorderInputSchema = z
  .object({
    orderedIds: z
      .array(z.string().min(1))
      .min(1)
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "Ids dupliqués : chaque id doit apparaître une seule fois.",
      }),
  })
  .strict();

export type ReorderInput = z.input<typeof reorderInputSchema>;