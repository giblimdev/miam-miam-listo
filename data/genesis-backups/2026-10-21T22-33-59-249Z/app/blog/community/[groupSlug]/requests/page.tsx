/*
path :           app/blog/community/[groupSlug]/requests/page.tsx
tag :            ["blog", "page", "community", "requests", "owner"]
projectId:       new-genesis
type :           page
generic:         false

role:            Page des demandes d'adhésion d'un groupe. Sync page +
                 Suspense. Affiche les membres status=pending avec
                 boutons Approuver / Refuser. Actions via
                 approveMemberAction / rejectMemberAction. Réservé
                 owner|moderator.

flow:            RequestsPage → Suspense → RequestsSection → await
                 → getGroupBySlug → si null 404 → session → si
                 non owner/mod : 404 → liste pending → rend.

ecosystem:       Blog = [
                   ... (identique à [slug]/page.tsx)
                 ]

relatedFiles:    ["@/app/blog/lib/services/group.ts",
                  "@/app/blog/lib/session.ts",
                  "@/app/blog/components/MemberActions.tsx"]

imports:         ["react", "next/navigation", "lucide-react",
                  "@/app/blog/lib/services/group",
                  "@/app/blog/lib/session",
                  "@/app/blog/components/MemberActions",
                  "@/components/ui/skeleton"]

exports:         ["default BlogGroupRequestsPage"]

useBy:           []

userStories:     ["us3100002"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getGroupBySlug } from "@/app/blog/lib/services/group";
import { getBlogSession } from "@/app/blog/lib/session";
import { MemberActions } from "@/app/blog/components/MemberActions";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<{ groupSlug: string }>;

export default function BlogGroupRequestsPage({
  params,
}: {
  params: PageParams;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-2">
          Administration groupe
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Demandes d&apos;adhésion
        </h1>
      </header>
      <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
        <RequestsSection params={params} />
      </Suspense>
    </div>
  );
}

async function RequestsSection({ params }: { readonly params: PageParams }) {
  const { groupSlug } = await params;
  const group = await getGroupBySlug(groupSlug);
  if (!group) notFound();

  const session = await getBlogSession();
  if (!session?.user) notFound();
  const viewer = group.members.find(
    (m) => m.userId === session.user.id && m.status === "active",
  );
  if (!viewer || (viewer.role !== "owner" && viewer.role !== "moderator")) {
    notFound();
  }

  const pending = group.members.filter((m) => m.status === "pending");

  if (pending.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Aucune demande en attente.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {pending.map((m) => (
        <li
          key={m.userId}
          className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card p-4"
        >
          <span className="truncate text-sm text-foreground">
            {m.userId.slice(0, 8)}
          </span>
          <MemberActions groupId={group.id} userId={m.userId} />
        </li>
      ))}
    </ul>
  );
}