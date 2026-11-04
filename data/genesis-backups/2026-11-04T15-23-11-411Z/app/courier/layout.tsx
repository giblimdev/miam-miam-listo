/*
path :           app/courier/layout.tsx
tag :            ["courier", "layout", "navigation"]
projectId :      <à fournir>
type :           layout
generic:         false

role:            Layout de l'espace livreur. Fournit un header sticky
                 avec le titre « Espace livreur », une nav horizontale
                 (SubNav) listant les sous-espaces (Accueil, Missions,
                 Historique, Rémunération, Profil), et un conteneur
                 max-w-5xl qui monte les pages enfants.

                 AUCUNE restriction d'accès pour l'instant : le layout
                 est public. La protection RBAC (requireCourier) sera
                 ajoutée plus tard, quand Better Auth sera configuré.

flow:            Server Component → rend un wrapper min-h-svh avec
                 fond dégradé → header sticky (titre + sous-titre) →
                 SubNav (nav horizontale) → <main> avec children.
                 Aucun état, aucun effet, aucun fetch.

ecosystem:       Courier = [
                   "@/app/courier/layout.tsx",
                   "@/app/courier/page.tsx",
                   "@/app/courier/missions/page.tsx",
                   "@/app/courier/missions/[orderId]/page.tsx",
                   "@/app/courier/missions/[orderId]/track/page.tsx",
                   "@/app/courier/history/page.tsx",
                   "@/app/courier/earnings/page.tsx",
                   "@/app/courier/profile/page.tsx",
                   "@/components/layout/SubNav.tsx",
                 ]

relatedFiles:    ["@/components/layout/SubNav.tsx"]

imports:         ["lucide-react",
                  "@/components/layout/SubNav"]

exports:         ["default CourierLayout"]

useBy:           []

userStories:     ["*en tant que livreur je veux une navigation cohérente dans mon espace"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import {
  Bike,
  History,
  Home,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { SubNav, type SubNavItem } from "@/components/layout/SubNav";

/* ------------------------------------------------------------------ */
/*  Nav                                                                */
/* ------------------------------------------------------------------ */

const NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/courier", label: "Accueil", icon: Home },
  { href: "/courier/missions", label: "Missions", icon: Bike },
  { href: "/courier/history", label: "Historique", icon: History },
  { href: "/courier/earnings", label: "Rémunération", icon: Wallet },
  { href: "/courier/profile", label: "Profil", icon: User },
];

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export default function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <header className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-2">
              Espace livreur
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Courier
              </h1>
              <p className="max-w-md text-sm text-muted-foreground">
                Recevoir vos missions, suivre leur état, consulter votre
                rémunération.
              </p>
            </div>
          </header>

          <SubNav items={NAV_ITEMS} />

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}