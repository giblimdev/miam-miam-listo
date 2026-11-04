/*
path :           app/scrum/lib/actions/sprint.ts
tag :            ["scrum", "action", "sprint", "server-action", "crud", "reorder"]
projectId:       new-genesis
type:            action
generic:         false

role:            Server Actions pour la section "sprint" du module Scrum.
                 Délègue au service sprint et utilise _helpers.
                 updateSprintMetaAction et updateSprintStoriesAction sont
                 distinctes (édition scindée du service sprint).
                 Les revalidations utilisent `/scrum/${flow}` et
                 `/scrum/${flow}/sprint/${sprintId}/edit` — routes physiques
                 réelles.

flow:            FormData → parse → service → revalidate → ActionResult.

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

relatedFiles:    ["@/app/scrum/lib/services/sprint.ts",
                  "@/app/scrum/lib/validations.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["next/cache",
                  "@/app/scrum/lib/actions/_helpers",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/sprint"]

exports:         ["createSprintAction", "updateSprintMetaAction",
                  "updateSprintStoriesAction", "deleteSprintAction",
                  "reorderSprintsAction"]

useBy:           ["@/app/scrum/components/SprintList.tsx",
                  "@/app/scrum/components/SprintEditor.tsx"]

userStories:     ["*en tant que développeur je veux muter et réorganiser les sprints via Server Actions"]
status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use server";

import { revalidatePath } from "next/cache";

import {
  handleActionError,
  parseStringArray,
  revalidateScrumFlow,
  type ActionResult,
} from "@/app/scrum/lib/actions/_helpers";
import type { ScrumFlow, Sprint } from "@/app/scrum/lib/types";
import {
  createSprint,
  deleteSprint,
  reorderSprints,
  updateSprintMeta,
  updateSprintStories,
} from "@/app/scrum/lib/services/sprint";

function revalidate(flow: ScrumFlow, sprintId?: string): void {
  revalidateScrumFlow(flow, "sprint");
  if (sprintId) revalidatePath(`/scrum/${flow}/sprint/${sprintId}/edit`);
}

function parseSprintMetaForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    goal: String(formData.get("goal") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
  };
}

export async function createSprintAction(
  flow: ScrumFlow,
  formData: FormData,
): Promise<ActionResult<Sprint>> {
  try {
    const entity = await createSprint(flow, {
      ...parseSprintMetaForm(formData),
      storyIds: parseStringArray(formData, "storyIds"),
    });
    revalidate(flow);
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateSprintMetaAction(
  flow: ScrumFlow,
  id: string,
  formData: FormData,
): Promise<ActionResult<Sprint>> {
  try {
    const entity = await updateSprintMeta(
      flow,
      id,
      parseSprintMetaForm(formData),
    );
    revalidate(flow, id);
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateSprintStoriesAction(
  flow: ScrumFlow,
  id: string,
  storyIds: readonly string[],
): Promise<ActionResult<Sprint>> {
  try {
    const entity = await updateSprintStories(flow, id, storyIds);
    revalidate(flow, id);
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteSprintAction(
  flow: ScrumFlow,
  id: string,
): Promise<ActionResult<null>> {
  try {
    await deleteSprint(flow, id);
    revalidate(flow);
    return { ok: true, data: null };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function reorderSprintsAction(
  flow: ScrumFlow,
  orderedIds: readonly string[],
): Promise<ActionResult<readonly Sprint[]>> {
  try {
    const entities = await reorderSprints(flow, orderedIds);
    revalidate(flow);
    return { ok: true, data: entities };
  } catch (error) {
    return handleActionError(error);
  }
}