/*
path :           hooks/useActionResult.ts
tag :            ["hooks", "action-result", "use-transition", "toast", "client", "generic"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Hook client qui factorise le pattern « appeler une
                 Server Action + afficher un toast + rafraîchir + rollback
                 optionnel » répété dans ~18 composants du Blog. Encapsule
                 useTransition (state isPending), toast (sonner),
                 router.refresh(), et un callback rollback pour les mises
                 à jour optimistes. Compatible avec le contrat ActionResult
                 <T> partagé (@/lib/actions/result).

flow:            useActionResult() → { run, isPending }.
                 run(fn, options) → startTransition(async () => {
                   result = await fn();
                   si !result.ok : options.rollback?.() + toast.error +
                     options.onError?.(result.error) → return.
                   si options.successMessage !== false : toast.success.
                   options.onSuccess?.(result.data).
                   si options.refresh !== false : router.refresh().
                 }).
                 Options : { successMessage?, onSuccess?, onError?,
                 rollback?, refresh? }.

ecosystem:       Hooks = [
                   "@/hooks/use-mobile.ts",
                   "@/hooks/useActionResult.ts",
                 ]

relatedFiles:    ["@/lib/actions/result.ts",
                  "@/components/ui/sonner.tsx"]

imports:         ["react", "next/navigation", "sonner",
                  "@/lib/actions/result"]

exports:         ["useActionResult", "UseActionResultOptions"]

useBy:           ["@/app/blog/components/LikeButton.tsx",
                  "@/app/blog/components/FavoriteButton.tsx",
                  "@/app/blog/components/CommentForm.tsx",
                  "@/app/blog/components/NewPostForm.tsx",
                  "@/app/blog/components/NewDiscussionForm.tsx",
                  "@/app/blog/components/NewGroupForm.tsx",
                  "@/app/blog/components/GroupActions.tsx",
                  "@/app/blog/components/MemberActions.tsx",
                  "@/app/blog/components/NotificationList.tsx",
                  "@/app/blog/components/TagForm.tsx",
                  "@/app/blog/components/PlaylistForm.tsx",
                  "@/app/blog/components/QuickCreateTagDialog.tsx",
                  "@/app/blog/components/QuickCreateCategoryDialog.tsx",
                  "@/app/blog/components/FavoriteManager.tsx",
                  "@/app/blog/components/PlaylistManager.tsx",
                  "@/app/blog/components/TagSection.tsx",
                  "@/app/blog/components/TaxonomyForm.tsx"]

userStories:     ["*en tant que développeur je veux un hook standard pour les Server Actions client"]

status:          planned
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useTransition, useRouter, toast (navigateur).

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/actions/result";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface UseActionResultOptions<T> {
  /** Message de succès. `false` → pas de toast. Défaut : "Opération réussie." */
  readonly successMessage?: string | false;
  /** Callback de succès (reçoit data). Appelé après le toast, avant refresh. */
  readonly onSuccess?: (data: T) => void;
  /** Callback d'erreur (reçoit le message). Appelé après le toast d'erreur. */
  readonly onError?: (error: string) => void;
  /** Rollback à exécuter si l'action échoue (mode optimiste). */
  readonly rollback?: () => void;
  /** Rafraîchir la route après succès. Défaut : true. */
  readonly refresh?: boolean;
}

interface UseActionResultReturn {
  readonly run: <T>(
    fn: () => Promise<ActionResult<T>>,
    options?: UseActionResultOptions<T>,
  ) => void;
  readonly isPending: boolean;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useActionResult(): UseActionResultReturn {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run<T>(
    fn: () => Promise<ActionResult<T>>,
    options?: UseActionResultOptions<T>,
  ): void {
    startTransition(async () => {
      const result = await fn();

      if (!result.ok) {
        options?.rollback?.();
        toast.error(result.error);
        options?.onError?.(result.error);
        return;
      }

      if (options?.successMessage !== false) {
        toast.success(options?.successMessage ?? "Opération réussie.");
      }
      options?.onSuccess?.(result.data);

      if (options?.refresh !== false) {
        router.refresh();
      }
    });
  }

  return { run, isPending };
}