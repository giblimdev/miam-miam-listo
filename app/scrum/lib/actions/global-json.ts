/*
path :           app/scrum/lib/actions/global-json.ts
tag :            ["scrum", "action", "global-json", "server-action", "persist"]
projectId:       new-genesis
type:            action
generic:         false

role:            Server Action de persistance du Global JSON. Expose
                 uniquement updateGlobalJsonAction (valide et écrit le JSON
                 fourni par le client, puis renvoie la forme canonique
                 re-sérialisée). Utilise _helpers pour revalidate et
                 handleActionError. Revalide `/scrum/${flow}/global-json`
                 (route physique réelle).

flow:            updateGlobalJsonAction(flow, rawJson) → saveGlobalJson →
                 revalidatePath(/scrum/${flow}/global-json) →
                 serializeGlobalJson → { ok: true, data: string }.

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

relatedFiles:    ["@/app/scrum/lib/services/global-json.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["next/cache",
                  "@/app/scrum/lib/actions/_helpers",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/global-json"]

exports:         ["updateGlobalJsonAction"]

useBy:           ["@/app/scrum/components/GlobalJsonExport.tsx"]

userStories:     ["*en tant que développeur je veux persister le document Scrum via une Server Action"]
status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use server";

import { revalidatePath } from "next/cache";

import {
  handleActionError,
  type ActionResult,
} from "@/app/scrum/lib/actions/_helpers";
import type { ScrumFlow } from "@/app/scrum/lib/types";
import {
  saveGlobalJson,
  serializeGlobalJson,
} from "@/app/scrum/lib/services/global-json";

export async function updateGlobalJsonAction(
  flow: ScrumFlow,
  rawJson: string,
): Promise<ActionResult<string>> {
  try {
    await saveGlobalJson(flow, rawJson);
    revalidatePath(`/scrum/${flow}/global-json`);
    const json = await serializeGlobalJson(flow);
    return { ok: true, data: json };
  } catch (error) {
    return handleActionError(error);
  }
}