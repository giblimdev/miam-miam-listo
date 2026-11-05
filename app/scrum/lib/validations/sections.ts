/*
path :           app/scrum/lib/validations/sections.ts
tag :            ["scrum", "validation", "zod", "sections", "config"]
projectId:       <à fournir>
type:            config
generic:         true

role:            Mapping SECTION → schéma Zod pour valider un tableau
                 d'entités d'une section Scrum avant écriture (édition
                 JSON en masse). Source unique de vérité : réutilise les
                 schémas d'input déjà définis dans
                 @/app/scrum/lib/validations (ideeInputSchema,
                 featureInputSchema, personaInputSchema, epicInputSchema,
                 userStoryInputSchema, sprintInputSchema, taskInputSchema)
                 et les enveloppe dans un z.array. Expose aussi
                 EDITABLE_SECTIONS (as const) et le type EditableSection
                 dérivé — utilisés par l'action générique
                 updateSectionJsonAction et par le composant
                 SectionJsonEditor. Aucun accès fichier, aucun effet.

flow:            Module TypeScript pur → export des 7 schémas
                 sectionArraySchemas[key] (Record<EditableSection,
                 ZodArray>) + de EDITABLE_SECTIONS + EditableSection +
                 getSectionArraySchema(section) (lookup typé). Aucun état.

ecosystem:       Scrum = [
                   "@/app/scrum/lib/validations/sections.ts",
                   "@/app/scrum/lib/validations.ts",
                   "@/app/scrum/lib/actions/section-json.ts",
                   "@/components/scrum/SectionJsonEditor.tsx",
                   "@/app/scrum/[flow]/idee/page.tsx",
                   "@/app/scrum/[flow]/feature/page.tsx",
                   "@/app/scrum/[flow]/persona/page.tsx",
                   "@/app/scrum/[flow]/epic/page.tsx",
                   "@/app/scrum/[flow]/user-story/page.tsx",
                   "@/app/scrum/[flow]/sprint/page.tsx",
                   "@/app/scrum/[flow]/task/page.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/validations.ts"]

imports:         ["zod",
                  "@/app/scrum/lib/validations"]

exports:         ["EDITABLE_SECTIONS", "EditableSection",
                  "SectionJsonItem", "sectionArraySchemas",
                  "getSectionArraySchema"]

useBy:           ["@/app/scrum/lib/actions/section-json.ts",
                  "@/components/scrum/SectionJsonEditor.tsx"]

userStories:     ["*en tant que développeur je veux valider en masse le JSON d'une section Scrum"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { z } from "zod";

import {
  epicInputSchema,
  featureInputSchema,
  ideeInputSchema,
  personaInputSchema,
  sprintInputSchema,
  taskInputSchema,
  userStoryInputSchema,
} from "@/app/scrum/lib/validations";

/* ------------------------------------------------------------------ */
/*  Sections éditables en JSON                                         */
/* ------------------------------------------------------------------ */

export const EDITABLE_SECTIONS = [
  "idee",
  "feature",
  "persona",
  "epic",
  "userStory",
  "sprint",
  "task",
] as const;

export type EditableSection = (typeof EDITABLE_SECTIONS)[number];

/**
 * Schémas d'array pour chaque section. Chaque item est l'input schema
 * existant (mêmes contraintes que le formulaire). La couche service
 * (makeCrudService) valide déjà en create/update, mais ici on valide
 * le TABLEAU COMPLET avant remplacement — d'où l'utilité de ce mapping.
 */
export const sectionArraySchemas: Record<
  EditableSection,
  z.ZodArray<z.ZodTypeAny>
> = {
  idee: z.array(ideeInputSchema),
  feature: z.array(featureInputSchema),
  persona: z.array(personaInputSchema),
  epic: z.array(epicInputSchema),
  userStory: z.array(userStoryInputSchema),
  sprint: z.array(sprintInputSchema),
  task: z.array(taskInputSchema),
};

/**
 * Type inféré de l'item d'une section donnée (entrée utilisateur du
 * formulaire). Utile pour typer le composant SectionJsonEditor côté
 * client sans coupler au schéma Prisma.
 */
export type SectionJsonItem<K extends EditableSection> = z.input<
  (typeof sectionArraySchemas)[K]
>[number];

/**
 * Lookup typé d'un schéma de tableau. Évite le cast `as any` dans
 * l'action serveur.
 */
export function getSectionArraySchema(
  section: EditableSection,
): z.ZodArray<z.ZodTypeAny> {
  return sectionArraySchemas[section];
}