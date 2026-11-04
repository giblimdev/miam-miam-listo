/*
path :           app/page.tsx
tag :            ["home", "page", "blog", "landing", "presentation"]
projectId:       new-genesis
type:            page
generic:         false

role:            Page d'accueil de Genesis — présentation EXCLUSIVE du Blog.
                 Présente la marque éditoriale, les 9 features principales
                 sous forme de cartes cliquables (Articles, Recherche,
                 Commentaires, Favoris/Likes, Groupes, Notifications,
                 Mes articles, Écrire, Mode d'emploi) et 4 CTAs d'entrée.
                 Aucune donnée dynamique, aucun fetch : page statique pour
                 rester rapide et ne pas polluer l'écosystème Home. Les
                 contenus réels sont sur /blog (articles), /blog/search,
                 etc. Mobile first : hero centré, grille 1 / 2 / 3 colonnes.

                 Historique : cette page présentait auparavant les 3 modules
                 (Core, Genesis, Blog). Elle est désormais dédiée au Blog —
                 Core et Genesis restent accessibles via la nav header et
                 directement par leurs URLs /core et /genesis.

flow:            Server Component → Hero (badge, titre dégradé, tagline,
                 3 CTAs inline) → grille de 9 <FeatureCard /> → CTA final
                 « Prêt à commencer ? » avec 2 boutons. Aucun état, aucun
                 effet. Les cartes sont des <Link> stylés via
                 buttonVariants / classes utilitaires.

ecosystem:       Home = [
                   "@/app/page.tsx",
                 ]

relatedFiles:    ["@/app/layout.tsx",
                  "@/app/blog/page.tsx",
                  "@/app/blog/search/page.tsx",
                  "@/app/blog/community/page.tsx",
                  "@/app/blog/notifications/page.tsx",
                  "@/app/blog/user/articles/page.tsx",
                  "@/app/blog/user/favorites/page.tsx",
                  "@/app/blog/articles/new/page.tsx",
                  "@/app/blog/help/page.tsx"]

imports:         ["next", "next/link", "lucide-react"]

exports:         ["default HomePage", "metadata"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux découvrir le blog et ses fonctionnalités",
                  "*en tant que lecteur je veux accéder directement aux articles et à la recherche"]

status:          wip
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bookmark,
  BookOpen,
  FileText,
  MessageSquare,
  Pencil,
  Search,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Le Blog de Genesis",
  description:
    "Articles, tutoriels, retours d'expérience et communauté autour de Genesis et du développement produit.",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FeatureEntry {
  readonly href: string;
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly accent: string;
}

/* ------------------------------------------------------------------ */
/*  Config — 9 features                                                */
/* ------------------------------------------------------------------ */

const FEATURES: readonly FeatureEntry[] = [
  {
    href: "/blog",
    title: "Articles",
    description:
      "Parcourez les articles publiés, classés par thème, catégorie et tag. Lecture libre, sans compte.",
    icon: FileText,
    accent: "chart-1",
  },
  {
    href: "/blog/search",
    title: "Recherche",
    description:
      "Recherchez dans les titres, résumés et paragraphes. Filtrez par thème, tag, auteur et date.",
    icon: Search,
    accent: "chart-2",
  },
  {
    href: "/blog",
    title: "Commentaires",
    description:
      "Commentez un article et répondez aux commentaires (arbre jusqu'à 5 niveaux). Likes par commentaire.",
    icon: MessageSquare,
    accent: "chart-3",
  },
  {
    href: "/blog/user/favorites",
    title: "Favoris & Likes",
    description:
      "Sauvegardez un article en favori, dans un dossier nommé ou en non classé. Likez articles et commentaires.",
    icon: Bookmark,
    accent: "chart-4",
  },
  {
    href: "/blog/community",
    title: "Communauté",
    description:
      "Rejoignez ou créez des groupes public/privé. Ouvrez des discussions et échangez en fil.",
    icon: Users,
    accent: "chart-5",
  },
  {
    href: "/blog/notifications",
    title: "Notifications",
    description:
      "4 types : réponse, invitation, adhésion approuvée, nouvelle discussion. Cloche + marquage lu.",
    icon: Bell,
    accent: "chart-1",
  },
  {
    href: "/blog/user/articles",
    title: "Mes articles",
    description:
      "Gérez vos brouillons, publications et archives. Publiez, archivez ou supprimez en un clic.",
    icon: Pencil,
    accent: "chart-2",
  },
  {
    href: "/blog/articles/new",
    title: "Écrire",
    description:
      "Rédigez un article avec blocs structurés (section, image, code…), couverture, taxonomie et tags.",
    icon: Sparkles,
    accent: "chart-3",
  },
  {
    href: "/blog/help",
    title: "Mode d'emploi",
    description:
      "Guide complet : personas, features, concepts, routes. Tout ce qu'il faut pour maîtriser le blog.",
    icon: BookOpen,
    accent: "chart-5",
  },
];

/* ------------------------------------------------------------------ */
/*  Carte feature                                                      */
/* ------------------------------------------------------------------ */

function FeatureCard({ feature }: { readonly feature: FeatureEntry }) {
  const Icon = feature.icon;
  const accent = feature.accent;

  return (
    <Link
      href={feature.href}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ "--accent": `var(--${accent})` } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-70"
        style={{
          background: `linear-gradient(90deg, var(--${accent}), transparent)`,
        }}
      />

      <header className="mb-3 flex items-center gap-3">
        <div
          className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-md"
          style={{
            background: `linear-gradient(135deg, var(--${accent}), color-mix(in oklab, var(--${accent}) 60%, black))`,
          }}
        >
          <Icon className="size-5" aria-hidden />
        </div>
        <h2 className="text-base font-bold tracking-tight text-foreground">
          {feature.title}
        </h2>
      </header>

      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
        {feature.description}
      </p>

      <span
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-0.5"
        style={{ color: `var(--${accent})` }}
      >
        Ouvrir
        <ArrowRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-muted/30">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-chart-1/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-12 size-96 rounded-full bg-chart-5/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-chart-2" aria-hidden />
            Le blog de Genesis
          </span>

          <h1 className="mt-5 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-5 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
            L&apos;atelier éditorial
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Articles, tutoriels et retours d&apos;expérience autour de Genesis
            et du développement produit. Commentez, sauvegardez, échangez — tout
            au même endroit.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <FileText className="size-4" aria-hidden />
              Lire les articles
            </Link>
            <Link
              href="/blog/search"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Search className="size-4" aria-hidden />
              Rechercher
            </Link>
            <Link
              href="/blog/help"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <BookOpen className="size-4" aria-hidden />
              Mode d&apos;emploi
            </Link>
          </div>
        </div>
      </section>

      {/* Features — grille 1 / 2 / 3 */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Ce que vous pouvez faire
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Neuf fonctionnalités, accessibles dès l&apos;accueil.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <FeatureCard
                key={`${feature.href}-${feature.title}`}
                feature={feature}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-gradient-to-br from-chart-1/5 via-chart-2/5 to-chart-5/5 p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Prêt à commencer ?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Lecture libre pour tous. Un compte est nécessaire pour commenter,
            liker, sauvegarder et rejoindre la communauté.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Entrer dans le blog
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/core/auth/register"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
