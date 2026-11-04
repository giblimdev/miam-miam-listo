/*
path :           app/scrum/lib/actions/feature.ts
tag :            ["scrum", "action", "feature", "server-action", "crud", "reorder"]
projectId:       new-genesis
type:            action
generic:         false

role:            Server Actions pour la section "feature" du module Scrum.
                 Délègue au service feature et utilise _helpers.

flow:            FormData → parse → service → revalidate → ActionResult.
                 reorderFeaturesAction(flow, orderedIds) → service → revalidate → ActionResult.

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

relatedFiles:    ["@/app/scrum/lib/services/feature.ts",
                  "@/app/scrum/lib/validations.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["@/app/scrum/lib/actions/_helpers",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/feature"]

exports:         ["createFeatureAction", "updateFeatureAction",
                  "deleteFeatureAction", "reorderFeaturesAction"]

useBy:           ["@/app/scrum/components/FeatureList.tsx"]

userStories:     ["*en tant que développeur je veux muter et réorganiser les features via Server Actions"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use server";

import {
  handleActionError,
  parseStringArray,
  revalidateScrumFlow,
  type ActionResult,
} from "@/app/scrum/lib/actions/_helpers";
import type { Feature, ScrumFlow } from "@/app/scrum/lib/types";
import {
  createFeature,
  deleteFeature,
  reorderFeatures,
  updateFeature,
} from "@/app/scrum/lib/services/feature";

function parseFeatureForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    interest: String(formData.get("interest") ?? ""),
    personas: parseStringArray(formData, "personas"),
  };
}

export async function createFeatureAction(
  flow: ScrumFlow,
  formData: FormData,
): Promise<ActionResult<Feature>> {
  try {
    const entity = await createFeature(flow, parseFeatureForm(formData));
    revalidateScrumFlow(flow, "feature");
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateFeatureAction(
  flow: ScrumFlow,
  id: string,
  formData: FormData,
): Promise<ActionResult<Feature>> {
  try {
    const entity = await updateFeature(flow, id, parseFeatureForm(formData));
    revalidateScrumFlow(flow, "feature");
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteFeatureAction(
  flow: ScrumFlow,
  id: string,
): Promise<ActionResult<null>> {
  try {
    await deleteFeature(flow, id);
    revalidateScrumFlow(flow, "feature");
    return { ok: true, data: null };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function reorderFeaturesAction(
  flow: ScrumFlow,
  orderedIds: readonly string[],
): Promise<ActionResult<readonly Feature[]>> {
  try {
    const entities = await reorderFeatures(flow, orderedIds);
    revalidateScrumFlow(flow, "feature");
    return { ok: true, data: entities };
  } catch (error) {
    return handleActionError(error);
  }
}
