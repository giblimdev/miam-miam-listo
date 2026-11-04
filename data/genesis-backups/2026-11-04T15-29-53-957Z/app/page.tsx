/*
path :           app/page.tsx
tag :            ["home", "page", "landing", "discovery", "catalog", "uber-eats-style"]
projectId :      <à fournir>
type :           page
generic:         false

role:            Page d'accueil publique de Miam-miam Listo, inspirée
                 d'Uber Eats dans ses fonctionnalités (recherche, choix
                 d'adresse, catégories, commerces près de vous, how it
                 works) mais avec la charte graphique Genesis (palette
                 chart-1..chart-5, gradients, cartes à bande colorée,
                 badges V2). Aucune session requise, aucune donnée
                 Prisma en MVP : les commerces sont des mocks locaux
                 (MOCK_COMMERCES) pour matérialiser le rendu. Le branchement
                 Prisma se fera quand Better Auth + le modèle Commerce
                 seront en place.

                 Structure :
                 - Hero : badge, titre gradient, sous-titre, barre de
                   recherche (Input + bouton), 3 chips de confiance
                   (paiement mock, commission 0 %, mobile-first).
                 - Catégories : grille 2 / 4 de cartes cliquables
                   (Repas, Courses, Food-trucks, Primeurs) menant vers la
                   future page de listing filtré (ici /client).
                 - Commerces près de vous : grille de 6 cartes mock
                   (image placeholder, nom, type, note, temps, frais de
                   livraison, badge kind REPAS/COURSES).
                 - Comment ça marche : 3 étapes numérotées (Choisir,
                   Commander, Suivre).
                 - CTA commerçant : bloc gradient vers /merchant.
                 Aucune donnée dynamique, aucun fetch, aucun état.

flow:            Server Component pur → rend un wrapper min-h-svh →
                 Hero (recherche + chips) → section Catégories (grille
                 de 4 cartes) → section Commerces (grille de 6 cartes
                 mock) → section Comment ça marche (3 étapes) → CTA
                 commerçant. Aucun état, aucun effet, aucun fetch.

ecosystem:       Home = [
                   "@/app/page.tsx",
                 ]

relatedFiles:    ["@/components/ui/button.tsx",
                  "@/components/ui/card.tsx",
                  "@/components/ui/input.tsx",
                  "@/config/roles.ts"]

imports:         ["next/link", "lucide-react",
                  "@/components/ui/button",
                  "@/components/ui/card",
                  "@/components/ui/input"]

exports:         ["default HomePage", "metadata"]

useBy:           []

userStories:     ["*en tant que client je veux découvrir les commerces autour de moi et commander",
                  "*en tant que client je veux rechercher un commerce ou un plat",
                  "*en tant que commerçant je veux comprendre comment m'inscrire"]

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
  ChefHat,
  Clock,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Star,
  Store,
  Truck,
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
import { Input } from "@/components/ui/input";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Miam-miam Listo — Livraison du quotidien",
  description:
    "Commandez vos repas et vos courses auprès des commerces autour de vous. POS mobile-first, stock déduit, fidélité. Commission 0 % en MVP.",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CategoryCard {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly accent: string;
}

interface MockCommerce {
  readonly id: string;
  readonly name: string;
  readonly kind: "restaurant" | "food-truck" | "grocery" | "greengrocer";
  readonly rating: number;
  readonly eta: string;
  readonly deliveryFee: string;
  readonly tags: readonly string[];
  readonly accent: string;
}

interface StepCard {
  readonly step: string;
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly accent: string;
}

/* ------------------------------------------------------------------ */
/*  Config — catégories                                                */
/* ------------------------------------------------------------------ */

const CATEGORIES: readonly CategoryCard[] = [
  {
    id: "meals",
    label: "Repas",
    description: "Restaurants et food-trucks autour de vous",
    href: "/client",
    icon: ChefHat,
    accent: "chart-1",
  },
  {
    id: "groceries",
    label: "Courses",
    description: "Supérettes, épiceries, primeurs, marchés",
    href: "/client",
    icon: ShoppingBasket,
    accent: "chart-2",
  },
  {
    id: "food-trucks",
    label: "Food-trucks",
    description: "Les camions qui passent près de chez vous",
    href: "/client",
    icon: Truck,
    accent: "chart-3",
  },
  {
    id: "local",
    label: "Circuits courts",
    description: "Primeurs et producteurs locaux",
    href: "/client",
    icon: Store,
    accent: "chart-5",
  },
];

/* ------------------------------------------------------------------ */
/*  Config — commerces mock (en attendant Prisma)                     */
/* ------------------------------------------------------------------ */

const MOCK_COMMERCES: readonly MockCommerce[] = [
  {
    id: "le-petit-marche",
    name: "Le Petit Marché",
    kind: "restaurant",
    rating: 4.8,
    eta: "20–30 min",
    deliveryFee: "2,50 €",
    tags: ["Français", "Bistrot"],
    accent: "chart-1",
  },
  {
    id: "wok-street",
    name: "Wok Street",
    kind: "food-truck",
    rating: 4.6,
    eta: "15–25 min",
    deliveryFee: "1,90 €",
    tags: ["Asiatique", "Street food"],
    accent: "chart-3",
  },
  {
    id: "primeur-du-coin",
    name: "Le Primeur du Coin",
    kind: "greengrocer",
    rating: 4.9,
    eta: "30–45 min",
    deliveryFee: "3,00 €",
    tags: ["Fruits", "Légumes"],
    accent: "chart-5",
  },
  {
    id: "chez-nonna",
    name: "Chez Nonna",
    kind: "restaurant",
    rating: 4.7,
    eta: "25–35 min",
    deliveryFee: "2,90 €",
    tags: ["Italien", "Pâtes"],
    accent: "chart-2",
  },
  {
    id: "epicerie-verte",
    name: "L'Épicerie Verte",
    kind: "grocery",
    rating: 4.5,
    eta: "20–30 min",
    deliveryFee: "2,20 €",
    tags: ["Bio", "Épicerie"],
    accent: "chart-4",
  },
  {
    id: "tacos-loco",
    name: "Tacos Loco",
    kind: "food-truck",
    rating: 4.4,
    eta: "10–20 min",
    deliveryFee: "1,50 €",
    tags: ["Mexicain", "Tacos"],
    accent: "chart-1",
  },
];

const KIND_LABEL: Record<MockCommerce["kind"], string> = {
  restaurant: "Restaurant",
  "food-truck": "Food-truck",
  grocery: "Épicerie",
  greengrocer: "Primeur",
};

/* ------------------------------------------------------------------ */
/*  Config — étapes                                                    */
/* ------------------------------------------------------------------ */

const STEPS: readonly StepCard[] = [
  {
    step: "1",
    title: "Choisir",
    description:
      "Parcourez les commerces autour de vous, filtrez par type, consultez les menus et les prix.",
    icon: Search,
    accent: "chart-1",
  },
  {
    step: "2",
    title: "Commander",
    description:
      "Remplissez votre panier, choisissez sur place / à emporter / livraison, validez en 3 clics.",
    icon: ShoppingBag,
    accent: "chart-3",
  },
  {
    step: "3",
    title: "Suivre",
    description:
      "Suivez votre commande en temps réel, cumulez des points de fidélité, recommandez en 1 clic.",
    icon: Bike,
    accent: "chart-5",
  },
];

/* ------------------------------------------------------------------ */
/*  Sous-composants                                                    */
/* ------------------------------------------------------------------ */

function CategoryTile({ category }: { readonly category: CategoryCard }) {
  const Icon = category.icon;
  const accent = category.accent;

  return (
    <Link
      href={category.href}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ "--accent": `var(--${accent})` } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-70"
        style={{
          background: `linear-gradient(90deg, var(--${accent}), transparent)`,
        }}
      />
      <div
        className="grid size-10 place-items-center rounded-xl text-white shadow-md"
        style={{
          background: `linear-gradient(135deg, var(--${accent}), color-mix(in oklab, var(--${accent}) 60%, black))`,
        }}
      >
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground">{category.label}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {category.description}
        </p>
      </div>
    </Link>
  );
}

function CommerceCard({ commerce }: { readonly commerce: MockCommerce }) {
  const accent = commerce.accent;

  return (
    <Link
      href={`/client`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ "--accent": `var(--${accent})` } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-1 opacity-70"
        style={{
          background: `linear-gradient(90deg, var(--${accent}), transparent)`,
        }}
      />

      {/* Image placeholder avec initiales */}
      <div
        className="relative flex h-32 items-center justify-center"
        style={{
          background: `linear-gradient(135deg, color-mix(in oklab, var(--${accent}) 20%, transparent), color-mix(in oklab, var(--${accent}) 5%, transparent))`,
        }}
      >
        <span
          className="grid size-14 place-items-center rounded-2xl text-white shadow-lg"
          style={{
            background: `linear-gradient(135deg, var(--${accent}), color-mix(in oklab, var(--${accent}) 60%, black))`,
          }}
        >
          <Store className="size-6" aria-hidden />
        </span>
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
          {KIND_LABEL[commerce.kind]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-foreground">
            {commerce.name}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-chart-4/10 px-2 py-0.5 text-[11px] font-semibold text-chart-4">
            <Star className="size-3 fill-current" aria-hidden />
            {commerce.rating.toFixed(1)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {commerce.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {commerce.eta}
          </span>
          <span className="inline-flex items-center gap-1">
            <Truck className="size-3.5" aria-hidden />
            {commerce.deliveryFee}
          </span>
        </div>
      </div>
    </Link>
  );
}

function StepTile({ step }: { readonly step: StepCard }) {
  const Icon = step.icon;
  const accent = step.accent;

  return (
    <div
      className="relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5"
      style={{ "--accent": `var(--${accent})` } as React.CSSProperties}
    >
      <div className="flex items-center gap-3">
        <span
          className="grid size-10 place-items-center rounded-xl text-white shadow-md"
          style={{
            background: `linear-gradient(135deg, var(--${accent}), color-mix(in oklab, var(--${accent}) 60%, black))`,
          }}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Étape {step.step}
          </p>
          <p className="text-base font-bold text-foreground">{step.title}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {step.description}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-muted/20">
      {/* ===================== HERO ================================== */}
      <section className="relative overflow-hidden px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-chart-1/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-16 size-96 rounded-full bg-chart-5/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-chart-2" aria-hidden />
            Livraison du quotidien · repas & courses
          </span>

          <h1 className="mt-4 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-5 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl md:text-6xl">
            Vos repas et vos courses, en 3 clics
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Commandez auprès des restaurants, food-trucks et primeurs autour de
            vous. Suivi en temps réel, fidélité par commerce, commission 0 % en
            MVP.
          </p>

          {/* Barre de recherche */}
          <form
            className="mt-8 flex flex-col gap-2 sm:flex-row"
            action="/client"
            method="get"
          >
            <div className="relative flex-1">
              <MapPin
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                name="q"
                placeholder="Adresse, code postal, ou nom d'un commerce…"
                className="h-12 w-full pl-10 text-base"
                aria-label="Rechercher un commerce"
              />
            </div>
            <button
              type="submit"
              className={`${buttonVariants()} h-12 gap-2 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-5 text-white shadow-lg shadow-chart-1/30 hover:brightness-110`}
            >
              <Search className="size-4" aria-hidden />
              Rechercher
            </button>
          </form>

          {/* Chips de confiance */}
          <ul className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <li className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 backdrop-blur">
              <ShieldCheck className="size-3.5 text-chart-4" aria-hidden />
              Paiement sécurisé
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 backdrop-blur">
              <Bike className="size-3.5 text-chart-2" aria-hidden />
              Livraison locale
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 backdrop-blur">
              <Package className="size-3.5 text-chart-5" aria-hidden />
              Commission 0 % (MVP)
            </li>
          </ul>
        </div>
      </section>

      {/* ===================== CATÉGORIES ============================ */}
      <section className="px-4 pb-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5 flex items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Que voulez-vous manger ?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choisissez une catégorie pour explorer les commerces.
              </p>
            </div>
            <Link
              href="/client"
              className="hidden text-sm font-medium text-chart-1 hover:underline sm:inline-flex"
            >
              Tout voir
              <ArrowRight className="ml-1 size-3.5" aria-hidden />
            </Link>
          </header>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CATEGORIES.map((category) => (
              <CategoryTile key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* ===================== COMMERCES ============================= */}
      <section className="px-4 pb-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5 flex items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Près de chez vous
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Une sélection de commerces pilotes dans votre quartier.
              </p>
            </div>
            <Link
              href="/client"
              className="hidden text-sm font-medium text-chart-1 hover:underline sm:inline-flex"
            >
              Tout voir
              <ArrowRight className="ml-1 size-3.5" aria-hidden />
            </Link>
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_COMMERCES.map((commerce) => (
              <CommerceCard key={commerce.id} commerce={commerce} />
            ))}
          </div>
        </div>
      </section>

      {/* ===================== COMMENT ÇA MARCHE ===================== */}
      <section className="px-4 pb-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Comment ça marche ?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Trois étapes, pas plus. De la découverte à la livraison.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {STEPS.map((step) => (
              <StepTile key={step.step} step={step} />
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA COMMERÇANT ======================== */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-chart-1/10 via-chart-2/10 to-chart-5/10 p-8 text-center sm:p-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Users className="size-3.5 text-chart-3" aria-hidden />
            Vous êtes commerçant ?
          </span>

          <h2 className="mt-4 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-5 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
            Ouvrez votre commerce sur Miam-miam Listo
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            POS mobile-first, stock déduit des recettes, fidélité par commerce.
            49 €/mois, commission 0 % sur les commandes en MVP. Pensé pour les
            restaurants, food-trucks et primeurs.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href="/onboarding"
              className={`${buttonVariants()} gap-2 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-5 text-white shadow-lg shadow-chart-1/30 hover:brightness-110`}
            >
              Devenir partenaire
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/merchant"
              className={buttonVariants({ variant: "outline" })}
            >
              Voir l&apos;espace commerçant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}