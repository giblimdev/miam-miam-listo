/*
path :           app/blog/components/NotificationList.tsx
tag :            ["blog", "component", "notification", "list", "client"]
projectId:       new-genesis
type :           component
generic:         false

role:            Liste des notifications. Client Component : bouton
                 "Tout marquer lu", marquage individuel au clic,
                 suppression. Appelle markAllAsReadAction,
                 markAsReadAction, deleteNotificationAction et
                 router.refresh().

flow:            Props { items } → rend liste avec styles lues/non-lues
                 → actions inline.

ecosystem:       BlogUI = [
                   ... (identique à ArticleCard)
                 ]

relatedFiles:    ["@/app/blog/lib/actions/notification.ts",
                  "@/app/blog/lib/types.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/notification",
                  "@/app/blog/lib/types",
                  "@/components/ui/button"]

exports:         ["NotificationList", "NotificationListProps"]

useBy:           ["@/app/blog/notifications/page.tsx"]

userStories:     ["us5100003"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useTransition, router.refresh, toast.

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteNotificationAction,
  markAllAsReadAction,
  markAsReadAction,
} from "@/app/blog/lib/actions/notification";
import type { Notification } from "@/app/blog/lib/types";
import { Button } from "@/components/ui/button";

export interface NotificationListProps {
  readonly items: readonly Notification[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TYPE_LABEL: Record<Notification["type"], string> = {
  reply: "Réponse",
  group_invite: "Invitation de groupe",
  group_join_approved: "Adhésion approuvée",
  group_new_discussion: "Nouvelle discussion",
};

export function NotificationList({ items }: NotificationListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const unread = items.filter((n) => !n.readAt).length;

  function markAll() {
    startTransition(async () => {
      const result = await markAllAsReadAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Toutes les notifications sont lues.");
      router.refresh();
    });
  }

  function markOne(id: string) {
    startTransition(async () => {
      const result = await markAsReadAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteNotificationAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
        <Bell
          className="mx-auto mb-2 size-8 text-muted-foreground"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">
          Aucune notification pour l&apos;instant.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {unread} non lue{unread > 1 ? "s" : ""} sur {items.length}
        </p>
        {unread > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={markAll}
            disabled={isPending}
            className="gap-1.5"
          >
            <Check className="size-3.5" aria-hidden />
            Tout marquer lu
          </Button>
        )}
      </div>

      <ul className="space-y-2">
        {items.map((n) => (
          <li
            key={n.id}
            className={`flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-start ${
              n.readAt
                ? "border-border/60 bg-muted/10"
                : "border-chart-1/40 bg-chart-1/5"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2 text-xs">
                <span className="font-semibold text-foreground">
                  {TYPE_LABEL[n.type]}
                </span>
                <span className="text-muted-foreground">
                  · {formatDate(n.createdAt)}
                </span>
                {!n.readAt && (
                  <span className="rounded-full bg-chart-1/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-chart-1">
                    Nouveau
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-foreground/90">
                {n.excerpt}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              {!n.readAt && (
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => markOne(n.id)}
                  disabled={isPending}
                  aria-label="Marquer comme lu"
                >
                  <Check aria-hidden />
                </Button>
              )}
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={() => remove(n.id)}
                disabled={isPending}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label="Supprimer la notification"
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}