/*
path :           app/blog/notifications/page.tsx
tag :            ["blog", "page", "notifications", "protected", "io"]
projectId:       new-genesis
type :           page
generic:         false

role:            Page des notifications in-app. Sync page + Suspense ;
                 require session, lit listNotifications via le service
                 et rend NotificationList (Client) qui gère marquage
                 lu / suppression via les Server Actions existantes.

                 ⚠️ `await io()` AVANT getBlogSession() : Prisma 7 lit
                 `new Date()` de manière synchrone dans son NowGenerator
                 (bug connu, cf. nextjs.org/docs/messages/blocking-
                 prerender-current-time). Sans point de suspension
                 préalable sous <Suspense>, Next.js lève
                 « Blocking Route ».
                 ⚠️ Base UI : le CTA « Se connecter » est un <Link>
                 stylé via buttonVariants(), PAS un
                 <Button render={<Link/>}>.

flow:            NotificationsPage → Suspense → NotificationsSection
                 async → await io() → getBlogSession → si null :
                 CTA login (Link stylé) → listNotifications(userId) →
                 <NotificationList items />.

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

relatedFiles:    ["@/app/blog/lib/services/notification.ts",
                  "@/app/blog/lib/session.ts",
                  "@/app/blog/components/NotificationList.tsx"]

imports:         ["react", "next/link", "next/cache", "lucide-react",
                  "@/app/blog/lib/services/notification",
                  "@/app/blog/lib/session",
                  "@/app/blog/components/NotificationList",
                  "@/components/ui/button",
                  "@/components/ui/skeleton"]

exports:         ["default BlogNotificationsPage"]

useBy:           []

userStories:     ["us5100003"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import Link from "next/link";
import { io } from "next/cache";
import { Bell, ArrowRight } from "lucide-react";

import { listNotifications } from "@/app/blog/lib/services/notification";
import { getBlogSession } from "@/app/blog/lib/session";
import { NotificationList } from "@/app/blog/components/NotificationList";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogNotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-1">
          Mon compte
        </p>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <Bell className="size-5 text-chart-1" aria-hidden />
          Notifications
        </h1>
      </header>
      <Suspense fallback={<NotifSkeleton />}>
        <NotificationsSection />
      </Suspense>
    </div>
  );
}

async function NotificationsSection() {
  /* ⚠️ io() AVANT Prisma (cf. en-tête). */
  await io();

  const session = await getBlogSession();
  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour voir vos notifications.
        </p>
        <Link
          href="/core/auth/login"
          className={`${buttonVariants()} mt-4 gap-2`}
        >
          Se connecter
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const items = await listNotifications(session.user.id);
  return <NotificationList items={items} />;
}

function NotifSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}