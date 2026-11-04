/*
path :           app/scrum/lib/types.ts
tag :            ["scrum", "types", "config"]
projectId:       <à fournir>
type:            config
generic:         true

role:            Types partagés pour le module Scrum. Définit ScrumFlow (les
                 trois flux disponibles : scrum-business, scrum-app,
                 scrum-genesis), ScrumDocument (structure du JSON de
                 persistance), ScrumEntityBase (base commune avec order pour
                 le drag-and-drop) et les 7 entités : Idee, Feature, Persona,
                 Epic, UserStory, Sprint, Task. Task est la couche d'exécution
                 du sprint : chaque task référence OPTIONNELLEMENT une
                 UserStory (storyId?: string — backlog implicite) et porte un
                 statut (todo / in_progress / done). UserStory.epicId est
                 également optionnel (backlog implicite côté epic). Aucune
                 dépendance runtime, aucun effet.

flow:            Module TypeScript pur → export des types + factory
                 createEmptyScrumDocument(). Importable côté serveur ET côté
                 client.

ecosystem:       Scrum = [
                   "@/app/scrum/components/BoardColumn.tsx",
                   "@/app/scrum/components/EpicCard.tsx",
                   "@/app/scrum/components/EpicForm.tsx",
                   "@/app/scrum/components/EpicList.tsx",
                   "@/app/scrum/components/FeatureCard.tsx",
                   "@/app/scrum/components/FeatureForm.tsx",
                   "@/app/scrum/components/FeatureList.tsx",
                   "@/app/scrum/components/FlowSelector.tsx",
                   "@/app/scrum/components/GlobalJsonExport.tsx",
                   "@/app/scrum/components/IdeeCard.tsx",
                   "@/app/scrum/components/IdeeDetailDialog.tsx",
                   "@/app/scrum/components/IdeeForm.tsx",
                   "@/app/scrum/components/IdeeList.tsx",
                   "@/app/scrum/components/PersonaCard.tsx",
                   "@/app/scrum/components/PersonaForm.tsx",
                   "@/app/scrum/components/PersonaList.tsx",
                   "@/app/scrum/components/ScrumNav.tsx",
                   "@/app/scrum/components/SortableItem.tsx",
                   "@/app/scrum/components/SortableList.tsx",
                   "@/app/scrum/components/SprintCard.tsx",
                   "@/app/scrum/components/SprintEditor.tsx",
                   "@/app/scrum/components/SprintForm.tsx",
                   "@/app/scrum/components/SprintList.tsx",
                   "@/app/scrum/components/SprintStoriesBoard.tsx",
                   "@/app/scrum/components/TaskBoard.tsx",
                   "@/app/scrum/components/TaskCard.tsx",
                   "@/app/scrum/components/TaskForm.tsx",
                   "@/app/scrum/components/TaskList.tsx",
                   "@/app/scrum/components/UserStoryBoard.tsx",
                   "@/app/scrum/components/UserStoryCard.tsx",
                   "@/app/scrum/components/UserStoryForm.tsx",
                   "@/app/scrum/components/UserStoryList.tsx",
                   "@/app/scrum/components/UserStoryMiniCard.tsx",
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

relatedFiles:    ["@/app/scrum/lib/validations.ts",
                  "@/app/scrum/lib/storage.ts"]

imports:         []

exports:         ["ScrumFlow", "ScrumSection", "ScrumDocument", "ScrumMeta",
                  "ScrumEntityBase", "Idee", "Feature", "Persona", "Epic",
                  "UserStory", "Sprint", "Task", "TaskStatus", "SCRUM_FLOWS",
                  "SCRUM_SECTIONS", "SCRUM_SCHEMA_VERSION", "TASK_STATUSES",
                  "createEmptyScrumDocument"]

useBy:           ["@/app/scrum/lib/validations.ts",
                  "@/app/scrum/lib/storage.ts",
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

userStories:     ["*en tant que développeur je veux des types partagés pour le CRUD Scrum"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

/* ------------------------------------------------------------------ */
/*  Flow                                                               */
/* ------------------------------------------------------------------ */

export type ScrumFlow = "scrum-business" | "scrum-app" | "scrum-genesis";

export const SCRUM_FLOWS: readonly ScrumFlow[] = [
  "scrum-business",
  "scrum-app",
  "scrum-genesis",
] as const;

/* ------------------------------------------------------------------ */
/*  Sections                                                           */
/* ------------------------------------------------------------------ */

export type ScrumSection =
  "idee" | "feature" | "persona" | "epic" | "userStory" | "sprint" | "task";

export const SCRUM_SECTIONS: readonly ScrumSection[] = [
  "idee",
  "feature",
  "persona",
  "epic",
  "userStory",
  "sprint",
  "task",
] as const;

/* ------------------------------------------------------------------ */
/*  Task — statuts                                                     */
/* ------------------------------------------------------------------ */

export type TaskStatus = "todo" | "in_progress" | "done";

export const TASK_STATUSES: readonly TaskStatus[] = [
  "todo",
  "in_progress",
  "done",
] as const;

/* ------------------------------------------------------------------ */
/*  Base commune                                                       */
/* ------------------------------------------------------------------ */

export interface ScrumEntityBase {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  /**
   * Position d'affichage (0 = premier). Réassigné de manière contiguë
   * (0..n-1) par les fonctions reorderXxx lors d'un drag-and-drop.
   * Les documents antérieurs à l'introduction de ce champ reçoivent
   * `order: 0` via le `.default(0)` du schéma Zod, ce qui préserve
   * l'ordre d'insertion (tri stable).
   */
  readonly order: number;
}

/* ------------------------------------------------------------------ */
/*  Entités métier                                                     */
/* ------------------------------------------------------------------ */

export interface Idee extends ScrumEntityBase {
  readonly title: string;
  readonly problem: string;
  readonly hypotheses: string;
  readonly context?: string;
}

export interface Feature extends ScrumEntityBase {
  readonly title: string;
  readonly description: string;
  readonly interest: string;
  readonly personas: readonly string[];
}

export interface Persona extends ScrumEntityBase {
  readonly name: string;
  readonly kind: string;
  readonly need: string;
  readonly relatedFeatures: readonly string[];
}

export interface Epic extends ScrumEntityBase {
  readonly name: string;
  readonly goal: string;
  readonly scope: string;
  readonly personas: readonly string[];
}

export interface UserStory extends ScrumEntityBase {
  readonly title: string;
  readonly story: string;
  readonly acceptance: string;
  readonly estimate?: string;
  /**
   * Epic de rattachement. OPTIONNEL : une US peut exister sans epic
   * (backlog implicite, colonne "Backlog" du board UserStoryBoard).
   */
  readonly epicId?: string;
}

export interface Sprint extends ScrumEntityBase {
  readonly name: string;
  readonly goal: string;
  readonly storyIds: readonly string[];
  readonly startDate?: string;
  readonly endDate?: string;
}

export interface Task extends ScrumEntityBase {
  readonly title: string;
  readonly description?: string;
  readonly status: TaskStatus;
  /**
   * UserStory parente. OPTIONNEL : une task peut exister sans US
   * (backlog implicite, colonne "Non rattachées" du board TaskBoard).
   */
  readonly storyId?: string;
  readonly assignee?: string;
  readonly estimate?: string;
}

/* ------------------------------------------------------------------ */
/*  Document                                                           */
/* ------------------------------------------------------------------ */

export interface ScrumMeta {
  readonly schemaVersion: number;
  readonly updatedAt: string;
}

export interface ScrumDocument {
  readonly idea: readonly Idee[];
  readonly feature: readonly Feature[];
  readonly persona: readonly Persona[];
  readonly epic: readonly Epic[];
  readonly userStory: readonly UserStory[];
  readonly sprint: readonly Sprint[];
  readonly task: readonly Task[];
  readonly meta: ScrumMeta;
}

/* ------------------------------------------------------------------ */
/*  Factory                                                            */
/* ------------------------------------------------------------------ */

export const SCRUM_SCHEMA_VERSION = 1;

export function createEmptyScrumDocument(): ScrumDocument {
  return {
    idea: [],
    feature: [],
    persona: [],
    epic: [],
    userStory: [],
    sprint: [],
    task: [],
    meta: {
      schemaVersion: SCRUM_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
    },
  };
}