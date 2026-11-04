/*
path :           app/merchant/layout.tsx
tag :            ["merchant", "layout", "navigation"]
projectId :      <à fournir>
type :           layout
generic:         false

role:            Layout de l'espace commerçant (owner + staff). Fournit
                 un header sticky avec le titre « Espace commerçant »,
                 une nav horizontale (SubNav) listant les sous-espaces
                 (Accueil, Dashboard, Catalogue, POS, Stock, Commandes,
                 Fidélité, Paramètres), et un conteneur max-w-7xl qui
                 monte les pages enfants.

                 AUCUNE restriction d'accès pour l'instant : le layout
                 est public. La protection RBAC (requireMerchant via
                 Better Auth + commerce_members) sera ajoutée plus tard,
                 quand la configuration Better Auth sera terminée. En
                 attendant, toutes les pages /merchant/* sont accessibles
                 sans session.

flow:            Server Component → rend un wrapper min-h-svh avec
                 fond dégradé → header sticky (titre + sous-titre) →
                 SubNav (nav horizontale) → <main> avec children.
                 Aucun état, aucun effet, aucun fetch.

ecosystem:       Merchant = [
                   "@/app/merchant/layout.tsx",
                   "@/app/merchant/page.tsx",
                   "@/app/merchant/dashboard/page.tsx",
                   "@/app/merchant/catalog/page.tsx",
                   "@/app/merchant/pos/page.tsx",
                   "@/app/merchant/stock/page.tsx",
                   "@/app/merchant/orders/page.tsx",
                   "@/app/merchant/loyalty/page.tsx",
                   "@/app/merchant/settings/page.tsx",
                   "@/components/layout/SubNav.tsx",
                 ]

relatedFiles:    ["@/components/layout/SubNav.tsx"]

imports:         ["lucide-react",
                  "@/components/layout/SubNav"]

exports:         ["default MerchantLayout"]

useBy:           []

userStories:     ["*en tant que commerçant je veux une navigation cohérente dans mon espace"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import {
  BarChart3,
  ClipboardList,
  Gift,
  Home,
  LayoutGrid,
  Package,
  Settings,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";

import { SubNav, type SubNavItem } from "@/components/layout/SubNav";

/* ------------------------------------------------------------------ */
/*  Nav                                                                */
/* ------------------------------------------------------------------ */

const NAV_ITEMS: readonly SubNavItem[] = [
  { href: "/merchant", label: "Accueil", icon: Home },
  { href: "/merchant/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/merchant/catalog", label: "Catalogue", icon: Package },
  { href: "/merchant/pos", label: "POS", icon: ShoppingCart },
  { href: "/merchant/stock", label: "Stock", icon: ClipboardList },
  { href: "/merchant/orders", label: "Commandes", icon: LayoutGrid },
  { href: "/merchant/loyalty", label: "Fidélité", icon: Gift },
  { href: "/merchant/settings", label: "Paramètres", icon: Settings },
];

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <header className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-2">
              Espace commerçant
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Merchant
              </h1>
              <p className="max-w-md text-sm text-muted-foreground">
                Gérer le catalogue, prendre les commandes au POS, suivre le
                stock et la fidélité.
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