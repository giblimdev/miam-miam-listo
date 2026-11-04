/*
path :           app/blog/user/articles/page.tsx
tag :            ["blog", "page", "user", "articles", "crud", "protected"]
projectId:       new-genesis
type :           page
generic:         false

role:            Page personnelle « Mes articles ». Sync page + Suspense.
                 Affiche la liste des articles de l'utilisateur connecté
                 (filtre authorId === session.user.id) avec badge
                 statut/visibilité, boutons Éditer / Publier / Archiver /
                 Supprimer. Réutilise ArticleRow (Client Component) et les
                 wrappers de mutation compatibles <form action> exposés
                 par @/app/blog/lib/actions/article-form. Un bandeau
                 d'invite + CTA « Nouvel article » pointe vers
                 /blog/articles/new (route existante). Sécurité : seul
                 l'auteur voit ses propres articles (filtrage serveur
                 strict). Aucune lecture Prisma directe : la seule I/O
                 est listArticles() (fs) + getBlogSession() (mémoïsé).
                 ⚠️ `await io()` AVANT getBlogSession() par cohérence
                 avec les autres pages async du module Blog (Prisma 7
                 NowGenerator synchrone bloquant). Sans point de
                 suspension préalable sous <Suspense>, le prérendu
                 bloque (cf. nextjs.org/docs/messages/blocking-
                 prerender-current-time).
                 ⚠️ Base UI : les 3 CTA de navigation sont des <Link>
                 stylés via buttonVariants(), PAS des <Button
                 render={<Link/>}>. Sinon Base UI logue « A component
                 that acts as a button expected a native <button> ».
                 Un lien de navigation doit rester un <a> pour la
                 sémantique, l'accessibilité et le Ctrl+clic.

flow:            BlogUserArticlesPage (sync) → Suspense →
                 UserArticlesSection async → await io() →
                 getBlogSession → si null : CTA login →
                 listArticles() → filter authorId === session.user.id →
                 tri draft → published → archived, puis updatedAt DESC →
                 rend header + bouton « Nouvel article » +
                 (liste ArticleRow avec editBasePath="/blog/articles"
                 | empty state CTA).

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

relatedFiles:    ["@/app/blog/lib/services/article.ts",
                  "@/app/blog/lib/actions/article-form.ts",
                  "@/app/blog/lib/session.ts",
                  "@/app/blog/lib/types.ts",
                  "@/app/blog/articles/ArticleRow.tsx",
                  "@/components/ui/button",
                  "@/components/ui/skeleton"]

imports:         ["react", "next/link", "next/cache", "lucide-react",
                  "@/app/blog/lib/services/article",
                  "@/app/blog/lib/actions/article-form",
                  "@/app/blog/lib/session",
                  "@/app/blog/lib/types",
                  "@/app/blog/articles/ArticleRow",
                  "@/components/ui/button",
                  "@/components/ui/skeleton"]

exports:         ["default BlogUserArticlesPage"]

useBy:           ["@/components/layout/header/UserMenu.tsx"]

userStories:     ["*en tant qu'auteur je veux gérer mes propres articles",
                  "us1100005", "us1100006"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import Link from "next/link";
import { io } from "next/cache";
import { ArrowUpRight, Plus, Sparkles } from "lucide-react";

import { listArticles } from "@/app/blog/lib/services/article";
import {
  archiveArticleFormAction,
  deleteArticleFormAction,
  publishArticleFormAction,
} from "@/app/blog/lib/actions/article-form";
import { getBlogSession } from "@/app/blog/lib/session";
import type { Article } from "@/app/blog/lib/types";
import { ArticleRow } from "@/app/blog/articles/ArticleRow";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

/**
 * Base path physique des routes article (création / édition).
 * NE PAS remplacer par /blog/admin/articles : cette route n'existe pas.
 */
const ARTICLE_BASE_PATH = "/blog/articles";

const STATUS_ORDER: Record<Article["status"], number> = {
  draft: 0,
  published: 1,
  archived: 2,
};

/* ------------------------------------------------------------------ */
/*  Page (sync)                                                        */
/* ------------------------------------------------------------------ */

export default function BlogUserArticlesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-2">
            Mon espace
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Mes articles
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vos brouillons, publications et archives. Seuls les admins voient
            aussi les articles des autres utilisateurs (depuis la page
            d&apos;administration).
          </p>
        </div>
        <Link
          href={`${ARTICLE_BASE_PATH}/new`}
          className={`${buttonVariants()} gap-2`}
        >
          <Plus className="size-4" aria-hidden />
          Nouvel article
        </Link>
      </header>

      <Suspense fallback={<UserArticlesSkeleton />}>
        <UserArticlesSection />
      </Suspense>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section async                                                      */
/* ------------------------------------------------------------------ */

async function UserArticlesSection() {
  /* ⚠️ io() AVANT getBlogSession : Prisma 7 lit new Date() de façon
     synchrone dans son NowGenerator (bug connu). */
  await io();

  const session = await getBlogSession();
  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour gérer vos articles.
        </p>
        <Link
          href="/core/auth/login"
          className={`${buttonVariants()} mt-4 gap-2`}
        >
          Se connecter
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const viewerId = session.user.id;
  const all = await listArticles();
  const mine = all.filter((a) => a.authorId === viewerId);

  /* Tri : brouillons → publiés → archivés, puis updatedAt DESC. */
  const articles = [...mine].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-chart-2/10 text-chart-2">
          <Sparkles className="size-6" aria-hidden />
        </div>
        <h2 className="text-base font-semibold text-foreground">
          Vous n&apos;avez encore aucun article
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Créez votre premier brouillon, choisissez sa taxonomie, structurez
          son contenu en blocs, puis publiez-le depuis cette page.
        </p>
        <Link
          href={`${ARTICLE_BASE_PATH}/new`}
          className={`${buttonVariants()} mt-2 gap-2`}
        >
          <Plus className="size-4" aria-hidden />
          Créer mon premier article
        </Link>
      </div>
    );
  }

  /* Compteurs par statut (badge discret sous la liste). */
  const draftCount = articles.filter((a) => a.status === "draft").length;
  const publishedCount = articles.filter(
    (a) => a.status === "published",
  ).length;
  const archivedCount = articles.filter(
    (a) => a.status === "archived",
  ).length;

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {articles.map((article) => (
          <ArticleRow
            key={article.id}
            article={article}
            publishAction={publishArticleFormAction}
            archiveAction={archiveArticleFormAction}
            deleteAction={deleteArticleFormAction}
            editBasePath={ARTICLE_BASE_PATH}
          />
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        {articles.length} article{articles.length > 1 ? "s" : ""} ·{" "}
        {draftCount} brouillon{draftCount > 1 ? "s" : ""} ·{" "}
        {publishedCount} publié{publishedCount > 1 ? "s" : ""} ·{" "}
        {archivedCount} archivé{archivedCount > 1 ? "s" : ""}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function UserArticlesSkeleton() {
  return (
    <ul className="space-y-2">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-7 w-40" />
        </li>
      ))}
    </ul>
  );
}