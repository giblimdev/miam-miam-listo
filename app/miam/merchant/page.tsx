/*
path :           app/merchant/page.tsx
tag :            ["merchant", "hub", "page", "presentation", "features"]
projectId :      <MiamMiamListo>
type :           page
generic:         false

role:            Hub de l'espace commerçant (owner + staff). Présente
                 les features du MVP (POS, catalogue, stock, commandes,
                 fidélité, dashboard, paramètres) sous forme de cartes
                 cliquables, chacune menant à la page d'entrée du
                 sous-espace correspondant (/merchant/catalog,
                 /merchant/pos, etc.). Sert de point d'atterrissage
                 après l'onboarding et de tableau de navigation rapide.
                 Server Component statique : aucune donnée dynamique,
                 aucun fetch. Les cartes sont pilotées par un tableau
                 local MERCHANT_FEATURES (config propre à la page,
                 non exporté). Mobile first : grille 1 / 2 / 3 colonnes.

flow:            Server Component pur → rend un wrapper max-w-6xl →
                 Hero (badge, titre, description) → grille de cartes
                 (map sur MERCHANT_FEATURES) → section « Prochainement »
                 (V2 : lot avancé, algorithmes de tournée, export
                 comptable) → footer CTA vers /merchant/dashboard.
                 Aucun état, aucun effet, aucun fetch.

ecosystem:       Merchant = [
                   "@/app/merchant/page.tsx",
                   "@/app/merchant/layout.tsx",
                   "@/app/merchant/dashboard/page.tsx",
                   "@/app/merchant/catalog/page.tsx",
                   "@/app/merchant/pos/page.tsx",
                   "@/app/merchant/stock/page.tsx",
                   "@/app/merchant/orders/page.tsx",
                   "@/app/merchant/fidelity/page.tsx",
                   "@/app/merchant/settings/page.tsx",
                 ]

relatedFiles:    ["@/components/ui/button.tsx",
                  "@/components/ui/card.tsx",
                  "@/config/roles.ts"]

imports:         ["next/link", "lucide-react",
                  "@/components/ui/button",
                  "@/components/ui/card"]

exports:         ["default MerchantHubPage", "metadata"]

useBy:           []

userStories:     ["*en tant que commerçant je veux voir les fonctionnalités disponibles et accéder à chacune"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Gift,
  LayoutGrid,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
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
  title: "Espace commerçant — Miam-miam Listo",
  description:
    "Hub de l'espace commerçant : POS, catalogue, stock, commandes, fidélité, dashboard et paramètres.",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FeatureCard {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly accent: string;
  readonly status: "mvp" | "v2";
}

/* ------------------------------------------------------------------ */
/*  Config — features commerçant                                       */
/* ------------------------------------------------------------------ */

const MERCHANT_FEATURES: readonly FeatureCard[] = [
  {
    id: "pos",
    label: "POS mobile-first",
    description:
      "Prendre une commande terrain : sur place, à emporter ou livraison. Panier, options, encaissement mock. Pensé pour un food-truck depuis un téléphone.",
    href: "/merchant/pos",
    icon: ShoppingCart,
    accent: "chart-1",
    status: "mvp",
  },
  {
    id: "catalog",
    label: "Catalogue produits",
    description:
      "Gérer les produits, catégories, options (taille, suppléments, cuisson), disponibilité, images, allergènes et temps de préparation.",
    href: "/merchant/catalog",
    icon: Package,
    accent: "chart-2",
    status: "mvp",
  },
  {
    id: "stock",
    label: "Stock & recettes",
    description:
      "Ingrédients, recettes, déduction automatique à la vente, alertes de rupture, mouvements et inventaire. Lots FIFO avec péremption pour les courses.",
    href: "/merchant/stock",
    icon: ClipboardList,
    accent: "chart-3",
    status: "mvp",
  },
  {
    id: "orders",
    label: "Commandes",
    description:
      "Liste des commandes du commerce, vue live des commandes en cours, détail, transitions de statut, annulation et litiges.",
    href: "/merchant/orders",
    icon: LayoutGrid,
    accent: "chart-4",
    status: "mvp",
  },
  {
    id: "fidelity",
    label: "Fidélité & CRM",
    description:
      "Programme de fidélité par commerce, catalogue de récompenses, segments clients (nouveau, régulier, VIP, dormant), top clients.",
    href: "/merchant/fidelity",
    icon: Gift,
    accent: "chart-5",
    status: "mvp",
  },
  {
    id: "dashboard",
    label: "Tableau de bord",
    description:
      "CA jour/semaine/mois, commandes par statut, top produits, alertes stock ou péremption, points distribués. Cartes cliquables streamées.",
    href: "/merchant/dashboard",
    icon: BarChart3,
    accent: "chart-1",
    status: "mvp",
  },
  {
    id: "settings",
    label: "Paramètres du commerce",
    description:
      "Type de commerce, adresse, horaires, zone de livraison (rayon km), frais, documents Kbis et attestation hygiène.",
    href: "/merchant/settings",
    icon: Settings,
    accent: "chart-2",
    status: "mvp",
  },
];

const UPCOMING_FEATURES: readonly FeatureCard[] = [
  {
    id: "algo",
    label: "Optimisation de tournée",
    description:
      "Algorithme d'attribution automatique du livreur le plus proche et regroupement des commandes par trajet.",
    href: "/merchant",
    icon: TrendingUp,
    accent: "chart-3",
    status: "v2",
  },
  {
    id: "export",
    label: "Export comptable",
    description:
      "Export des ventes au format comptable, génération de factures PDF, réconciliation TVA.",
    href: "/merchant",
    icon: BarChart3,
    accent: "chart-4",
    status: "v2",
  },
];

/* ------------------------------------------------------------------ */
/*  Sous-composants                                                    */
/* ------------------------------------------------------------------ */

function FeatureTile({ feature }: { readonly feature: FeatureCard }) {
  const Icon = feature.icon;
  const accent = feature.accent;
  const isV2 = feature.status === "v2";

  const content = (
    <Card
      className={`group relative h-full overflow-hidden border-border/60 transition-shadow duration-300 ${
        isV2 ? "opacity-70" : "hover:shadow-lg"
      }`}
      style={{ "--accent": `var(--${accent})` } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-70"
        style={{
          background: `linear-gradient(90deg, var(--${accent}), transparent)`,
        }}
      />
      <CardHeader className="flex flex-row items-start gap-3">
        <div
          className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-md"
          style={{
            background: `linear-gradient(135deg, var(--${accent}), color-mix(in oklab, var(--${accent}) 60%, black))`,
          }}
        >
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">{feature.label}</CardTitle>
          {isV2 && (
            <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              V2
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed text-foreground/80">
          {feature.description}
        </CardDescription>
        {!isV2 && (
          <span
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-0.5"
            style={{ color: `var(--${accent})` }}
          >
            Ouvrir
            <ArrowRight className="size-4" aria-hidden />
          </span>
        )}
      </CardContent>
    </Card>
  );

  if (isV2) {
    return <div>{content}</div>;
  }

  return <Link href={feature.href}>{content}</Link>;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MerchantHubPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-chart-1/5 via-chart-2/5 to-chart-3/5 p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-chart-2/20 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Store className="size-3.5 text-chart-2" aria-hidden />
            Espace commerçant
          </span>

          <h1 className="mt-4 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Votre commerce, un seul outil
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            POS mobile-first, catalogue, stock déduit des recettes, commandes,
            fidélité et dashboard. Tout ce dont vous avez besoin pour servir un
            client sans jongler entre 3 à 5 outils.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/merchant/dashboard" className={buttonVariants()}>
              Ouvrir le dashboard
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/merchant/pos"
              className={buttonVariants({ variant: "outline" })}
            >
              Aller au POS
            </Link>
          </div>
        </div>
      </header>

      {/* Features disponibles */}
      <section>
        <header className="mb-6">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            <Sparkles className="size-5 text-chart-1" aria-hidden />
            Fonctionnalités disponibles
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Les outils du MVP, prêts à l&apos;emploi dès la validation de votre
            commerce.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MERCHANT_FEATURES.map((feature) => (
            <FeatureTile key={feature.id} feature={feature} />
          ))}
        </div>
      </section>

      {/* Prochainement */}
      <section>
        <header className="mb-6">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            <TrendingUp className="size-5 text-chart-3" aria-hidden />
            Prochainement (V2)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fonctionnalités en cours de conception, livrées après le MVP.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {UPCOMING_FEATURES.map((feature) => (
            <FeatureTile key={feature.id} feature={feature} />
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="rounded-2xl border border-border/60 bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Besoin d&apos;aide pour configurer votre commerce ? Consultez le{" "}
          <Link
            href="/merchant/settings"
            className="font-medium text-chart-1 hover:underline"
          >
            guide des paramètres
          </Link>{" "}
          ou{" "}
          <Link
            href="/help"
            className="font-medium text-chart-1 hover:underline"
          >
            contactez le support
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
