/*
path :           app/courier/page.tsx
tag :            ["courier", "hub", "page", "presentation", "features", "livreur"]
projectId :      <à fournir>
type :           page
generic:         false

role:            Hub de l'espace livreur. Présente les features du MVP
                 (missions, suivi, historique, rémunération, profil) sous
                 forme de cartes cliquables, chacune menant à la page
                 d'entrée du sous-espace correspondant (/courier/missions,
                 /courier/earnings, etc.). Sert de point d'atterrissage
                 après attribution d'une première mission et de tableau
                 de navigation rapide. Server Component statique :
                 aucune donnée dynamique, aucun fetch. Les cartes sont
                 pilotées par un tableau local COURIER_FEATURES (config
                 propre à la page, non exporté). Mobile first : grille
                 1 / 2 / 3 colonnes.

flow:            Server Component pur → rend un wrapper max-w-6xl →
                 Hero (badge, titre, description) → grille de cartes
                 (map sur COURIER_FEATURES) → section « Prochainement »
                 (V2 : géolocalisation temps réel, tournées optimisées,
                 preuve de livraison photo) → footer CTA vers
                 /courier/missions. Aucun état, aucun effet, aucun fetch.

ecosystem:       Courier = [
                   "@/app/courier/page.tsx",
                   "@/app/courier/layout.tsx",
                   "@/app/courier/missions/page.tsx",
                   "@/app/courier/missions/[orderId]/page.tsx",
                   "@/app/courier/missions/[orderId]/track/page.tsx",
                   "@/app/courier/history/page.tsx",
                   "@/app/courier/earnings/page.tsx",
                   "@/app/courier/profile/page.tsx",
                 ]

relatedFiles:    ["@/components/ui/button.tsx",
                  "@/components/ui/card.tsx",
                  "@/config/roles.ts"]

imports:         ["next/link", "lucide-react",
                  "@/components/ui/button",
                  "@/components/ui/card"]

exports:         ["default CourierHubPage", "metadata"]

useBy:           []

userStories:     ["*en tant que livreur je veux voir les fonctionnalités disponibles et accéder à chacune"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bike,
  Clock,
  History,
  MapPin,
  Navigation,
  Route,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
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
  title: "Espace livreur — Miam-miam Listo",
  description:
    "Hub de l'espace livreur : missions, suivi, historique, rémunération et profil.",
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
/*  Config — features livreur                                          */
/* ------------------------------------------------------------------ */

const COURIER_FEATURES: readonly FeatureCard[] = [
  {
    id: "missions",
    label: "Mes missions",
    description:
      "Voir les commandes qui vous sont assignées, accepter ou refuser, marquer picked_up / delivering / delivered. Chaque mission affiche l'adresse, le montant et le contact.",
    href: "/courier/missions",
    icon: Bike,
    accent: "chart-1",
    status: "mvp",
  },
  {
    id: "track",
    label: "Suivi en temps réel",
    description:
      "Suivre l'état de la mission en temps réel (SSE / polling court). Statut courant, ETA, historique des transitions. Pas de rechargement de page.",
    href: "/courier/missions",
    icon: Navigation,
    accent: "chart-2",
    status: "mvp",
  },
  {
    id: "history",
    label: "Historique",
    description:
      "Consulter les missions livrées, les annulations, les litiges. Filtrer par période et par statut. Export des missions pour la comptabilité.",
    href: "/courier/history",
    icon: History,
    accent: "chart-3",
    status: "mvp",
  },
  {
    id: "earnings",
    label: "Ma rémunération",
    description:
      "Voir le détail de chaque rémunération (forfait + pourcentage), la somme du jour, de la semaine, du mois. Transparence totale sur le calcul.",
    href: "/courier/earnings",
    icon: Wallet,
    accent: "chart-4",
    status: "mvp",
  },
  {
    id: "profile",
    label: "Mon profil",
    description:
      "Gérer vos informations : nom, téléphone, véhicule, zone de livraison. Statut disponible / en course / hors ligne. Documents (permis, assurance) en V2.",
    href: "/courier/profile",
    icon: User,
    accent: "chart-5",
    status: "mvp",
  },
];

const UPCOMING_FEATURES: readonly FeatureCard[] = [
  {
    id: "geo",
    label: "Géolocalisation temps réel",
    description:
      "Position du livreur affichée au client en temps réel, ETA dynamique, itinéraire optimisé.",
    href: "/courier",
    icon: MapPin,
    accent: "chart-1",
    status: "v2",
  },
  {
    id: "tour",
    label: "Tournées optimisées",
    description:
      "Algorithme de regroupement des commandes par trajet, minimisation des trajets à vide.",
    href: "/courier",
    icon: Route,
    accent: "chart-2",
    status: "v2",
  },
  {
    id: "proof",
    label: "Preuve de livraison",
    description:
      "Photo ou QR code à la livraison, signature du client, gestion des litiges.",
    href: "/courier",
    icon: ShieldCheck,
    accent: "chart-3",
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

export default function CourierHubPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-chart-1/5 via-chart-2/5 to-chart-4/5 p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-chart-2/20 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Bike className="size-3.5 text-chart-2" aria-hidden />
            Espace livreur
          </span>

          <h1 className="mt-4 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-4 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Vos missions, en toute transparence
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Recevez vos missions, suivez leur état en temps réel, consultez
            votre rémunération détaillée. Pas de frais cachés, pas de calcul
            opaque — vous savez exactement ce que vous gagnez.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/courier/missions" className={buttonVariants()}>
              Voir mes missions
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/courier/earnings"
              className={buttonVariants({ variant: "outline" })}
            >
              Ma rémunération
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
            Les outils du MVP, prêts à l&apos;emploi dès votre première mission
            assignée.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURIER_FEATURES.map((feature) => (
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {UPCOMING_FEATURES.map((feature) => (
            <FeatureTile key={feature.id} feature={feature} />
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="rounded-2xl border border-border/60 bg-card p-6 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center gap-2">
          <Clock className="size-5 text-chart-3" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Les missions vous sont assignées manuellement par l&apos;équipe
            Miam-miam Listo en MVP. L&apos;attribution automatique arrive en V2.
          </p>
        </div>
      </footer>
    </div>
  );
}