/*
path :           app/scrum/lib/actions/idee.ts
tag :            ["scrum", "action", "idee", "server-action", "crud", "reorder"]
projectId:       new-genesis
type:            action
generic:         false

role:            Server Actions pour la section "idée" du module Scrum.
                 Délègue au service idee (makeCrudService) et utilise les
                 helpers partagés _helpers (revalidateScrumFlow,
                 handleActionError, ActionResult).

flow:            createIdeeAction(flow, formData) → parse → service → revalidate → ActionResult.
                 updateIdeeAction / deleteIdeeAction / reorderIdeesAction → idem.

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

relatedFiles:    ["@/app/scrum/lib/services/idee.ts",
                  "@/app/scrum/lib/validations.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["@/app/scrum/lib/actions/_helpers",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/idee"]

exports:         ["createIdeeAction", "updateIdeeAction", "deleteIdeeAction",
                  "reorderIdeesAction"]

useBy:           ["@/app/scrum/components/IdeeList.tsx"]

userStories:     ["*en tant que développeur je veux muter et réorganiser les idées via Server Actions"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use server";

import {
  handleActionError,
  revalidateScrumFlow,
  type ActionResult,
} from "@/app/scrum/lib/actions/_helpers";
import type { Idee, ScrumFlow } from "@/app/scrum/lib/types";
import {
  createIdee,
  deleteIdee,
  reorderIdees,
  updateIdee,
} from "@/app/scrum/lib/services/idee";

function parseIdeeForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    problem: String(formData.get("problem") ?? ""),
    hypotheses: String(formData.get("hypotheses") ?? ""),
    context: String(formData.get("context") ?? ""),
  };
}

export async function createIdeeAction(
  flow: ScrumFlow,
  formData: FormData,
): Promise<ActionResult<Idee>> {
  try {
    const entity = await createIdee(flow, parseIdeeForm(formData));
    revalidateScrumFlow(flow, "idee");
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateIdeeAction(
  flow: ScrumFlow,
  id: string,
  formData: FormData,
): Promise<ActionResult<Idee>> {
  try {
    const entity = await updateIdee(flow, id, parseIdeeForm(formData));
    revalidateScrumFlow(flow, "idee");
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteIdeeAction(
  flow: ScrumFlow,
  id: string,
): Promise<ActionResult<null>> {
  try {
    await deleteIdee(flow, id);
    revalidateScrumFlow(flow, "idee");
    return { ok: true, data: null };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function reorderIdeesAction(
  flow: ScrumFlow,
  orderedIds: readonly string[],
): Promise<ActionResult<readonly Idee[]>> {
  try {
    const entities = await reorderIdees(flow, orderedIds);
    revalidateScrumFlow(flow, "idee");
    return { ok: true, data: entities };
  } catch (error) {
    return handleActionError(error);
  }
}
