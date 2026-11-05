/*
path :           app/merchant/layout.tsx
tag :            ["merchant", "layout", "navigation", "sidebar"]
projectId :      <MiamMiamListo>
type :           layout
generic:         false

role:            Layout de l'espace commerçant. Rendu DENSE orienté
                 data, distinct des espaces courier et client :
                 - Desktop : sidebar verticale fixe à gauche (220px) +
                   zone de contenu large (max-w-7xl).
                 - Mobile : header compact + nav horizontale scrollable.
                 Palette d'accent chart-2 (cyan). Typographie serrée
                 (text-sm par défaut). Pensé pour un gérant qui consulte
                 des tableaux (catalogue, stock, commandes).

                 AUCUNE restriction d'accès pour l'instant : le layout
                 est public. La protection RBAC sera ajoutée plus tard.

flow:            Client Component (usePathname pour l'état actif) →
                 wrapper min-h-svh → desktop : grid [220px_1fr] avec
                 <aside> sidebar + <div> contenu → mobile : header
                 sticky + nav horizontale → <main> children.
                 Aucun fetch, aucun état métier.

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
                 ]

relatedFiles:    []

imports:         ["next/link", "next/navigation", "lucide-react"]

exports:         ["default MerchantLayout"]

useBy:           []

userStories:     ["*en tant que commerçant je veux un espace dense pour gérer mes données"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : usePathname pour l'état actif de la nav.

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  Gift,
  Home,
  LayoutGrid,
  Package,
  Settings,
  ShoppingCart,
  Store,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Nav                                                                */
/* ------------------------------------------------------------------ */

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
  }>;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/merchant", label: "Accueil", icon: Home },
  { href: "/merchant/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/merchant/catalog", label: "Catalogue", icon: Package },
  { href: "/merchant/pos", label: "POS", icon: ShoppingCart },
  { href: "/merchant/stock", label: "Stock", icon: ClipboardList },
  { href: "/merchant/orders", label: "Commandes", icon: LayoutGrid },
  { href: "/merchant/loyalty", label: "Fidélité", icon: Gift },
  { href: "/merchant/settings", label: "Paramètres", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-svh bg-background">
      {/* ===================== DESKTOP : sidebar + contenu ============ */}
      <div className="hidden lg:grid lg:min-h-svh lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="sticky top-0 flex h-svh flex-col border-r border-border/60 bg-gradient-to-b from-chart-2/5 to-background">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-4">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-chart-2 to-chart-3 text-white">
              <Store className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-chart-2">
                Espace
              </p>
              <p className="truncate text-sm font-bold text-foreground">
                Commerçant
              </p>
            </div>
          </div>

          <nav
            aria-label="Navigation commerçant"
            className="flex-1 space-y-0.5 overflow-y-auto p-2"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-chart-2/15 text-chart-2"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border/60 p-3">
            <p className="text-[10px] text-muted-foreground">
              Miam-miam Listo · MVP
            </p>
          </div>
        </aside>

        {/* Contenu */}
        <main className="min-w-0">
          <div className="mx-auto w-full max-w-7xl px-6 py-8">{children}</div>
        </main>
      </div>

      {/* ===================== MOBILE : header + nav horizontale ===== */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-chart-2 to-chart-3 text-white">
              <Store className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-chart-2">
                Espace
              </p>
              <p className="truncate text-sm font-bold text-foreground">
                Commerçant
              </p>
            </div>
          </div>

          <nav
            aria-label="Navigation commerçant"
            className="flex gap-1 overflow-x-auto border-t border-border/60 px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-chart-2/15 text-chart-2"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="px-4 py-5">{children}</main>
      </div>
    </div>
  );
}
