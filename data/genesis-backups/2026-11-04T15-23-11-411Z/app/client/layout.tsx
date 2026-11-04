/*
path :           app/client/layout.tsx
tag :            ["client", "layout", "navigation"]
projectId :      <à fournir>
type :           layout
generic:         false

role:            Layout de l'espace client. Fournit un header sticky
                 avec le titre « Espace client », une nav horizontale
                 (SubNav) listant les sous-espaces (Accueil, Commandes,
                 Fidélité, Compte, Données RGPD), et un conteneur
                 max-w-5xl qui monte les pages enfants.

                 AUCUNE restriction d'accès pour l'instant : le layout
                 est public. La protection RBAC (requireSession côté
                 client) sera ajoutée plus tard, quand Better Auth sera
                 configuré. En attendant, toutes les pages /client/*
                 sont accessibles sans session.

flow:            Server Component → rend un wrapper min-h-svh avec
                 fond dégradé → header sticky (titre + sous-titre) →
                 SubNav (nav horizontale) → <main> avec children.
                 Aucun état, aucun effet, aucun fetch.

ecosystem:       Client = [
                   "@/app/client/layout.tsx",
                   "@/app/client/page.tsx",
                   "@/app/client/orders/page.tsx",
                   "@/app/client/orders/[orderId]/page.tsx",
                   "@/app/client/orders/[orderId]/track/page.tsx",
                   "@/app/client/loyalty/page.tsx",
                   "@/app/client/account/page.tsx",
                   "@/app/client/rgpd/page.tsx",
                   "@/components/layout/SubNav.tsx",
                 ]

relatedFiles:    ["@/components/layout/SubNav.tsx"]

imports:         ["lucide-react",
                  "@/components/layout/SubNav"]

exports:         ["default ClientLayout"]

useBy:           []

userStories:     ["*en tant que client je veux une navigation cohérente dans mon espace"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import {
  Gift,
  History,
  Home,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";

import { SubNav, type SubNavItem } from "@/components/layout/SubNav";

/* ------------------------------------------------------------------ */
/*  Nav                                                                */
/* ------------------------------------------------------------------ */

const NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/client", label: "Accueil", icon: Home },
  { href: "/client/orders", label: "Commandes", icon: History },
  { href: "/client/loyalty", label: "Fidélité", icon: Gift },
  { href: "/client/account", label: "Compte", icon: User },
  { href: "/client/rgpd", label: "Mes données", icon: ShieldCheck },
];

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export default function ClientLayout({
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
              Espace client
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Client
              </h1>
              <p className="max-w-md text-sm text-muted-foreground">
                Suivre vos commandes, cumuler vos points, gérer vos données
                personnelles.
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