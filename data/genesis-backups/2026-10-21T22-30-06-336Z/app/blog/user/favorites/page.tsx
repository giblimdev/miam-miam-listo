/*
path :           app/blog/user/favorites/page.tsx
tag :            ["blog", "page", "user", "favorites", "protected"]
projectId:       new-genesis
type :           page
generic:         false

role:            Page des favoris. Sync page + Suspense ; require
                 session, charge favorites (unfiled + folders) via
                 getUserFavorites, affiche dossiers + non-classés +
                 bouton Créer un dossier. Les interactions
                 (createFolderAction / renameFolderAction /
                 deleteFolderAction / moveFavoriteAction) passent par
                 un Client Component FavoriteManager.

                 ⚠️ Base UI : le CTA « Se connecter » est un <Link>
                 stylé via buttonVariants(), PAS un
                 <Button render={<Link/>}> — un lien de navigation doit
                 rester un <a> pour la sémantique et l'accessibilité.
                 Le lien pointe vers /auth/login (route physique réelle).

flow:            FavoritesPage → Suspense → FavoritesSection async →
                 getBlogSession → si null : message login
                 (Link stylé vers /auth/login) → getUserFavorites →
                 listArticles (pour résoudre les titres) →
                 <FavoriteManager userContent articles />.

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

relatedFiles:    ["@/app/blog/lib/services/favorite.ts",
                  "@/app/blog/lib/services/article.ts",
                  "@/app/blog/lib/session.ts",
                  "@/app/blog/components/FavoriteManager.tsx"]

imports:         ["react", "next/link", "lucide-react",
                  "@/app/blog/lib/services/favorite",
                  "@/app/blog/lib/services/article",
                  "@/app/blog/lib/session",
                  "@/app/blog/components/FavoriteManager",
                  "@/components/ui/button",
                  "@/components/ui/skeleton"]

exports:         ["default BlogUserFavoritesPage"]

useBy:           []

userStories:     ["us2100005", "us2100006"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark } from "lucide-react";

import { getUserFavorites } from "@/app/blog/lib/services/favorite";
import { listArticles } from "@/app/blog/lib/services/article";
import { getBlogSession } from "@/app/blog/lib/session";
import { FavoriteManager } from "@/app/blog/components/FavoriteManager";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogUserFavoritesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-2">
          Mes favoris
        </p>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <Bookmark className="size-5 text-chart-2" aria-hidden />
          Favoris
        </h1>
      </header>
      <Suspense fallback={<FavoritesSkeleton />}>
        <FavoritesSection />
      </Suspense>
    </div>
  );
}

async function FavoritesSection() {
  const session = await getBlogSession();
  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour accéder à vos favoris.
        </p>
        <Link
          href="/auth/login"
          className={`${buttonVariants()} mt-4 gap-2`}
        >
          Se connecter
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const [userContent, articles] = await Promise.all([
    getUserFavorites(session.user.id),
    listArticles(),
  ]);

  return (
    <FavoriteManager userContent={userContent} articles={articles} />
  );
}

function FavoritesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}