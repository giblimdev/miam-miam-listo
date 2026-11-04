/*
path :           app/scrum/lib/actions/task.ts
tag :            ["scrum", "action", "task", "server-action", "crud", "reorder"]
projectId:       new-genesis
type:            action
generic:         false

role:            Server Actions pour la section "task" du module Scrum.
                 Délègue au service task et utilise _helpers.
                 parseStatus garantit une valeur de TaskStatus valide.

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

relatedFiles:    ["@/app/scrum/lib/services/task.ts",
                  "@/app/scrum/lib/validations.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["@/app/scrum/lib/actions/_helpers",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/task"]

exports:         ["createTaskAction", "updateTaskAction", "deleteTaskAction",
                  "reorderTasksAction"]

useBy:           ["@/app/scrum/components/TaskList.tsx"]

userStories:     ["*en tant que développeur je veux muter et réorganiser les tasks via Server Actions"]

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
import type { ScrumFlow, Task, TaskStatus } from "@/app/scrum/lib/types";
import {
  createTask,
  deleteTask,
  reorderTasks,
  updateTask,
} from "@/app/scrum/lib/services/task";

const VALID_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "done"];

function parseStatus(raw: string | null): TaskStatus {
  if (raw && (VALID_STATUSES as readonly string[]).includes(raw)) {
    return raw as TaskStatus;
  }
  return "todo";
}

function parseTaskForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: parseStatus(formData.get("status") as string | null),
    storyId: String(formData.get("storyId") ?? ""),
    assignee: String(formData.get("assignee") ?? ""),
    estimate: String(formData.get("estimate") ?? ""),
  };
}

export async function createTaskAction(
  flow: ScrumFlow,
  formData: FormData,
): Promise<ActionResult<Task>> {
  try {
    const entity = await createTask(flow, parseTaskForm(formData));
    revalidateScrumFlow(flow, "task");
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateTaskAction(
  flow: ScrumFlow,
  id: string,
  formData: FormData,
): Promise<ActionResult<Task>> {
  try {
    const entity = await updateTask(flow, id, parseTaskForm(formData));
    revalidateScrumFlow(flow, "task");
    return { ok: true, data: entity };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteTaskAction(
  flow: ScrumFlow,
  id: string,
): Promise<ActionResult<null>> {
  try {
    await deleteTask(flow, id);
    revalidateScrumFlow(flow, "task");
    return { ok: true, data: null };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function reorderTasksAction(
  flow: ScrumFlow,
  orderedIds: readonly string[],
): Promise<ActionResult<readonly Task[]>> {
  try {
    const entities = await reorderTasks(flow, orderedIds);
    revalidateScrumFlow(flow, "task");
    return { ok: true, data: entities };
  } catch (error) {
    return handleActionError(error);
  }
}
