/*
path :           app/scrum/lib/actions/user-story.ts
tag :            ["scrum", "action", "user-story", "server-action", "crud", "reorder"]
projectId:       new-genesis
type:            action
generic:         false

role:            Server Actions pour la section "user story" du module Scrum.
                 Délègue au service user-story et utilise _helpers.

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

relatedFiles:    ["@/app/scrum/lib/services/user-story.ts",
                  "@/app/scrum/lib/validations.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["@/app/scrum/lib/actions/_helpers",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/user-story"]

exports:         ["createUserStoryAction", "updateUserStoryAction",
                  "deleteUserStoryAction", "reorderUserStoriesAction"]

useBy:           ["@/app/scrum/components/UserStoryList.tsx"]

userStories:     ["*en tant que développeur je veux muter et réorganiser les user stories via Server Actions"]

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
import type { ScrumFlow, UserStory } from "@/app/scrum/lib/types";
import {
  createUserStory,
  deleteUserStory,
  reorderUserStories,
  updateUserStory,
} from "@/app/scrum/lib/services/user-story";

function parseUserStoryForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    story: String(formData.get("story") ?? ""),
    acceptance: String(formData.get("acceptance") ?? ""),
    estimate: String(formData.get("estimate") ?? ""),
    epicId: String(formData.get("epicId") ?? ""),
  };
}

export async function createUserStoryAction(
  flow: ScrumFlow,
  formData: FormData,
): Promise<ActionResult<UserStory>> {
  try {
    const entity = await createUserStory(flow, parseUserStoryForm(formData));
    revalidateScrumFlow(flow, "user-story");
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateUserStoryAction(
  flow: ScrumFlow,
  id: string,
  formData: FormData,
): Promise<ActionResult<UserStory>> {
  try {
    const entity = await updateUserStory(
      flow,
      id,
      parseUserStoryForm(formData),
    );
    revalidateScrumFlow(flow, "user-story");
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteUserStoryAction(
  flow: ScrumFlow,
  id: string,
): Promise<ActionResult<null>> {
  try {
    await deleteUserStory(flow, id);
    revalidateScrumFlow(flow, "user-story");
    return { ok: true, data: null };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function reorderUserStoriesAction(
  flow: ScrumFlow,
  orderedIds: readonly string[],
): Promise<ActionResult<readonly UserStory[]>> {
  try {
    const entities = await reorderUserStories(flow, orderedIds);
    revalidateScrumFlow(flow, "user-story");
    return { ok: true, data: entities };
  } catch (error) {
    return handleActionError(error);
  }
}
