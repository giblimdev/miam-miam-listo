/*
path :           app/miam/admin/legal/privacy/page.tsx
tag :            ["legal", "privacy", "rgpd", "page", "public"]
projectId :      <à fournir>
type :           page
generic:         false

role:            Politique de confidentialité de Miam-miam Listo (MVP).
                 Page publique, statique, sans session ni fetch. Décrit
                 les données collectées (compte, commandes, adresses,
                 téléphone), les finalités (exécution de la commande,
                 fidélité, notifications in-app), les durées de
                 conservation, les droits RGPD (accès, rectification,
                 effacement, portabilité, opposition), et les modalités
                 d'exercice (export JSON via /client/rgpd, suppression
                 via /client/rgpd). En MVP : pas de cookies analytiques,
                 pas de DPO dédié (contact via le support), hébergement
                 local SQLite, pas de transfert hors UE.

                 Contenu figé, aucune donnée dynamique. Le texte est
                 aligné sur l'idée produit (export MVP) : consentement
                 explicite à l'inscription, anonymisation des commandes
                 en cas de suppression de compte, conservation comptable
                 des commandes anonymisées.

flow:            Server Component pur → rend un wrapper max-w-3xl →
                 Hero (badge, titre, date de mise à jour) → sections
                 numérotées (1. Responsable, 2. Données collectées,
                 3. Finalités, 4. Base légale, 5. Durées, 6. Destinataires,
                 7. Transferts, 8. Vos droits, 9. Cookies, 10. Contact,
                 11. Modifications). Aucun état, aucun effet, aucun fetch.

ecosystem:       Legal = [
                   "@/app/legal/privacy/page.tsx",
                   "@/app/legal/terms/page.tsx",
                 ]

relatedFiles:    ["@/app/client/rgpd/page.tsx",
                  "@/components/ui/button.tsx"]

imports:         ["next/link", "lucide-react",
                  "@/components/ui/button"]

exports:         ["default PrivacyPage", "metadata"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux comprendre quelles données sont collectées et comment exercer mes droits"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Politique de confidentialité — Miam-miam Listo",
  description:
    "Quelles données Miam-miam Listo collecte, pourquoi, combien de temps, et comment exercer vos droits RGPD.",
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

export default function PrivacyPage() {
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
          <ShieldCheck className="size-3.5 text-chart-4" aria-hidden />
          Document légal
        </span>

        <h1 className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-4 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
          Politique de confidentialité
        </h1>

        <p className="text-sm text-muted-foreground">
          Dernière mise à jour : {LAST_UPDATED}
        </p>
      </header>

      <div className="space-y-8 rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <Section id="responsable" title="1. Responsable du traitement">
          <p>
            Le responsable du traitement des données personnelles collectées via
            Miam-miam Listo est l&apos;équipe Miam-miam Listo, joignable à
            l&apos;adresse{" "}
            <a
              href="mailto:contact@miam-miam-listo.example"
              className="font-medium text-chart-1 hover:underline"
            >
              contact@miam-miam-listo.example
            </a>
            .
          </p>
          <p>
            En MVP (phase pilote), aucun Délégué à la Protection des Données
            (DPO) dédié n&apos;est désigné : les demandes sont traitées par
            l&apos;équipe support via l&apos;adresse ci-dessus.
          </p>
        </Section>

        <Section id="donnees" title="2. Données collectées">
          <p>Miam-miam Listo collecte les catégories de données suivantes :</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Compte</strong> : nom, adresse email, mot de passe
              (chiffré), photo de profil (optionnelle), rôle plateforme.
            </li>
            <li>
              <strong>Profil</strong> : bio, téléphone, adresses de livraison.
            </li>
            <li>
              <strong>Commandes</strong> : contenu du panier, montant, mode (sur
              place / à emporter / livraison), adresse de livraison, statut,
              horodatage.
            </li>
            <li>
              <strong>Fidélité</strong> : points cumulés par commerce,
              récompenses utilisées.
            </li>
            <li>
              <strong>Notifications</strong> : type, extrait, horodatage, statut
              lu/non-lu.
            </li>
            <li>
              <strong>Consentements</strong> : acceptation des CGU et de la
              présente politique, version acceptée, horodatage.
            </li>
            <li>
              <strong>Techniques</strong> : logs serveur (IP, user-agent) pour
              la sécurité et le débogage.
            </li>
          </ul>
          <p>
            Aucune donnée sensible (santé, origine ethnique, opinions
            politiques, données biométriques) n&apos;est collectée.
          </p>
        </Section>

        <Section id="finalites" title="3. Finalités du traitement">
          <p>Les données sont traitées pour les finalités suivantes :</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Création et gestion de votre compte.</li>
            <li>Exécution des commandes (préparation, livraison, suivi).</li>
            <li>Attribution et consommation des points de fidélité.</li>
            <li>Envoi de notifications in-app liées à vos commandes.</li>
            <li>Prévention de la fraude et sécurité de la plateforme.</li>
            <li>Respect de nos obligations légales et comptables.</li>
          </ul>
        </Section>

        <Section id="base-legale" title="4. Base légale">
          <p>
            Les traitements reposent sur : (a) l&apos;exécution du contrat
            (compte, commandes, fidélité), (b) votre consentement explicite
            (CGU, notifications), (c) notre intérêt légitime (sécurité,
            prévention de la fraude), (d) nos obligations légales (conservation
            comptable).
          </p>
        </Section>

        <Section id="durees" title="5. Durées de conservation">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Compte actif</strong> : conservé tant que le compte
              existe.
            </li>
            <li>
              <strong>Commandes</strong> : conservées 10 ans à des fins
              comptables (obligation légale). En cas de suppression de compte,
              elles sont anonymisées.
            </li>
            <li>
              <strong>Consentements</strong> : conservés 5 ans après le dernier
              consentement.
            </li>
            <li>
              <strong>Logs techniques</strong> : conservés 90 jours.
            </li>
            <li>
              <strong>Notifications</strong> : plafonnées à 200 entrées, purgées
              au-delà de 90 jours.
            </li>
          </ul>
        </Section>

        <Section id="destinataires" title="6. Destinataires">
          <p>
            Vos données sont accessibles aux personnes suivantes, dans la limite
            de leurs attributions :
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Vous-même (via votre espace).</li>
            <li>
              Le commerçant concerné par votre commande (nom, contenu du panier,
              adresse de livraison, téléphone).
            </li>
            <li>
              Le livreur assigné (nom, adresse, téléphone, montant de la
              commande).
            </li>
            <li>
              L&apos;équipe Miam-miam Listo (support, administration) pour la
              gestion des litiges et la conformité.
            </li>
          </ul>
          <p>
            Aucune donnée n&apos;est vendue ni cédée à des tiers à des fins
            publicitaires.
          </p>
        </Section>

        <Section id="transferts" title="7. Transferts hors UE">
          <p>
            En MVP, les données sont hébergées localement (SQLite) et ne font
            l&apos;objet d&apos;aucun transfert hors de l&apos;Union européenne.
            Une migration cloud pourra être envisagée en V2, avec des garanties
            conformes au RGPD.
          </p>
        </Section>

        <Section id="droits" title="8. Vos droits">
          <p>
            Conformément au RGPD, vous disposez des droits suivants : accès,
            rectification, effacement, limitation, opposition, portabilité.
          </p>
          <p>Pour les exercer :</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Export</strong> :{" "}
              <Link
                href="/client/rgpd"
                className="font-medium text-chart-1 hover:underline"
              >
                /client/rgpd
              </Link>{" "}
              génère un JSON contenant toutes vos données.
            </li>
            <li>
              <strong>Suppression</strong> :{" "}
              <Link
                href="/client/rgpd"
                className="font-medium text-chart-1 hover:underline"
              >
                /client/rgpd
              </Link>{" "}
              supprime votre compte. Vos commandes sont anonymisées pour rester
              conformes aux obligations comptables.
            </li>
            <li>
              <strong>Contact</strong> :{" "}
              <a
                href="mailto:contact@miam-miam-listo.example"
                className="font-medium text-chart-1 hover:underline"
              >
                contact@miam-miam-listo.example
              </a>
            </li>
          </ul>
          <p>
            Vous pouvez également introduire une réclamation auprès de la CNIL
            (www.cnil.fr).
          </p>
        </Section>

        <Section id="cookies" title="9. Cookies">
          <p>
            En MVP, Miam-miam Listo n&apos;utilise{" "}
            <strong>aucun cookie analytique ni publicitaire</strong>. Seuls les
            cookies strictement nécessaires au fonctionnement (session Better
            Auth, préférence de thème) sont déposés. Ils ne nécessitent pas de
            bandeau de consentement.
          </p>
        </Section>

        <Section id="contact" title="10. Contact">
          <p>
            Pour toute question relative à cette politique ou à vos données :{" "}
            <a
              href="mailto:contact@miam-miam-listo.example"
              className="font-medium text-chart-1 hover:underline"
            >
              contact@miam-miam-listo.example
            </a>
          </p>
        </Section>

        <Section id="modifications" title="11. Modifications">
          <p>
            Cette politique peut être modifiée. En cas de changement
            substantiel, vous serez informé via une notification in-app et
            invité à accepter la nouvelle version. La date de mise à jour figure
            en haut de cette page.
          </p>
        </Section>
      </div>

      <footer className="flex flex-wrap justify-center gap-2 pt-2">
        <Link
          href="/legal/terms"
          className={buttonVariants({ variant: "outline" })}
        >
          Conditions générales
        </Link>
        <Link href="/" className={buttonVariants({ variant: "ghost" })}>
          Retour à l&apos;accueil
        </Link>
      </footer>
    </article>
  );
}
