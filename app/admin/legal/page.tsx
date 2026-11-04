/*
path :           app/admin/legal/page.tsx
tag :            ["admin", "legal", "hub", "page", "privacy", "terms"]
projectId :      <à fournir>
type :           page
generic:         false

role:            Page hub de la section « Legal » de l'admin. Liste les
                 deux documents légaux (Politique de confidentialité,
                 Conditions générales d'utilisation) sous forme de cartes
                 cliquables menant vers /admin/legal/privacy et
                 /admin/legal/terms. Sert de point d'entrée pour la nav
                 Admin > Legal (2 niveaux) — évite un 3ᵉ niveau de
                 sous-menu dans le header. Server Component statique :
                 aucune donnée dynamique, aucun fetch. Mobile first :
                 grille 1 / 2 colonnes.

                 AUCUNE restriction d'accès pour l'instant (la protection
                 RBAC sera ajoutée plus tard, quand Better Auth sera
                 configuré — voir app/admin/layout.tsx à créer).

flow:            Server Component pur → rend un wrapper max-w-5xl →
                 Hero (badge, titre, description) → grille de 2 cartes
                 (Privacy, Terms) avec icône, titre, description et CTA.
                 Aucun état, aucun effet, aucun fetch.

ecosystem:       Admin = [
                   "@/app/admin/legal/page.tsx",
                   "@/app/admin/legal/privacy/page.tsx",
                   "@/app/admin/legal/terms/page.tsx",
                 ]

relatedFiles:    ["@/app/legal/privacy/page.tsx",
                  "@/app/legal/terms/page.tsx",
                  "@/components/ui/button.tsx",
                  "@/components/ui/card.tsx"]

imports:         ["next/link", "lucide-react",
                  "@/components/ui/button",
                  "@/components/ui/card"]

exports:         ["default AdminLegalPage", "metadata"]

useBy:           []

userStories:     ["*en tant qu'admin je veux accéder aux documents légaux depuis un point d'entrée unique"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ScrollText,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Documents légaux — Admin",
  description:
    "Accès aux documents légaux : politique de confidentialité et conditions générales d'utilisation.",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LegalDocCard {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly accent: string;
}

/* ------------------------------------------------------------------ */
/*  Config — documents légaux                                          */
/* ------------------------------------------------------------------ */

const LEGAL_DOCS: readonly LegalDocCard[] = [
  {
    id: "privacy",
    label: "Politique de confidentialité",
    description:
      "Données collectées, finalités, durées de conservation, droits RGPD, cookies, contact. Document de référence pour la conformité.",
    href: "/admin/legal/privacy",
    icon: ShieldCheck,
    accent: "chart-4",
  },
  {
    id: "terms",
    label: "Conditions générales d'utilisation",
    description:
      "Objet du service, rôles (client / commerçant / livreur), obligations, prix et paiement, responsabilité, résiliation, droit applicable.",
    href: "/admin/legal/terms",
    icon: ScrollText,
    accent: "chart-3",
  },
];

/* ------------------------------------------------------------------ */
/*  Sous-composants                                                    */
/* ------------------------------------------------------------------ */

function LegalDocTile({ doc }: { readonly doc: LegalDocCard }) {
  const Icon = doc.icon;
  const accent = doc.accent;

  return (
    <Link
      href={doc.href}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ "--accent": `var(--${accent})` } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-70"
        style={{
          background: `linear-gradient(90deg, var(--${accent}), transparent)`,
        }}
      />

      <CardHeader className="flex flex-row items-start gap-3 p-0">
        <div
          className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-md"
          style={{
            background: `linear-gradient(135deg, var(--${accent}), color-mix(in oklab, var(--${accent}) 60%, black))`,
          }}
        >
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">{doc.label}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-4 p-0 pt-4">
        <CardDescription className="text-sm leading-relaxed text-foreground/80">
          {doc.description}
        </CardDescription>

        <span
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-0.5"
          style={{ color: `var(--${accent})` }}
        >
          Ouvrir
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </CardContent>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminLegalPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-chart-3/5 via-chart-4/5 to-chart-2/5 p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-chart-3/20 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-chart-3" aria-hidden />
            Section · Legal
          </span>

          <h1 className="mt-4 bg-gradient-to-r from-chart-3 via-chart-4 to-chart-2 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Documents légaux
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Politique de confidentialité et conditions générales d&apos;utilisation.
            Ces documents font foi pour la conformité RGPD et les relations
            contractuelles entre Miam-miam Listo, les commerçants, les clients
            et les livreurs.
          </p>
        </div>
      </header>

      {/* Documents */}
      <section>
        <header className="mb-5">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Documents
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deux documents de référence, à consulter et partager.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {LEGAL_DOCS.map((doc) => (
            <LegalDocTile key={doc.id} doc={doc} />
          ))}
        </div>
      </section>

      {/* CTA vers les pages publiques */}
      <footer className="rounded-2xl border border-border/60 bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Les versions publiques de ces documents sont accessibles à tous sur{" "}
          <Link
            href="/legal/privacy"
            className="font-medium text-chart-3 hover:underline"
          >
            /legal/privacy
          </Link>{" "}
          et{" "}
          <Link
            href="/legal/terms"
            className="font-medium text-chart-3 hover:underline"
          >
            /legal/terms
          </Link>
          . Les versions admin ci-dessus sont identiques, exposées dans
          l&apos;espace d&apos;administration pour la traçabilité.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/legal/privacy"
            className={buttonVariants({ variant: "outline" })}
          >
            Voir Privacy (public)
          </Link>
          <Link
            href="/legal/terms"
            className={buttonVariants({ variant: "outline" })}
          >
            Voir Terms (public)
          </Link>
        </div>
      </footer>
    </div>
  );
}