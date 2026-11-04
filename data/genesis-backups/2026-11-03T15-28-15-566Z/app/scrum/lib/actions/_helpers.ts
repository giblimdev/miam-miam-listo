/*
path :           app/scrum/lib/actions/_helpers.ts
tag :            ["scrum", "action", "helpers", "revalidate", "generic"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Helpers PARTAGÉS par les 8 fichiers d'actions du module Scrum
                 (epic, feature, idee, persona, sprint, task, user-story,
                 global-json). Ce fichier n'est PAS un fichier "use server" :
                 il expose des helpers synchrones (revalidateScrumFlow,
                 parseStringArray) et un ré-export du contrat neutre
                 ActionResult / handleActionError depuis @/lib/actions/result.
                 Importé exclusivement par des fichiers "use server" — ce qui
                 garantit son exécution en contexte serveur.

flow:            revalidateScrumFlow(flow, section?) → revalidatePath ×2.
                 parseStringArray(formData, key) → tableau nettoyé (multi-valué
                 via getAll OU chaîne CSV via get + split).
                 handleActionError(error) → ré-export de @/lib/actions/result.

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

relatedFiles:    ["@/lib/actions/result.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["next/cache",
                  "@/lib/actions/result",
                  "@/app/scrum/lib/types"]

exports:         ["ActionResult", "handleActionError",
                  "revalidateScrumFlow", "parseStringArray"]

useBy:           ["@/app/scrum/lib/actions/epic.ts",
                  "@/app/scrum/lib/actions/feature.ts",
                  "@/app/scrum/lib/actions/global-json.ts",
                  "@/app/scrum/lib/actions/idee.ts",
                  "@/app/scrum/lib/actions/persona.ts",
                  "@/app/scrum/lib/actions/sprint.ts",
                  "@/app/scrum/lib/actions/task.ts",
                  "@/app/scrum/lib/actions/user-story.ts"]

userStories:     ["*en tant que développeur je veux des helpers d'actions Scrum partagés"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/actions/result";
import type { ScrumFlow } from "@/app/scrum/lib/types";

/* ------------------------------------------------------------------ */
/*  Ré-exports du contrat neutre                                       */
/* ------------------------------------------------------------------ */

export type { ActionResult };
export { handleActionError } from "@/lib/actions/result";

/* ------------------------------------------------------------------ */
/*  Revalidation                                                       */
/* ------------------------------------------------------------------ */

/**
 * Revalide la vue d'ensemble du flux et la section demandée.
 * `section` est optionnel (utile pour les actions qui ne concernent
 * qu'une seule section, ex. "sprint").
 *
 * IMPORTANT : cette fonction doit être appelée depuis une Server Action
 * (le "use server" de l'appelant garantit le contexte serveur requis
 * par revalidatePath).
 */
export function revalidateScrumFlow(flow: ScrumFlow, section?: string): void {
  revalidatePath(`/core/${flow}`);
  if (section) revalidatePath(`/core/${flow}/${section}`);
}

/* ------------------------------------------------------------------ */
/*  Lecture FormData                                                   */
/* ------------------------------------------------------------------ */

/**
 * Lit un champ FormData qui peut être :
 * - multi-valué (formData.getAll → string[]) : ex. plusieurs
 *   <input name="personas">
 * - ou une seule chaîne CSV (formData.get + split(",")) : ex. "Marie,Karim"
 * Retourne un tableau nettoyé (trim + filter Boolean).
 */
export function parseStringArray(formData: FormData, key: string): string[] {
  const values = formData.getAll(key);
  if (values.length > 0) {
    return values
      .map(String)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  const single = formData.get(key);
  if (typeof single === "string" && single.length > 0) {
    return single
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}