/*
path :           app/blog/components/MemberActions.tsx
tag :            ["blog", "component", "group", "member-actions", "client"]
projectId:       new-genesis
type :           component
generic:         false

role:            Boutons Approuver / Refuser pour une demande d'adhésion
                 de groupe. Client Component : useTransition + toast +
                 router.refresh.

flow:            Props { groupId, userId } → boutons → approveMember
                 Action / rejectMemberAction → toast + refresh.

ecosystem:       BlogUI = [
                   ... (identique à ArticleCard)
                 ]

relatedFiles:    ["@/app/blog/lib/actions/group.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/group",
                  "@/components/ui/button"]

exports:         ["MemberActions", "MemberActionsProps"]

useBy:           ["@/app/blog/community/[groupSlug]/requests/page.tsx"]

userStories:     ["us3100002"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useTransition, router.refresh, toast.

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import {
  approveMemberAction,
  rejectMemberAction,
} from "@/app/blog/lib/actions/group";
import { Button } from "@/components/ui/button";

export interface MemberActionsProps {
  readonly groupId: string;
  readonly userId: string;
}

export function MemberActions({ groupId, userId }: MemberActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      const result = await approveMemberAction(groupId, userId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Demande approuvée.");
      router.refresh();
    });
  }

  function reject() {
    startTransition(async () => {
      const result = await rejectMemberAction(groupId, userId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Demande refusée.");
      router.refresh();
    });
  }

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        size="sm"
        onClick={approve}
        disabled={isPending}
        className="gap-1.5"
      >
        <Check className="size-3.5" aria-hidden />
        Approuver
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={reject}
        disabled={isPending}
        className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="size-3.5" aria-hidden />
        Refuser
      </Button>
    </div>
  );
}