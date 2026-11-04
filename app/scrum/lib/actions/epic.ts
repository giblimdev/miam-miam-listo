/*
path :           app/core/lib/actions/epic.ts
tag :            ["scrum", "action", "epic", "server-action", "crud", "reorder"]
projectId:       new-genesis
type:            action
generic:         false

role:            Server Actions pour la section "epic" du module Scrum.
                 Délègue au service epic et utilise _helpers.

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

relatedFiles:    ["@/app/scrum/lib/services/epic.ts",
                  "@/app/scrum/lib/validations.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["@/app/scrum/lib/actions/_helpers",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/epic"]

exports:         ["createEpicAction", "updateEpicAction", "deleteEpicAction",
                  "reorderEpicsAction"]

useBy:           ["@/app/scrum/components/EpicList.tsx"]

userStories:     ["*en tant que développeur je veux muter et réorganiser les epics via Server Actions"]

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
import type { Epic, ScrumFlow } from "@/app/scrum/lib/types";
import {
  createEpic,
  deleteEpic,
  reorderEpics,
  updateEpic,
} from "@/app/scrum/lib/services/epic";

function parseEpicForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    goal: String(formData.get("goal") ?? ""),
    scope: String(formData.get("scope") ?? ""),
    personas: parseStringArray(formData, "personas"),
  };
}

export async function createEpicAction(
  flow: ScrumFlow,
  formData: FormData,
): Promise<ActionResult<Epic>> {
  try {
    const entity = await createEpic(flow, parseEpicForm(formData));
    revalidateScrumFlow(flow, "epic");
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateEpicAction(
  flow: ScrumFlow,
  id: string,
  formData: FormData,
): Promise<ActionResult<Epic>> {
  try {
    const entity = await updateEpic(flow, id, parseEpicForm(formData));
    revalidateScrumFlow(flow, "epic");
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteEpicAction(
  flow: ScrumFlow,
  id: string,
): Promise<ActionResult<null>> {
  try {
    await deleteEpic(flow, id);
    revalidateScrumFlow(flow, "epic");
    return { ok: true, data: null };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function reorderEpicsAction(
  flow: ScrumFlow,
  orderedIds: readonly string[],
): Promise<ActionResult<readonly Epic[]>> {
  try {
    const entities = await reorderEpics(flow, orderedIds);
    revalidateScrumFlow(flow, "epic");
    return { ok: true, data: entities };
  } catch (error) {
    return handleActionError(error);
  }
}
