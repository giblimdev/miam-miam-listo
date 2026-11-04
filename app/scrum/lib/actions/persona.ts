/*
path :           app/scrum/lib/scrum/actions/persona.ts
tag :            ["scrum", "action", "persona", "server-action", "crud", "reorder"]
projectId:       new-genesis
type:            action
generic:         false

role:            Server Actions pour la section "persona" du module Scrum.
                 Délègue au service persona et utilise _helpers.

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

relatedFiles:    ["@/app/scrum/lib/services/persona.ts",
                  "@/app/scrum/lib/validations.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["@/app/scrum/lib/actions/_helpers",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/persona"]

exports:         ["createPersonaAction", "updatePersonaAction",
                  "deletePersonaAction", "reorderPersonasAction"]

useBy:           ["@/app/scrum/components/PersonaList.tsx"]

userStories:     ["*en tant que développeur je veux muter et réorganiser les personas via Server Actions"]

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
import type { Persona, ScrumFlow } from "@/app/scrum/lib/types";
import {
  createPersona,
  deletePersona,
  reorderPersonas,
  updatePersona,
} from "@/app/scrum/lib/services/persona";

function parsePersonaForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    kind: String(formData.get("kind") ?? ""),
    need: String(formData.get("need") ?? ""),
    relatedFeatures: parseStringArray(formData, "relatedFeatures"),
  };
}

export async function createPersonaAction(
  flow: ScrumFlow,
  formData: FormData,
): Promise<ActionResult<Persona>> {
  try {
    const entity = await createPersona(flow, parsePersonaForm(formData));
    revalidateScrumFlow(flow, "persona");
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updatePersonaAction(
  flow: ScrumFlow,
  id: string,
  formData: FormData,
): Promise<ActionResult<Persona>> {
  try {
    const entity = await updatePersona(flow, id, parsePersonaForm(formData));
    revalidateScrumFlow(flow, "persona");
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deletePersonaAction(
  flow: ScrumFlow,
  id: string,
): Promise<ActionResult<null>> {
  try {
    await deletePersona(flow, id);
    revalidateScrumFlow(flow, "persona");
    return { ok: true, data: null };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function reorderPersonasAction(
  flow: ScrumFlow,
  orderedIds: readonly string[],
): Promise<ActionResult<readonly Persona[]>> {
  try {
    const entities = await reorderPersonas(flow, orderedIds);
    revalidateScrumFlow(flow, "persona");
    return { ok: true, data: entities };
  } catch (error) {
    return handleActionError(error);
  }
}
