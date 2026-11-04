/*
path :           app/blog/components/GroupActions.tsx
tag :            ["blog", "component", "group", "actions", "client"]
projectId:       new-genesis
type :           component
generic:         false

role:            Boutons d'action pour un groupe : Rejoindre / Quitter
                 (member) + Gérer les demandes (owner|mod). Client
                 Component : useTransition + toast + router.refresh.

flow:            Props { group, isMember, isOwnerOrMod, isAuthenticated }
                 → boutons conditionnels → joinGroupAction /
                 leaveGroupAction → toast + refresh. Lien direct vers
                 /blog/community/[slug]/requests si isOwnerOrMod.

ecosystem:       BlogUI = [
                   ... (identique à ArticleCard)
                 ]

relatedFiles:    ["@/app/blog/lib/actions/group.ts"]

imports:         ["react", "next/navigation", "next/link",
                  "lucide-react", "sonner",
                  "@/app/blog/lib/actions/group",
                  "@/app/blog/lib/types",
                  "@/components/ui/button"]

exports:         ["GroupActions", "GroupActionsProps"]

useBy:           ["@/app/blog/community/[groupSlug]/page.tsx"]

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
import Link from "next/link";
import { LogIn, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";

import {
  joinGroupAction,
  leaveGroupAction,
} from "@/app/blog/lib/actions/group";
import type { Group } from "@/app/blog/lib/types";
import { Button } from "@/components/ui/button";

export interface GroupActionsProps {
  readonly group: Group;
  readonly isMember: boolean;
  readonly isOwnerOrMod: boolean;
  readonly isAuthenticated: boolean;
}

export function GroupActions({
  group,
  isMember,
  isOwnerOrMod,
  isAuthenticated,
}: GroupActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function join() {
    startTransition(async () => {
      const result = await joinGroupAction(group.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        group.visibility === "public"
          ? "Vous avez rejoint le groupe."
          : "Demande envoyée.",
      );
      router.refresh();
    });
  }

  function leave() {
    startTransition(async () => {
      const result = await leaveGroupAction(group.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Vous avez quitté le groupe.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isOwnerOrMod && (
        <Button
          render={
            <Link href={`/blog/community/${group.slug}/requests`} />
          }
          size="sm"
          variant="outline"
          className="gap-1.5"
        >
          <Settings className="size-3.5" aria-hidden />
          Demandes
        </Button>
      )}
      {!isAuthenticated ? (
        <Button
          render={<Link href="/core/auth/login" />}
          size="sm"
          className="gap-1.5"
        >
          <LogIn className="size-3.5" aria-hidden />
          Se connecter
        </Button>
      ) : isMember ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={leave}
          disabled={isPending}
          className="gap-1.5"
        >
          <LogOut className="size-3.5" aria-hidden />
          Quitter
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          onClick={join}
          disabled={isPending}
          className="gap-1.5"
        >
          <LogIn className="size-3.5" aria-hidden />
          {group.visibility === "public" ? "Rejoindre" : "Demander à rejoindre"}
        </Button>
      )}
    </div>
  );
}