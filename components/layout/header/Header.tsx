/*
path :           components/layout/header/Header.tsx
tag :            ["layout", "header", "navigation", "slot", "ui", "platform-role"]
projectId:       new-genesis
type :           component
generic:         false

role:            En-tête global. Composant CLIENT (useState pour le
                 menu mobile). Reçoit en props :
                 - `notificationSlot` : Server Component async (la
                   cloche) monté sous Suspense par app/layout.tsx.
                 - `platformRole` : rôle plateforme de l'utilisateur
                   courant (null = anonyme), calculé côté serveur par
                   app/layout.tsx via getSession() + prisma.user.platformRole.
                   Passé à MainNav pour filtrer les items selon
                   `minPlatformRole` (hiérarchie superAdmin > admin > user).
                 Le Header ne lit PAS la session (interdit côté client) :
                 tout vient du layout serveur.

flow:            Client Component → useState(mobileOpen) → rend
                 <header> sticky → zone gauche (Logo + MainNav avec
                 items + platformRole) + zone droite (notificationSlot +
                 UserMenu + burger mobile) → panneau mobile conditionnel.
                 Filtrage : canSee(item, platformRole) utilise
                 hasPlatformRank pour la hiérarchie. Anonyme (null) :
                 seuls les items minPlatformRole: "user" sont visibles.

ecosystem:       Layout = [
                   "@/app/globals.css",
                   "@/app/layout.tsx",
                   "@/app/blog/components/NotificationBell.tsx",
                   "@/components/layout/footer/Footer.tsx",
                   "@/components/layout/header/Header.tsx",
                   "@/components/layout/header/Logo.tsx",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/NavActiveLink.tsx",
                   "@/components/layout/header/UserMenu.tsx",
                   "@/components/layout/header/nav/frontWorkSpace.ts",
                   "@/components/layout/header/navTypes.ts",
                   "@/components/ui/sonner.tsx",
                   "@/components/ui/tooltip.tsx",
                   "@/config/navigation.ts",
                   "@/config/roles.ts",
                 ]

relatedFiles:    ["@/components/layout/header/Logo.tsx",
                  "@/components/layout/header/MainNav.tsx",
                  "@/components/layout/header/UserMenu.tsx",
                  "@/components/layout/header/nav/frontWorkSpace.ts",
                  "@/components/layout/header/navTypes.ts",
                  "@/app/blog/components/NotificationBell.tsx",
                  "@/app/layout.tsx",
                  "@/config/roles.ts"]

imports:         ["react", "next/link", "lucide-react",
                  "@/components/ui/button",
                  "@/components/layout/header/Logo",
                  "@/components/layout/header/MainNav",
                  "@/components/layout/header/UserMenu",
                  "@/components/layout/header/nav/frontWorkSpace",
                  "@/components/layout/header/navTypes",
                  "@/config/roles"]

exports:         ["default Header", "HeaderProps"]

useBy:           ["@/app/layout.tsx"]

userStories:     ["*en tant que développeur je veux un header avec menu desktop et mobile",
                  "us5100001"]
status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (mobileOpen) + interactions burger.

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import Logo from "@/components/layout/header/Logo";
import MainNav from "@/components/layout/header/MainNav";
import UserMenu from "@/components/layout/header/UserMenu";
import { mainNavData } from "@/components/layout/header/nav/frontWorkSpace";
import type { NavItem } from "@/components/layout/header/navTypes";
import { hasPlatformRank, type PlatformRole } from "@/config/roles";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface HeaderProps {
  /**
   * Slot optionnel rendu côté serveur (Server Component async) — par
   * exemple <NotificationBell />. Monté sous Suspense par app/layout.tsx
   * pour éviter d'évaluer du code serveur dans le bundle client.
   */
  readonly notificationSlot?: React.ReactNode;
  /**
   * Rôle plateforme de l'utilisateur courant (null = anonyme).
   * Calculé côté serveur par app/layout.tsx. Sert à filtrer les items
   * de navigation selon `minPlatformRole` (hiérarchie stricte :
   * superAdmin > admin > user).
   */
  readonly platformRole: PlatformRole | null;
}

/* ------------------------------------------------------------------ */
/*  Filtrage par rôle plateforme                                       */
/* ------------------------------------------------------------------ */

function canSee(item: NavItem, platformRole: PlatformRole | null): boolean {
  /* 1. Filtre `visible` */
  if (item.visible === false) return false;

  /* 2. Anonyme : seuls les items `user` sont visibles. */
  if (!platformRole) {
    return item.minPlatformRole === "user";
  }

  /* 3. Hiérarchie : superAdmin > admin > user. */
  return hasPlatformRank(platformRole, item.minPlatformRole);
}

/* ------------------------------------------------------------------ */
/*  Groupe mobile (item avec children)                                 */
/* ------------------------------------------------------------------ */

interface MobileGroupProps {
  readonly item: NavItem;
  readonly platformRole: PlatformRole | null;
  readonly onNavigate: () => void;
}

function MobileGroup({ item, platformRole, onNavigate }: MobileGroupProps) {
  const children = (item.children ?? [])
    .filter((child) => canSee(child, platformRole))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  /* Si aucun enfant visible, ne rien rendre (évite les en-têtes vides). */
  if (children.length === 0) return null;

  return (
    <div className="flex flex-col">
      <span className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {item.label}
      </span>
      <ul className="flex flex-col gap-0.5">
        {children.map((child) => (
          <li key={child.id}>
            {child.href ? (
              <Link
                href={child.href}
                onClick={onNavigate}
                target={child.external ? "_blank" : undefined}
                rel={child.external ? "noopener noreferrer" : undefined}
                className="flex flex-col gap-0.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <span className="font-medium text-foreground">
                  {child.label}
                </span>
                {child.description && (
                  <span className="text-xs text-muted-foreground">
                    {child.description}
                  </span>
                )}
              </Link>
            ) : (
              <span className="block px-3 py-2 text-sm text-muted-foreground">
                {child.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

export default function Header({
  notificationSlot,
  platformRole,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen((v) => !v);
  const closeMobile = () => setMobileOpen(false);

  const sortedItems = [...mainNavData]
    .filter((item) => canSee(item, platformRole))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <MainNav items={sortedItems} platformRole={platformRole} />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {notificationSlot}
          <UserMenu />

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={toggleMobile}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-t border-border/60 bg-background md:hidden"
        >
          <nav
            aria-label="Navigation mobile"
            className="mx-auto max-w-6xl px-4 py-4 sm:px-6"
          >
            <ul className="flex flex-col gap-1">
              {sortedItems.map((item) => (
                <li key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={closeMobile}
                      className="flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <MobileGroup
                      item={item}
                      platformRole={platformRole}
                      onNavigate={closeMobile}
                    />
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
