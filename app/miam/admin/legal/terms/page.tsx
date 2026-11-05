/*
path :           app/legal/terms/page.tsx
tag :            ["legal", "terms", "cgu", "page", "public"]
projectId :      <à fournir>
type :           page
generic:         false

role:            Conditions Générales d'Utilisation (CGU) de Miam-miam
                 Listo (MVP). Page publique, statique, sans session ni
                 fetch. Décrit l'objet du service (mise en relation
                 commerçants / clients / livreurs), les rôles, les
                 obligations des parties, la responsabilité, la propriété
                 intellectuelle, la résiliation, le droit applicable et
                 les modalités de contact. En MVP : pas de paiement réel
                 (paiement mock), pas de livreur salarié (indépendant),
                 abonnement commerçant 49 €/mois (mock), commission 0 %.

                 Contenu figé, aucune donnée dynamique. Le texte est
                 aligné sur l'idée produit (export MVP) : règles d'usage,
                 limitations de responsabilité, mention du caractère
                 mock du paiement et de l'abonnement.

flow:            Server Component pur → rend un wrapper max-w-3xl →
                 Hero (badge, titre, date de mise à jour) → sections
                 numérotées (1. Objet, 2. Définitions, 3. Inscription,
                 4. Rôles, 5. Obligations, 6. Prix et paiement,
                 7. Responsabilité, 8. Propriété intellectuelle,
                 9. Résiliation, 10. Droit applicable, 11. Contact).
                 Aucun état, aucun effet, aucun fetch.

ecosystem:       Legal = [
                   "@/app/legal/privacy/page.tsx",
                   "@/app/legal/terms/page.tsx",
                 ]

relatedFiles:    ["@/app/legal/privacy/page.tsx",
                  "@/components/ui/button.tsx"]

imports:         ["next/link", "lucide-react",
                  "@/components/ui/button"]

exports:         ["default TermsPage", "metadata"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux connaître mes droits et obligations en utilisant Miam-miam Listo"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ScrollText } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Miam-miam Listo",
  description:
    "Les règles d'utilisation de Miam-miam Listo : rôles, obligations, responsabilité, prix et résiliation.",
};

const LAST_UPDATED = "3 novembre 2026";

/* ------------------------------------------------------------------ */
/*  Composants de section                                              */
/* ------------------------------------------------------------------ */

function Section({
  id,
  title,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      {/* En-tête */}
      <header className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Retour à l&apos;accueil
        </Link>

        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <ScrollText className="size-3.5 text-chart-3" aria-hidden />
          Document légal
        </span>

        <h1 className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-5 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
          Conditions générales d&apos;utilisation
        </h1>

        <p className="text-sm text-muted-foreground">
          Dernière mise à jour : {LAST_UPDATED}
        </p>
      </header>

      <div className="space-y-8 rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <Section id="objet" title="1. Objet">
          <p>
            Les présentes Conditions Générales d&apos;Utilisation (CGU)
            régissent l&apos;accès et l&apos;utilisation de la plateforme
            Miam-miam Listo, service de mise en relation entre des
            commerçants (restaurants, food-trucks, supérettes, primeurs), des
            clients et des livreurs indépendants.
          </p>
          <p>
            En créant un compte ou en utilisant la plateforme, vous acceptez
            les présentes CGU sans réserve.
          </p>
        </Section>

        <Section id="definitions" title="2. Définitions">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Plateforme</strong> : le site et l&apos;application
              Miam-miam Listo.
            </li>
            <li>
              <strong>Commerçant</strong> : personne morale ou physique
              proposant des produits via la plateforme (owner ou staff).
            </li>
            <li>
              <strong>Client</strong> : utilisateur passant commande via la
              plateforme.
            </li>
            <li>
              <strong>Livreur</strong> : indépendant acceptant des missions de
              livraison.
            </li>
            <li>
              <strong>Commande</strong> : achat de produits auprès d&apos;un
              commerçant via la plateforme.
            </li>
          </ul>
        </Section>

        <Section id="inscription" title="3. Inscription et compte">
          <p>
            L&apos;inscription est gratuite pour les clients et les livreurs.
            Les commerçants souscrivent un abonnement (voir section 6). Vous
            vous engagez à fournir des informations exactes et à maintenir la
            confidentialité de vos identifiants.
          </p>
          <p>
            Un même utilisateur peut cumuler plusieurs rôles (par exemple
            client d&apos;un commerce et owner d&apos;un autre), dans la limite
            d&apos;un rôle par commerce.
          </p>
        </Section>

        <Section id="roles" title="4. Rôles et responsabilités">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Client</strong> : passer commande, payer le montant
              affiché, fournir une adresse de livraison exacte.
            </li>
            <li>
              <strong>Commerçant</strong> : tenir un catalogue à jour,
              préparer les commandes dans les délais annoncés, respecter les
              normes d&apos;hygiène et de sécurité alimentaire.
            </li>
            <li>
              <strong>Livreur</strong> : accepter les missions assignées,
              livrer dans les délais, respecter le code de la route et les
              règles de sécurité.
            </li>
            <li>
              <strong>Miam-miam Listo</strong> : fournir la plateforme,
              assurer la mise en relation, modérer les contenus signalés,
              gérer les litiges.
            </li>
          </ul>
        </Section>

        <Section id="obligations" title="5. Obligations générales">
          <p>Vous vous engagez à :</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Ne pas usurper l&apos;identité d&apos;un tiers.</li>
            <li>
              Ne pas utiliser la plateforme à des fins illicites, frauduleuses
              ou contraires à l&apos;ordre public.
            </li>
            <li>
              Ne pas publier de contenus diffamatoires, haineux, violents ou
              portant atteinte aux droits de tiers.
            </li>
            <li>
              Ne pas tenter de contourner les mesures de sécurité ou
              d&apos;accéder à des données qui ne vous appartiennent pas.
            </li>
            <li>
              Respecter les présentes CGU et la politique de confidentialité.
            </li>
          </ul>
        </Section>

        <Section id="prix" title="6. Prix, abonnement et paiement">
          <p>
            <strong>Client</strong> : le prix affiché au moment de la commande
            inclut le prix des produits et les frais de livraison éventuels.
            Aucun frais caché n&apos;est appliqué.
          </p>
          <p>
            <strong>Commerçant</strong> : abonnement mensuel de 49 € (mock en
            MVP — aucun prélèvement réel n&apos;est effectué). Commission de
            0 % sur les commandes en MVP, à définir en V2 (5–10 % maximum).
          </p>
          <p>
            <strong>Livreur</strong> : rémunération = forfait de base +
            pourcentage du montant de la commande, affichée avant chaque
            mission. Aucun frais caché.
          </p>
          <p>
            <strong>Paiement</strong> : en MVP, le paiement est simulé (mock)
            — aucun débit réel n&apos;est effectué. Le paiement réel (Stripe)
            sera activé en V2.
          </p>
        </Section>

        <Section id="responsabilite" title="7. Responsabilité">
          <p>
            Miam-miam Listo agit en qualité d&apos;intermédiaire technique
            entre les commerçants, les clients et les livreurs. À ce titre :
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              La responsabilité de la qualité des produits incombe au
              commerçant.
            </li>
            <li>
              La responsabilité de la bonne exécution de la livraison incombe
              au livreur.
            </li>
            <li>
              Miam-miam Listo ne peut être tenu responsable des retards, des
              ruptures de stock ou des litiges entre commerçant, client et
              livreur, sauf en cas de faute lourde de sa part.
            </li>
            <li>
              En MVP, la plateforme est fournie « en l&apos;état ». Des
              interruptions de service peuvent survenir.
            </li>
          </ul>
        </Section>

        <Section id="propriete" title="8. Propriété intellectuelle">
          <p>
            La marque Miam-miam Listo, le logo, l&apos;interface et le code de
            la plateforme sont la propriété exclusive de Miam-miam Listo. Vous
            ne pouvez pas les reproduire, les modifier ou les exploiter sans
            autorisation écrite préalable.
          </p>
          <p>
            Les contenus publiés par les commerçants (photos de plats,
            descriptions, prix) restent leur propriété. Ils accordent à
            Miam-miam Listo une licence non exclusive pour les afficher sur la
            plateforme.
          </p>
        </Section>

        <Section id="resiliation" title="9. Résiliation">
          <p>
            Vous pouvez supprimer votre compte à tout moment depuis votre
            espace (voir{" "}
            <Link
              href="/legal/privacy"
              className="font-medium text-chart-1 hover:underline"
            >
              la politique de confidentialité
            </Link>
            ). La suppression entraîne l&apos;anonymisation de vos commandes
            passées pour rester conformes aux obligations comptables.
          </p>
          <p>
            Miam-miam Listo peut suspendre ou résilier un compte en cas de
            violation des présentes CGU, de comportement frauduleux ou de
            signalements répétés.
          </p>
        </Section>

        <Section id="droit" title="10. Droit applicable et juridiction">
          <p>
            Les présentes CGU sont soumises au droit français. En cas de
            litige, une solution amiable sera recherchée avant toute action
            judiciaire. À défaut, les tribunaux français seront compétents.
          </p>
        </Section>

        <Section id="contact" title="11. Contact">
          <p>
            Pour toute question relative aux CGU :{" "}
            <a
              href="mailto:contact@miam-miam-listo.example"
              className="font-medium text-chart-1 hover:underline"
            >
              contact@miam-miam-listo.example
            </a>
          </p>
        </Section>
      </div>

      <footer className="flex flex-wrap justify-center gap-2 pt-2">
        <Link href="/legal/privacy" className={buttonVariants({ variant: "outline" })}>
          Politique de confidentialité
        </Link>
        <Link href="/" className={buttonVariants({ variant: "ghost" })}>
          Retour à l&apos;accueil
        </Link>
      </footer>
    </article>
  );
}