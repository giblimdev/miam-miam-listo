/*
path :           app/blog/community/[groupSlug]/page.tsx
tag :            ["blog", "page", "community", "group", "detail", "avatar"]
projectId:       new-genesis
type :           page
generic:         false

role:            Page d'un groupe. Sync page + Suspense. Affiche le
                 header (nom, description, visibilité, compteurs),
                 les actions contextuelles (Rejoindre / Quitter /
                 Demandes) via GroupActions, la liste des discussions
                 (liens vers la page discussion), et un formulaire
                 « Ouvrir une discussion » réservé aux membres actifs.
                 Groupes private : 404 pour les non-membres. Groupes
                 unlisted : accessibles par lien direct. Toute
                 l'autorisation et la résolution de rôle sont
                 calculées côté serveur à partir de getSession().
                 Résout les profils auteurs des discussions
                 (authorId par discussion) via resolveAuthorProfiles.
                 ⚠️ `await io()` avant getBlogSession() (NowGenerator
                 Prisma 7 synchrone bloquant).

flow:            BlogGroupPage (sync) → <Suspense fallback=<GroupSkeleton />>
                 → <GroupSection params /> async → await io() →
                 await params → getGroupBySlug(slug) → si null 404 →
                 getBlogSession() → viewerId / member / isOwnerOrMod →
                 si private && !isMember → 404 →
                 resolveAuthorProfiles(discussions.map(d => d.authorId))
                 → rend header + <GroupActions /> + liste discussions
                 (avec noms réels) + <NewDiscussionForm /> si membre.

ecosystem:       Blog = [
                   "@/app/blog/[slug]/page.tsx",
                   "@/app/blog/admin/articles/[id]/edit/page.tsx",
                   "@/app/blog/admin/articles/new/page.tsx",
                   "@/app/blog/admin/articles/page.tsx",
                   "@/app/blog/admin/setup/page.tsx",
                   "@/app/blog/admin/taxonomy/page.tsx",
                   "@/app/blog/articles/[id]/edit/page.tsx",
                   "@/app/blog/articles/ArticleRow.tsx",
                   "@/app/blog/articles/new/page.tsx",
                   "@/app/blog/articles/page.tsx",
                   "@/app/blog/community/[groupSlug]/[discussionId]/page.tsx",
                   "@/app/blog/community/[groupSlug]/page.tsx",
                   "@/app/blog/community/[groupSlug]/requests/page.tsx",
                   "@/app/blog/community/new/page.tsx",
                   "@/app/blog/community/page.tsx",
                   "@/app/blog/help/page.tsx",
                   "@/app/blog/notifications/page.tsx",
                   "@/app/blog/page.tsx",
                   "@/app/blog/search/page.tsx",
                   "@/app/blog/tag/[slug]/page.tsx",
                   "@/app/blog/theme/[slug]/[category]/[subCategory]/page.tsx",
                   "@/app/blog/theme/[slug]/[category]/page.tsx",
                   "@/app/blog/theme/[slug]/page.tsx",
                   "@/app/blog/user/articles/page.tsx",
                   "@/app/blog/user/favorites/page.tsx",
                 ]

relatedFiles:    ["@/app/blog/lib/services/group.ts",
                  "@/app/blog/lib/services/author.ts",
                  "@/app/blog/lib/session.ts",
                  "@/app/blog/components/GroupActions.tsx",
                  "@/app/blog/components/NewDiscussionForm.tsx"]

imports:         ["react", "next/navigation", "next/link", "next/cache",
                  "lucide-react",
                  "@/app/blog/lib/services/group",
                  "@/app/blog/lib/services/author",
                  "@/app/blog/lib/session",
                  "@/app/blog/components/GroupActions",
                  "@/app/blog/components/NewDiscussionForm",
                  "@/components/ui/avatar",
                  "@/components/ui/skeleton",
                  "@/utils/initials"]

exports:         ["default BlogGroupPage"]

useBy:           []

userStories:     ["us3100001", "us3100002", "us3100003",
                  "*en tant qu'utilisateur je veux voir le nom des auteurs des discussions"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { io } from "next/cache";
import {
  Lock,
  MessageSquare,
  MessageSquarePlus,
  Users,
} from "lucide-react";

import { getGroupBySlug } from "@/app/blog/lib/services/group";
import { resolveAuthorProfiles } from "@/app/blog/lib/services/author";
import { getBlogSession } from "@/app/blog/lib/session";
import { GroupActions } from "@/app/blog/components/GroupActions";
import { NewDiscussionForm } from "@/app/blog/components/NewDiscussionForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { initialsOf } from "@/utils/initials";

type PageParams = Promise<{ groupSlug: string }>;

/* ------------------------------------------------------------------ */
/*  Page (sync)                                                        */
/* ------------------------------------------------------------------ */

export default function BlogGroupPage({ params }: { params: PageParams }) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      <Suspense fallback={<GroupSkeleton />}>
        <GroupSection params={params} />
      </Suspense>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section async                                                      */
/* ------------------------------------------------------------------ */

async function GroupSection({ params }: { readonly params: PageParams }) {
  /* ⚠️ io() AVANT Prisma (cf. en-tête). */
  await io();

  const { groupSlug } = await params;
  const group = await getGroupBySlug(groupSlug);
  if (!group) notFound();

  /* Session */
  const session = await getBlogSession();
  const viewerId = session?.user?.id ?? null;

  /* Rôle du viewer dans ce groupe (ou undefined) */
  const member = viewerId
    ? group.members.find(
        (m) => m.userId === viewerId && m.status === "active",
      )
    : undefined;
  const isMember = Boolean(member);
  const isOwnerOrMod =
    member?.role === "owner" || member?.role === "moderator";

  /* Groupes private : 404 pour les non-membres (ne pas révéler) */
  if (group.visibility === "private" && !isMember) notFound();

  /* Résolution des profils auteurs des discussions. */
  const authorProfiles = await resolveAuthorProfiles(
    group.discussions.map((d) => d.authorId),
  );

  /* Compteurs */
  const activeMembers = group.members.filter(
    (m) => m.status === "active",
  ).length;
  const pendingRequests = group.members.filter(
    (m) => m.status === "pending",
  ).length;

  const visibilityLabel =
    group.visibility === "public"
      ? "Public"
      : group.visibility === "private"
        ? "Privé"
        : "Non listé";

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------ */}
      {/*  Header                                                       */}
      {/* ------------------------------------------------------------ */}
      <header className="space-y-4 rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-2">
              Groupe · {visibilityLabel}
              {group.visibility === "private" && (
                <Lock
                  className="ml-1 inline size-3 align-baseline"
                  aria-hidden
                />
              )}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {group.name}
            </h1>
            {group.description && (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {group.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden />
                {activeMembers} membre{activeMembers > 1 ? "s" : ""}
                {isOwnerOrMod && pendingRequests > 0 && (
                  <Link
                    href={`/blog/community/${group.slug}/requests`}
                    className="ml-1 rounded-full bg-chart-1/15 px-2 py-0.5 text-[10px] font-semibold text-chart-1 hover:underline"
                  >
                    {pendingRequests} en attente
                  </Link>
                )}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="size-3.5" aria-hidden />
                {group.discussions.length} discussion
                {group.discussions.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <GroupActions
            group={group}
            isMember={isMember}
            isOwnerOrMod={isOwnerOrMod}
            isAuthenticated={Boolean(viewerId)}
          />
        </div>
      </header>

      {/* ------------------------------------------------------------ */}
      {/*  Discussions                                                  */}
      {/* ------------------------------------------------------------ */}
      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Discussions
          </h2>
        </header>

        {group.discussions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune discussion pour l&apos;instant.
              {isMember
                ? " Ouvrez la première ci-dessous."
                : " Rejoignez le groupe pour en ouvrir une."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {group.discussions
              .slice()
              .sort((a, b) => {
                const ta = Date.parse(a.createdAt);
                const tb = Date.parse(b.createdAt);
                return tb - ta; // DESC
              })
              .map((d) => {
                const visiblePosts = d.posts.filter((p) => !p.deletedAt);
                const author = authorProfiles.get(d.authorId);
                const authorName = author?.name ?? "Utilisateur inconnu";
                const authorImage = author?.image ?? null;
                return (
                  <li key={d.id}>
                    <Link
                      href={`/blog/community/${group.slug}/${d.id}`}
                      className="group flex flex-col gap-1 rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="text-sm font-semibold text-foreground">
                        {d.title}
                      </span>
                      {d.content && (
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {d.content}
                        </span>
                      )}
                      <span className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>
                          {visiblePosts.length} réponse
                          {visiblePosts.length > 1 ? "s" : ""}
                        </span>
                        <span aria-hidden>·</span>
                        <Avatar className="size-4">
                          {authorImage && (
                            <AvatarImage src={authorImage} alt="" />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-chart-2 to-chart-3 text-[8px] font-bold text-white">
                            {initialsOf(authorName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground/80">
                          {authorName}
                        </span>
                        <span aria-hidden>·</span>
                        <span>
                          {new Date(d.createdAt).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------------ */}
      {/*  Nouvelle discussion (membre actif uniquement)                */}
      {/* ------------------------------------------------------------ */}
      {isMember ? (
        <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
          <header className="flex items-center gap-2">
            <MessageSquarePlus
              className="size-4 text-chart-2"
              aria-hidden
            />
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Ouvrir une discussion
            </h2>
          </header>
          <NewDiscussionForm groupId={group.id} />
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {viewerId
              ? "Rejoignez le groupe pour ouvrir une discussion."
              : "Connectez-vous et rejoignez le groupe pour participer."}
          </p>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function GroupSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}