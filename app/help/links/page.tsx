/*
path :           app/help/links/page.tsx
tag :            ["links", "page", "external", "resources", "apps"]
projectId:       eval-biz
type:            page
generic:         false

role:            Page /links — annuaire public de ressources externes.
                 Accès ouvert à tous (aucune garde d'accès, aucune
                 session, aucune requête Prisma). Page entièrement
                 statique : EXTERNAL_LINKS est une constante, le rendu
                 est piloté par listLinkCategories(). Aucun Server
                 Action, aucune mutation, aucune I/O.

                 La rubrique "Apps" (déploiements Vercel) est rendue
                 comme n'importe quelle autre catégorie — ajouter ou
                 retirer une entrée dans links-config.ts suffit,
                 aucune modification de cette page n'est nécessaire.

                 Grille responsive mobile-first :
                 1 / 2 / 3 / 4 colonnes (sm / md / lg / xl).
                 Une section par catégorie (dérivée dynamiquement de
                 la source de vérité, cf. listLinkCategories), chaque
                 section affiche les cartes de sa catégorie dans
                 l'ordre d'apparition. Lien externe : target _blank +
                 rel noopener noreferrer.

                 État vide : si EXTERNAL_LINKS est vide (config
                 modifiée), EmptyState est affiché à la place de la
                 grille.

flow:            LinksPage (sync) → header statique →
                 si EXTERNAL_LINKS vide : EmptyState →
                 sinon catégories = listLinkCategories() → rend une
                 section par catégorie (header + grille de cartes).
                 Chaque carte = <Link> stylé avec accent chart dérivé.

ecosystem:       Links = [
                   "@/app/links/page.tsx",
                   "@/lib/links/links-config.ts",
                 ]

relatedFiles:    ["@/lib/links/links-config.ts",
                  "@/components/ui/empty-state.tsx"]

imports:         ["next/link", "next",
                  "lucide-react",
                  "@/lib/links/links-config",
                  "@/components/ui/empty-state"]

exports:         ["default LinksPage", "metadata"]

useBy:           ["@/components/layout/header/nav/frontWorkSpace.ts"]

userStories:     ["*en tant que visiteur je veux un annuaire de ressources externes",
                  "*en tant que visiteur je veux accéder aux déploiements Vercel du projet",
                  "*en tant que visiteur je veux ouvrir un lien externe dans un nouvel onglet"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  ExternalLink as ExternalLinkIcon,
  Link2,
} from "lucide-react";

import {
  EXTERNAL_LINKS,
  listLinkCategories,
  type ExternalLink,
  type ExternalLinkCategory,
} from "@/lib/links/links-config";
import { EmptyState } from "@/components/ui/empty-state";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Liens — ressources externes",
  description:
    "Annuaire des ressources externes utiles au projet : déploiements Vercel, documentation, outils, apprentissage, communauté et design.",
};

/* ------------------------------------------------------------------ */
/*  Page (sync, publique, 100 % statique)                              */
/* ------------------------------------------------------------------ */

export default function LinksPage() {
  const categories = listLinkCategories();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:py-14">
      <header className="space-y-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-chart-2">
          <Link2 className="size-3.5" aria-hidden />
          Ressources
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Liens externes
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Une sélection curée des ressources utiles au projet : déploiements
          Vercel, documentation, outils, apprentissage, communauté et design.
        </p>
      </header>

      {EXTERNAL_LINKS.length === 0 ? (
        <EmptyState
          icon={<Link2 className="size-8" aria-hidden />}
          title="Aucun lien pour l'instant"
          description="Ajoutez une entrée dans EXTERNAL_LINKS (lib/links/links-config.ts) pour commencer."
        />
      ) : (
        <div className="space-y-10">
          {categories.map((category) => {
            const links = EXTERNAL_LINKS.filter(
              (link) => link.category === category,
            );
            if (links.length === 0) return null;
            return (
              <LinkCategorySection
                key={category}
                category={category}
                links={links}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section par catégorie                                              */
/* ------------------------------------------------------------------ */

function LinkCategorySection({
  category,
  links,
}: {
  readonly category: ExternalLinkCategory;
  readonly links: readonly ExternalLink[];
}) {
  return (
    <section aria-labelledby={`category-${category}`} className="space-y-4">
      <header className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-2">
        <h2
          id={`category-${category}`}
          className="text-lg font-bold tracking-tight text-foreground"
        >
          {category}
        </h2>
        <p className="text-xs text-muted-foreground">
          {links.length} lien{links.length > 1 ? "s" : ""}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {links.map((link) => (
          <ExternalLinkCard key={link.id} link={link} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Carte de lien                                                      */
/* ------------------------------------------------------------------ */

function ExternalLinkCard({ link }: { readonly link: ExternalLink }) {
  const accent = link.accent;

  return (
    <Link
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${link.label} — ouvre un nouvel onglet`}
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

      <header className="mb-2 flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-base font-bold leading-tight tracking-tight text-foreground">
          {link.label}
        </h3>
        <ExternalLinkIcon
          className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
          aria-hidden
        />
      </header>

      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
        {link.description}
      </p>

      <span
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: `var(--${accent})` }}
      >
        Ouvrir
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
