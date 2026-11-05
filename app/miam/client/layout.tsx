/*
path :           app/client/layout.tsx
tag :            ["client", "layout", "navigation", "hero"]
projectId :      <MiamMiamListo>
type :           layout
generic:         false

role:            Layout de l'espace client. Rendu AÉRÉ orienté
                 découverte, distinct des espaces merchant et courier :
                 - Header centré avec logo + wordmark « Miam-miam
                   Listo » + nav horizontale centrée sous le logo.
                 - Zone de contenu max-w-6xl, paddings généreux (py-8,
                   gap-10). Palette d'accent chart-1 (violet) + chart-5
                   (rose). Typographie aérée (leading-relaxed,
                   text-base).
                 - Footer simple en bas.
                 Pensé pour un client qui parcourt un catalogue et
                 consulte ses commandes.

                 AUCUNE restriction d'accès pour l'instant : le layout
                 est public. La protection RBAC sera ajoutée plus tard.

flow:            Client Component (usePathname pour l'état actif) →
                 wrapper min-h-svh flex flex-col → header centré
                 (logo + nav) → main flex-1 avec contenu max-w-6xl →
                 footer. Aucun fetch, aucun état métier.

ecosystem:       Client = [
                   "@/app/client/layout.tsx",
                   "@/app/client/page.tsx",
                   "@/app/client/orders/page.tsx",
                   "@/app/client/orders/[orderId]/page.tsx",
                   "@/app/client/orders/[orderId]/track/page.tsx",
                   "@/app/client/loyalty/page.tsx",
                   "@/app/client/account/page.tsx",
                   "@/app/client/rgpd/page.tsx",
                 ]

relatedFiles:    []

imports:         ["next/link", "next/navigation", "lucide-react"]

exports:         ["default ClientLayout"]

useBy:           []

userStories:     ["*en tant que client je veux un espace aéré pour parcourir et commander"]

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
  Gift,
  History,
  Home,
  ShieldCheck,
  ShoppingBag,
  User,
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
  { href: "/client", label: "Accueil", icon: Home },
  { href: "/client/orders", label: "Commandes", icon: History },
  { href: "/client/loyalty", label: "Fidélité", icon: Gift },
  { href: "/client/account", label: "Compte", icon: User },
  { href: "/client/rgpd", label: "Mes données", icon: ShieldCheck },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-chart-1/5 via-background to-background">
      {/* ===================== HEADER CENTRÉ ========================== */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-6 sm:px-6">
          {/* Logo + wordmark */}
          <Link
            href="/client"
            className="flex items-center gap-2.5"
            aria-label="Espace client Miam-miam Listo"
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-chart-1 via-chart-2 to-chart-5 text-white shadow-lg shadow-chart-1/30">
              <ShoppingBag className="size-5" aria-hidden />
            </span>
            <span className="text-xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-5 bg-clip-text text-transparent">
                Miam-miam
              </span>{" "}
              <span className="text-foreground">Listo</span>
            </span>
          </Link>

          {/* Nav horizontale centrée */}
          <nav
            aria-label="Navigation client"
            className="flex w-full items-center justify-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-gradient-to-r from-chart-1 to-chart-2 text-white shadow-md shadow-chart-1/30"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ===================== CONTENU AÉRÉ ========================== */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </div>
      </main>

      {/* ===================== FOOTER ================================= */}
      <footer className="border-t border-border/40 bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© Miam-miam Listo — MVP</p>
          <div className="flex gap-3">
            <Link href="/legal/privacy" className="hover:text-foreground">
              Confidentialité
            </Link>
            <Link href="/legal/terms" className="hover:text-foreground">
              CGU
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
