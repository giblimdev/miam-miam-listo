/*
path :           app/super-admin/page.tsx
tag :            ["super-admin", "page", "documentation", "rbac", "help"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de documentation du rôle Super-administrateur. Présente
                 le rôle et les responsabilités du super-admin dans la
                 plateforme Miam-miam Listo : périmètre (règles globales,
                 gestion des admins, audit, conformité), frontières avec
                 l'Administrateur metier et l'Équipe Support, actions
                 sensibles tracées, et principes de gouvernance. Page
                 statique (Server Component) sans fetch ni état, pour
                 rester rapide et informative. Structure éditoriale :
                 hero + résumé + grille de responsabilités + frontières
                 avec les autres rôles + principes de gouvernance + CTA
                 vers le back-office.

flow:            Server Component pur → rend un wrapper max-w-5xl →
                 Hero (badge, titre dégradé, tagline) → 4 cartes de
                 responsabilités (règles globales, gestion des admins,
                 audit, conformité) → tableau des frontières avec les
                 autres rôles (Super-admin / Admin metier / Support) →
                 liste des principes de gouvernance (moindre privilège,
                 traçabilité, séparation des pouvoirs, réversibilité)
                 → CTA vers /admin (back-office). Aucun état, aucun effet,
                 aucun fetch.

ecosystem:       SuperAdmin = [
                   "@/app/super-admin/page.tsx",
                 ]

relatedFiles:    ["@/components/ui/button",
                  "@/components/ui/card",
                  "@/lib/actions/result.ts"]

imports:         ["next/link", "lucide-react",
                  "@/components/ui/button",
                  "@/components/ui/card"]

exports:         ["default SuperAdminPage", "metadata"]

useBy:           []

userStories:     ["*en tant que super-administrateur je veux comprendre mon rôle et mes responsabilités"]

status:          planned
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Fingerprint,
  KeyRound,
  Scale,
  ScrollText,
  ShieldCheck,
  UserCog,
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
  title: "Super-administrateur — Rôle et responsabilités",
  description:
    "Périmètre, responsabilités et principes de gouvernance du rôle Super-administrateur sur la plateforme Miam-miam Listo.",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Responsibility {
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly accent: string;
  readonly examples: readonly string[];
}

interface Boundary {
  readonly role: string;
  readonly scope: string;
  readonly examples: string;
}

interface GovernancePrinciple {
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

/* ------------------------------------------------------------------ */
/*  Données                                                            */
/* ------------------------------------------------------------------ */

const RESPONSIBILITIES: readonly Responsibility[] = [
  {
    title: "Règles globales",
    description:
      "Définit et ajuste les paramètres qui s'appliquent à toute la plateforme : taux de commission, rémunération livreur par défaut, plafonds de notifications, versions des CGU. Ces règles ne peuvent pas être modifiées par un Administrateur metier ni par un commerçant.",
    icon: Scale,
    accent: "chart-1",
    examples: [
      "Modifier le taux de commission plateforme (V2)",
      "Fixer la rémunération livreur par défaut (V2)",
      "Publier une nouvelle version des CGU",
    ],
  },
  {
    title: "Gestion des admins",
    description:
      "Nomme, révoque et audite les Administrateurs metier. C'est le seul rôle qui peut promouvoir ou rétrograder un admin. Aucun admin ne peut se promouvoir lui-même : toute promotion passe par un super-admin et est journalisée.",
    icon: UserCog,
    accent: "chart-2",
    examples: [
      "Promouvoir un utilisateur au rôle Administrateur metier",
      "Révoquer un admin compromis",
      "Auditer l'historique des changements de rôle admin",
    ],
  },
  {
    title: "Audit et traçabilité",
    description:
      "Consulte et exporte le journal d'audit des actions sensibles : suspension de commerce, changement de rôle, modification de commission, suppression de compte. Le super-admin est le garant de la traçabilité de la plateforme.",
    icon: ScrollText,
    accent: "chart-3",
    examples: [
      "Exporter le journal d'audit sur une période",
      "Identifier l'auteur d'une suspension contestée",
      "Vérifier qu'aucune action sensible n'est non tracée",
    ],
  },
  {
    title: "Conformité et gouvernance",
    description:
      "Valide les consentements (CGU, cookies), traite les demandes RGPD complexes (export, suppression, anonymisation), tient le registre des traitements. En MVP, ce rôle est partagé avec le DPO ; en V2, il est dédié.",
    icon: ShieldCheck,
    accent: "chart-4",
    examples: [
      "Valider une nouvelle version de la politique de confidentialité",
      "Traiter une demande d'export de données",
      "Arbitrer un litige remonté par le Support",
    ],
  },
];

const BOUNDARIES: readonly Boundary[] = [
  {
    role: "Super-administrateur",
    scope:
      "Règles globales, gestion des admins, audit, conformité. Accès en lecture à toutes les données. Peut suspendre un admin.",
    examples: "Modifier la commission, promouvoir un admin, exporter l'audit",
  },
  {
    role: "Administrateur metier",
    scope:
      "Valide et suspend les commerces, gère les utilisateurs et leurs rôles par commerce, modère les signalements, arbitre les litiges simples.",
    examples:
      "Approuver un commerce, suspendre un livreur signalé, répondre à un litige",
  },
  {
    role: "Équipe Support / Modérateur",
    scope:
      "Traite les litiges de premier niveau, répond aux demandes RGPD simples (export, suppression), modère les signalements. Ne peut pas modifier les règles globales ni promouvoir un admin.",
    examples:
      "Traiter une annulation contestée, exporter les données d'un client, masquer un commentaire signalé",
  },
];

const GOVERNANCE_PRINCIPLES: readonly GovernancePrinciple[] = [
  {
    title: "Moindre privilège",
    description:
      "Le super-admin ne fait pas le travail de l'admin metier. Il ne valide pas les commerces, ne modère pas les signalements, ne répond pas aux litiges. Son périmètre est strictement les règles globales, les admins, l'audit et la conformité.",
    icon: KeyRound,
  },
  {
    title: "Traçabilité",
    description:
      "Toute action sensible (promotion, révocation, modification de commission, suspension) est journalisée avec acteur, horodatage, cible et motif. Le super-admin ne peut pas agir sans laisser de trace.",
    icon: Fingerprint,
  },
  {
    title: "Séparation des pouvoirs",
    description:
      "Aucun super-admin ne peut se promouvoir lui-même, ni promouvoir un autre super-admin sans validation d'un pair. La promotion d'un admin est une action à double contrôle.",
    icon: Users,
  },
  {
    title: "Réversibilité",
    description:
      "Chaque action sensible est réversible (rollback du rôle, restauration de commission, réactivation d'un commerce suspendu). Le super-admin doit pouvoir corriger une erreur sans perte de données.",
    icon: BookOpenCheck,
  },
];

/* ------------------------------------------------------------------ */
/*  Sous-composants                                                    */
/* ------------------------------------------------------------------ */

function ResponsibilityCard({
  responsibility,
}: {
  readonly responsibility: Responsibility;
}) {
  const Icon = responsibility.icon;
  const accent = responsibility.accent;

  return (
    <Card
      className="group relative h-full overflow-hidden border-border/60 transition-shadow duration-300 hover:shadow-lg"
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
          <CardTitle className="text-base">{responsibility.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="text-sm leading-relaxed text-foreground/80">
          {responsibility.description}
        </CardDescription>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {responsibility.examples.map((example) => (
            <li key={example} className="flex items-start gap-1.5">
              <span
                aria-hidden
                className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full"
                style={{ background: `var(--${accent})` }}
              />
              <span>{example}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SuperAdminPage() {
  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-muted/30">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-chart-1/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-12 size-96 rounded-full bg-chart-4/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <ShieldCheck className="size-3.5 text-chart-4" aria-hidden />
            Rôle plateforme · Super-administrateur
          </span>

          <h1 className="mt-5 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-4 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Super-administrateur
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Garant de la plateforme : règles globales, gestion des admins, audit
            et conformité. Un rôle à périmètre étroit, à haute responsabilité,
            entièrement tracé.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Link href="/admin" className={buttonVariants()}>
              Accéder au back-office
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/scrum/scrum-business"
              className={buttonVariants({ variant: "outline" })}
            >
              Voir le flux Scrum
            </Link>
          </div>
        </div>
      </section>

      {/* Responsabilités */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              4 responsabilités
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Un périmètre strictement défini. Le super-admin ne fait pas le
              travail de l&apos;admin metier.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {RESPONSIBILITIES.map((responsibility) => (
              <ResponsibilityCard
                key={responsibility.title}
                responsibility={responsibility}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Frontières avec les autres rôles */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Frontières avec les autres rôles
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Trois rôles plateforme, trois périmètres. Aucun chevauchement.
            </p>
          </header>

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border/60 bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-foreground">
                      Rôle
                    </th>
                    <th className="px-4 py-3 font-semibold text-foreground">
                      Périmètre
                    </th>
                    <th className="hidden px-4 py-3 font-semibold text-foreground md:table-cell">
                      Exemples
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {BOUNDARIES.map((boundary) => (
                    <tr
                      key={boundary.role}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="px-4 py-3 align-top font-medium text-foreground">
                        {boundary.role}
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">
                        {boundary.scope}
                      </td>
                      <td className="hidden px-4 py-3 align-top text-xs text-muted-foreground md:table-cell">
                        {boundary.examples}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Principes de gouvernance */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              4 principes de gouvernance
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ce qui rend le rôle de super-admin acceptable : un pouvoir étroit,
              tracé, séparé et réversible.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GOVERNANCE_PRINCIPLES.map((principle) => {
              const Icon = principle.icon;
              return (
                <Card key={principle.title} className="h-full border-border/60">
                  <CardHeader className="flex flex-row items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
                      <Icon className="size-4" aria-hidden />
                    </div>
                    <CardTitle className="text-sm">{principle.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {principle.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-gradient-to-br from-chart-1/5 via-chart-2/5 to-chart-4/5 p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Prêt à exercer ?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Le back-office centralise toutes les actions du super-admin : règles
            globales, gestion des admins, audit et conformité. Chaque action est
            journalisée.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/admin" className={buttonVariants()}>
              Ouvrir le back-office
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/legal/privacy"
              className={buttonVariants({ variant: "outline" })}
            >
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
