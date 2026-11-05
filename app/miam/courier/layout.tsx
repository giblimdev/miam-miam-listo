/*
path :           app/courier/layout.tsx
tag :            ["courier", "layout", "navigation", "bottom-bar", "mobile"]
projectId :      <MiamMiamListo>
type :           layout
generic:         false

role:            Layout de l'espace livreur. Rendu MOBILE-FIRST STRICT
                 orienté action, distinct des espaces merchant et
                 client :
                 - Mobile (< md) : header compact en haut + nav en
                   BOTTOM BAR fixe (comme une app native), zone de
                   contenu max-w-2xl centrée, marge basse pour ne pas
                   être masquée par la bottom bar.
                 - Desktop (≥ md) : header horizontal + nav horizontale
                   sous le header, contenu max-w-2xl centré.
                 Palette d'accent chart-4 (émeraude). Gros boutons
                 tactiles (py-3), icônes size-5. Pensé pour un livreur
                 à vélo qui utilise son téléphone en déplacement.

                 AUCUNE restriction d'accès pour l'instant : le layout
                 est public. La protection RBAC sera ajoutée plus tard.

flow:            Client Component (usePathname pour l'état actif) →
                 wrapper min-h-svh → header sticky → main avec
                 padding-bottom mobile (pb-24) → nav bottom bar
                 (md:hidden) ou nav horizontale (hidden md:flex).
                 Aucun fetch, aucun état métier.

ecosystem:       Courier = [
                   "@/app/courier/layout.tsx",
                   "@/app/courier/page.tsx",
                   "@/app/courier/missions/page.tsx",
                   "@/app/courier/missions/[orderId]/page.tsx",
                   "@/app/courier/missions/[orderId]/track/page.tsx",
                   "@/app/courier/history/page.tsx",
                   "@/app/courier/earnings/page.tsx",
                   "@/app/courier/profile/page.tsx",
                 ]

relatedFiles:    []

imports:         ["next/link", "next/navigation", "lucide-react"]

exports:         ["default CourierLayout"]

useBy:           []

userStories:     ["*en tant que livreur je veux une UI mobile-first orientée action"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : usePathname pour l'état actif de la nav.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, History, Home, User, Wallet } from "lucide-react";

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
  { href: "/courier", label: "Accueil", icon: Home },
  { href: "/courier/missions", label: "Missions", icon: Bike },
  { href: "/courier/history", label: "Historique", icon: History },
  { href: "/courier/earnings", label: "Gains", icon: Wallet },
  { href: "/courier/profile", label: "Profil", icon: User },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export default function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-svh bg-gradient-to-b from-chart-4/5 via-background to-background">
      {/* ===================== HEADER ================================= */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-chart-4 to-chart-2 text-white shadow-md shadow-chart-4/30">
              <Bike className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-chart-4">
                Livreur
              </p>
              <p className="text-sm font-bold text-foreground">Miam-miam</p>
            </div>
          </div>

          {/* Nav desktop uniquement */}
          <nav
            aria-label="Navigation livreur"
            className="hidden items-center gap-1 md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-chart-4/15 text-chart-4"
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

      {/* ===================== CONTENU ================================ */}
      {/* pb-24 mobile : laisse la place à la bottom bar fixe (h-16 + marge) */}
      <main className="mx-auto w-full max-w-2xl px-4 py-5 pb-24 md:pb-10">
        {children}
      </main>

      {/* ===================== BOTTOM BAR (mobile) ==================== */}
      <nav
        aria-label="Navigation livreur"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur md:hidden"
      >
        <ul className="mx-auto flex w-full max-w-2xl items-stretch">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors ${
                    active
                      ? "text-chart-4"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-5" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
