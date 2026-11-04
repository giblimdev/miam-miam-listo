/*
path :           app/blog/community/new/page.tsx
tag :            ["blog", "page", "community", "create", "protected", "io"]
projectId:       new-genesis
type :           page
generic:         false

role:            Page de création d'un groupe. Sync page + Suspense ;
                 require session. Rend un formulaire client minimal
                 qui appelle createGroupAction(formData) et redirige
                 vers la page du groupe créé.

                 ⚠️ `await io()` AVANT getBlogSession() (NowGenerator
                 Prisma 7). CTA login = <Link> stylé via
                 buttonVariants(), PAS <Button render={<Link/>}>.

flow:            NewGroupPage → Suspense → NewGroupSection async →
                 await io() → getBlogSession → si null : message login
                 (Link stylé) → <NewGroupForm /> (Client Component).

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

relatedFiles:    ["@/app/blog/lib/actions/group.ts",
                  "@/app/blog/lib/session.ts",
                  "@/app/blog/components/NewGroupForm.tsx"]

imports:         ["react", "next/link", "next/cache", "lucide-react",
                  "@/app/blog/lib/session",
                  "@/app/blog/components/NewGroupForm",
                  "@/components/ui/button",
                  "@/components/ui/skeleton"]

exports:         ["default BlogCommunityNewPage"]

useBy:           []

userStories:     ["us3100001"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import Link from "next/link";
import { io } from "next/cache";
import { ArrowRight } from "lucide-react";

import { getBlogSession } from "@/app/blog/lib/session";
import { NewGroupForm } from "@/app/blog/components/NewGroupForm";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogCommunityNewPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-2">
          Communauté
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Créer un groupe
        </h1>
      </header>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
        <NewGroupSection />
      </Suspense>
    </div>
  );
}

async function NewGroupSection() {
  /* ⚠️ io() AVANT Prisma. */
  await io();

  const session = await getBlogSession();
  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour créer un groupe.
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
  return <NewGroupForm />;
}