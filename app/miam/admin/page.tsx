/*
path :           app/admin/page.tsx
tag :            ["admin", "hub", "page", "presentation", "features"]
projectId :      <MiamMiamListo>
type :           page
generic:         false

role:            Hub de l'espace admin (rôle `admin` — administration
                 MÉTIER de l'application). Présente les features
                 opérationnelles du MVP (validation des commerces,
                 gestion des utilisateurs et de leurs rôles par
                 commerce, modération des commerces et livreurs
                 signalés, arbitrage des litiges, consultation des
                 consentements RGPD) sous forme de cartes cliquables.
                 Sert de point d'atterrissage après connexion admin et
                 de tableau de navigation rapide.

                 DISTINCTION avec /super-admin (rôle superAdmin) :
                 - admin/ = opérationnel métier (valider, modérer,
                   arbitrer, consulter). Pas d'accès aux règles
                   globales ni à l'audit.
                 - super-admin/ = gouvernance plateforme (règles
                   globales, gestion des admins, audit, RBAC,
                   conformité). Voir app/super-admin/page.tsx pour la
                   documentation du rôle superAdmin.

                 Server Component statique : aucune donnée dynamique,
                 aucun fetch. Les cartes sont pilotées par un tableau
                 local ADMIN_FEATURES (config propre à la page, non
                 exporté). Mobile first : grille 1 / 2 / 3 colonnes.

                 AUCUNE restriction d'accès pour l'instant : la page est
                 publique. La protection RBAC (requirePlatformRole(["admin",
                 "superAdmin"]) via app/admin/layout.tsx) sera ajoutée
                 plus tard, quand Better Auth sera configuré.

flow:            Server Component pur → rend un wrapper max-w-6xl →
                 Hero (badge, titre gradient, description) → grille de
                 cartes (map sur ADMIN_FEATURES) → section « Prochainement
                 (V2) » (export comptable, BI avancée, facturation
                 Stripe) → footer CTA vers /super-admin (gouvernance).
                 Aucun état, aucun effet, aucun fetch.

ecosystem:       Admin = [
                   "@/app/admin/page.tsx",
                   "@/app/admin/layout.tsx",
                   "@/app/admin/commerces/page.tsx",
                   "@/app/admin/users/page.tsx",
                   "@/app/admin/moderation/page.tsx",
                   "@/app/admin/disputes/page.tsx",
                   "@/app/admin/consents/page.tsx",
                   "@/app/admin/legal/page.tsx",
                 ]

relatedFiles:    ["@/components/ui/button.tsx",
                  "@/components/ui/card.tsx",
                  "@/config/roles.ts",
                  "@/app/super-admin/page.tsx"]

imports:         ["next/link", "lucide-react",
                  "@/components/ui/button",
                  "@/components/ui/card"]

exports:         ["default AdminHubPage", "metadata"]

useBy:           []

userStories:     ["*en tant qu'admin je veux voir les fonctionnalités disponibles et accéder à chacune",
                  "*en tant qu'admin je veux valider les commerces et arbitrer les litiges"]

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
  ClipboardCheck,
  CreditCard,
  FileText,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Users,
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
  title: "Espace admin — Miam-miam Listo",
  description:
    "Hub de l'espace admin : validation des commerces, gestion des utilisateurs, modération, litiges et consentements RGPD.",
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
/*  Config — features admin (opérationnel métier)                     */
/* ------------------------------------------------------------------ */

const ADMIN_FEATURES: readonly FeatureCard[] = [
  {
    id: "commerces",
    label: "Commerces",
    description:
      "Valider ou suspendre les commerces en attente. Consulter les documents (Kbis, hygiène). Voir la liste complète des commerces actifs et suspendus.",
    href: "/admin/commerces",
    icon: Store,
    accent: "chart-1",
    status: "mvp",
  },
  {
    id: "users",
    label: "Utilisateurs",
    description:
      "Gérer les rôles commerce (owner, staff, client, courier) des utilisateurs par commerce. Voir l'historique des changements de rôle par commerce.",
    href: "/admin/users",
    icon: Users,
    accent: "chart-2",
    status: "mvp",
  },
  {
    id: "moderation",
    label: "Modération",
    description:
      "Traiter les commerces et livreurs signalés. Masquer les contenus illicites. Historique des signalements et décisions.",
    href: "/admin/moderation",
    icon: ShieldCheck,
    accent: "chart-3",
    status: "mvp",
  },
  {
    id: "disputes",
    label: "Litiges",
    description:
      "Arbitrer les litiges entre clients, commerçants et livreurs (commande non livrée, produit périmé, annulation contestée). Remboursements mock en MVP.",
    href: "/admin/disputes",
    icon: ClipboardCheck,
    accent: "chart-4",
    status: "mvp",
  },
  {
    id: "consents",
    label: "Consentements RGPD",
    description:
      "Consulter les consentements (CGU, politique de confidentialité) : version acceptée, horodatage, utilisateur. Traiter les demandes d'export et de suppression de compte.",
    href: "/admin/consents",
    icon: FileText,
    accent: "chart-5",
    status: "mvp",
  },
  {
    id: "legal",
    label: "Documents légaux",
    description:
      "Accéder aux versions admin de la politique de confidentialité et des CGU. Les versions publiques restent accessibles sur /legal/*.",
    href: "/admin/legal",
    icon: ScrollText,
    accent: "chart-3",
    status: "mvp",
  },
];

const UPCOMING_FEATURES: readonly FeatureCard[] = [
  {
    id: "export-accounting",
    label: "Export comptable",
    description:
      "Export des ventes au format comptable, réconciliation TVA, génération de rapports financiers.",
    href: "/admin",
    icon: BarChart3,
    accent: "chart-5",
    status: "v2",
  },
  {
    id: "billing",
    label: "Facturation Stripe",
    description:
      "Abonnements commerces (49 €/mois), factures PDF, relances impayés. Intégration Stripe en V2.",
    href: "/admin",
    icon: CreditCard,
    accent: "chart-4",
    status: "v2",
  },
  {
    id: "bi",
    label: "BI avancée",
    description:
      "Tableaux de bord analytiques : CA par commerce, cohortes de clients, taux de rétention, performance des livreurs.",
    href: "/admin",
    icon: TrendingUp,
    accent: "chart-1",
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

export default function AdminHubPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-chart-2/5 via-chart-3/5 to-chart-1/5 p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-chart-2/20 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <ShieldCheck className="size-3.5 text-chart-2" aria-hidden />
            Espace administration
          </span>

          <h1 className="mt-4 bg-gradient-to-r from-chart-2 via-chart-3 to-chart-1 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Piloter les opérations
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Valider les commerces, gérer les utilisateurs et leurs rôles par
            commerce, modérer les contenus signalés, arbitrer les litiges,
            consulter les consentements RGPD. Un espace réservé aux
            administrateurs métier.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/admin/commerces" className={buttonVariants()}>
              Valider les commerces
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/admin/disputes"
              className={buttonVariants({ variant: "outline" })}
            >
              Arbitrer les litiges
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
            Les outils opérationnels du MVP, prêts à l&apos;emploi dès votre
            connexion admin.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_FEATURES.map((feature) => (
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

      {/* Footer CTA — renvoi vers super-admin pour la gouvernance */}
      <footer className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 size-5 shrink-0 text-chart-4"
              aria-hidden
            />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Besoin des règles globales ou du journal d&apos;audit ?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                La configuration des commissions, la gestion des admins,
                l&apos;audit et la conformité sont réservés aux
                super-administrateurs. Rendez-vous dans l&apos;espace
                Super-admin.
              </p>
            </div>
          </div>
          <Link
            href="/super-admin"
            className={buttonVariants({ variant: "outline" })}
          >
            Espace Super-admin
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </footer>
    </div>
  );
}
