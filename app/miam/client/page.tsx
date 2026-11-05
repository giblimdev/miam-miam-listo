/*
path :           app/client/page.tsx
tag :            ["client", "hub", "page", "presentation", "features"]
projectId :      <MiamMiamListo>
type :           page
generic:         false

role:            Hub de l'espace client. Présente les features du MVP
                 (découvrir, commander, panier, suivi, historique,
                 fidélité, notifications, compte, RGPD) sous forme de
                 cartes cliquables, chacune menant à la page d'entrée du
                 sous-espace correspondant. Sert de point d'atterrissage
                 après connexion et de tableau de navigation rapide.
                 Server Component statique : aucune donnée dynamique,
                 aucun fetch. Les cartes sont pilotées par un tableau
                 local CLIENT_FEATURES (config propre à la page, non
                 exporté). Mobile first : grille 1 / 2 / 3 colonnes.

                 Note sur les hrefs : aucune carte ne pointe vers une URL
                 contenant un segment dynamique littéral ([commerceSlug])
                 — le App Router ne supporte pas les hrefs dynamiques
                 dans <Link>. « Commander » pointe vers / (découverte),
                 « Mon panier » vers /client/orders. Les liens vers un
                 commerce précis (/c/<slug> réel) sont générés par la
                 page de découverte quand le slug est connu.

flow:            Server Component pur → rend un wrapper max-w-6xl →
                 Hero (badge, titre, description) → grille de cartes
                 (map sur CLIENT_FEATURES) → section « Prochainement »
                 (V2 : suivi géolocalisé, parrainage, cashback réel,
                 notifications push) → footer CTA vers /client/orders.
                 Aucun état, aucun effet, aucun fetch.

ecosystem:       Client = [
                   "@/app/client/page.tsx",
                   "@/app/client/layout.tsx",
                   "@/app/client/orders/page.tsx",
                   "@/app/client/orders/[orderId]/page.tsx",
                   "@/app/client/orders/[orderId]/track/page.tsx",
                   "@/app/client/loyalty/page.tsx",
                   "@/app/client/account/page.tsx",
                   "@/app/client/rgpd/page.tsx",
                   "@/app/c/[commerceSlug]/page.tsx",
                   "@/app/c/[commerceSlug]/cart/page.tsx",
                   "@/app/c/[commerceSlug]/checkout/page.tsx",
                   "@/app/notifications/page.tsx",
                 ]

relatedFiles:    ["@/components/ui/button.tsx",
                  "@/components/ui/card.tsx",
                  "@/config/roles.ts"]

imports:         ["next/link", "lucide-react",
                  "@/components/ui/button",
                  "@/components/ui/card"]

exports:         ["default ClientHubPage", "metadata"]

useBy:           []

userStories:     ["*en tant que client je veux voir les fonctionnalités disponibles et accéder à chacune",
                  "*en tant que client je veux commander, suivre mes commandes et cumuler des points"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CreditCard,
  Gift,
  History,
  MapPin,
  Navigation,
  Receipt,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  User,
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
  title: "Espace client — Miam-miam Listo",
  description:
    "Hub de l'espace client : commander, suivre, historique, fidélité, notifications et compte.",
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
/*  Config — features client                                           */
/* ------------------------------------------------------------------ */

const CLIENT_FEATURES: readonly FeatureCard[] = [
  {
    id: "discover",
    label: "Découvrir les commerces",
    description:
      "Parcourir les commerces autour de vous : restaurants, food-trucks, supérettes, primeurs. Recherche par nom, type, proximité.",
    href: "/",
    icon: Store,
    accent: "chart-1",
    status: "mvp",
  },
  {
    id: "order",
    label: "Commander en 3 clics",
    description:
      "Choisir un commerce, remplir votre panier, sélectionner sur place / à emporter / livraison, valider. Paiement mock en MVP, Stripe en V2.",
    href: "/",
    icon: ShoppingBag,
    accent: "chart-2",
    status: "mvp",
  },
  {
    id: "cart",
    label: "Mon panier",
    description:
      "Retrouver vos paniers en cours par commerce, reprendre une commande, ajouter ou retirer des articles avant validation.",
    href: "/client/orders",
    icon: ShoppingCart,
    accent: "chart-3",
    status: "mvp",
  },
  {
    id: "track",
    label: "Suivi en temps réel",
    description:
      "Suivre votre commande en temps réel (SSE) : received → preparing → ready → picked_up → delivering → delivered. ETA affichée.",
    href: "/client/orders",
    icon: Navigation,
    accent: "chart-4",
    status: "mvp",
  },
  {
    id: "history",
    label: "Mes commandes",
    description:
      "Consulter l'historique de vos commandes par commerce, télécharger un récapitulatif, recommander une commande passée en 1 clic.",
    href: "/client/orders",
    icon: History,
    accent: "chart-5",
    status: "mvp",
  },
  {
    id: "loyalty",
    label: "Fidélité & récompenses",
    description:
      "Cumuler des points à chaque commande, voir votre solde par commerce, consommer vos récompenses (réduction, produit offert, palier).",
    href: "/client/loyalty",
    icon: Gift,
    accent: "chart-1",
    status: "mvp",
  },
  {
    id: "notifications",
    label: "Notifications",
    description:
      "Recevoir des notifications in-app : commande reçue, changement de statut, récompense débloquée. Badge non-lu, marquage lu.",
    href: "/notifications",
    icon: Bell,
    accent: "chart-2",
    status: "mvp",
  },
  {
    id: "account",
    label: "Mon compte",
    description:
      "Gérer vos informations personnelles : nom, email, téléphone, adresses de livraison. Historique de vos consentements RGPD.",
    href: "/client/account",
    icon: User,
    accent: "chart-3",
    status: "mvp",
  },
  {
    id: "rgpd",
    label: "Mes données (RGPD)",
    description:
      "Exporter toutes vos données personnelles (JSON), supprimer votre compte. Vos commandes sont anonymisées pour rester conformes.",
    href: "/client/rgpd",
    icon: ShieldCheck,
    accent: "chart-4",
    status: "mvp",
  },
];

const UPCOMING_FEATURES: readonly FeatureCard[] = [
  {
    id: "geo",
    label: "Suivi géolocalisé",
    description:
      "Position du livreur affichée en temps réel sur une carte, ETA dynamique mise à jour toutes les 30 secondes.",
    href: "/client",
    icon: MapPin,
    accent: "chart-1",
    status: "v2",
  },
  {
    id: "referral",
    label: "Parrainage",
    description:
      "Inviter un ami, gagner des points quand il passe sa première commande. Suivi des invitations en cours.",
    href: "/client",
    icon: Star,
    accent: "chart-2",
    status: "v2",
  },
  {
    id: "cashback",
    label: "Cashback réel",
    description:
      "Récupérer un pourcentage de vos commandes en crédit utilisable sur les prochaines. Paiement Stripe en V2.",
    href: "/client",
    icon: CreditCard,
    accent: "chart-3",
    status: "v2",
  },
  {
    id: "push",
    label: "Notifications push",
    description:
      "Recevoir des notifications sur votre téléphone même quand l'app est fermée : commande prête, livreur en route.",
    href: "/client",
    icon: Bell,
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

export default function ClientHubPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-chart-1/5 via-chart-3/5 to-chart-5/5 p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-chart-3/20 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <ShoppingBag className="size-3.5 text-chart-3" aria-hidden />
            Espace client
          </span>

          <h1 className="mt-4 bg-gradient-to-r from-chart-1 via-chart-3 to-chart-5 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Commandez en 3 clics, suivez en temps réel
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Découvrez les commerces autour de vous, commandez en quelques
            secondes, suivez votre commande en temps réel et cumulez des points
            de fidélité à chaque achat. Pas de frais cachés, pas de compte à
            créer pour explorer.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/" className={buttonVariants()}>
              <Search className="size-4" aria-hidden />
              Découvrir les commerces
            </Link>
            <Link
              href="/client/orders"
              className={buttonVariants({ variant: "outline" })}
            >
              Mes commandes
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
            Tout ce qu&apos;il vous faut pour commander, suivre et être
            récompensé — dès aujourd&apos;hui.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CLIENT_FEATURES.map((feature) => (
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {UPCOMING_FEATURES.map((feature) => (
            <FeatureTile key={feature.id} feature={feature} />
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="rounded-2xl border border-border/60 bg-card p-6 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center gap-2">
          <Receipt className="size-5 text-chart-3" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Le paiement réel (Stripe) arrive en V2. En MVP, vos commandes sont
            validées en mock — aucun débit réel n&apos;est effectué. Vous pouvez
            tester le parcours complet sans risque.
          </p>
          <Link
            href="/client/orders"
            className="mt-2 text-sm font-medium text-chart-3 hover:underline"
          >
            Voir mes commandes
          </Link>
        </div>
      </footer>
    </div>
  );
}
