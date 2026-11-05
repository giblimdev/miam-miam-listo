/*
path :           components/layout/header/Header.tsx
tag :            ["layout", "header", "navigation", "sheet", "drawer", "ui", "platform-role", "recursive"]
projectId:       miam-miam-listo
type :           component
generic:         false

role:            En-tête global. Composant CLIENT (useState pour le
                 drawer). Reçoit en props :
                 - `notificationSlot` : Server Component async (la
                   cloche) monté sous Suspense par app/layout.tsx.
                 - `platformRole` : rôle plateforme de l'utilisateur
                   courant (null = anonyme), calculé côté serveur par
                   app/layout.tsx.
                 Le Header ne lit PAS la session (interdit côté client) :
                 tout vient du layout serveur.

                 INSPIRATION UBER EATS (stratégie A) : le bouton burger
                 est TOUJOURS visible (mobile ET desktop), placé À GAUCHE
                 du logo. Il ouvre un DRAWER latéral gauche (via
                 <Sheet side="left">) qui contient la navigation complète
                 (récursive, N niveaux) dans une zone scrollable
                 indépendante. MainNav desktop N'EST PLUS rendue dans le
                 header : le drawer est la SEULE source de navigation sur
                 tous les écrans. Le header reste sticky en haut.

                 ROUTES STATIQUES : le projet n'a qu'un seul flux Scrum
                 (scrum-business). Les hrefs Scrum sont écrits en dur
                 dans frontWorkSpace.ts (/scrum/scrum-business/...),
                 SANS segment dynamique `[flow]`. Ce composant N'UTILISE
                 PAS useParams() — évite l'erreur « Blocking Route »
                 de Next.js 16 (hook bloquant pour le prérendu).

flow:            Client Component → useState(drawerOpen) → useMemo
                 (sortedItems : filtre canSee + tri) → rend <header>
                 sticky → zone gauche (burger + Logo) → zone droite
                 (notificationSlot + UserMenu) → <Sheet
                 open={drawerOpen} onOpenChange={setDrawerOpen}> +
                 <SheetContent side="left"> contenant SheetHeader,
                 SheetTitle et NavGroup récursif. Filtrage :
                 canSee(item, platformRole) importé depuis navTypes.ts.
                 Anonyme (null) : seuls les items minPlatformRole: "user"
                 sont visibles. superAdmin : tous.

ecosystem:       Layout = [
                   "@/app/blog/components/NotificationBell.tsx",
                   "@/app/globals.css",
                   "@/app/layout.tsx",
                   "@/components/layout/footer/Footer.tsx",
                   "@/components/layout/header/Header.tsx",
                   "@/components/layout/header/Logo.tsx",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/NavActiveLink.tsx",
                   "@/components/layout/header/UserMenu.tsx",
                   "@/components/layout/header/UserMenuInner.tsx",
                   "@/components/layout/header/nav/frontWorkSpace.ts",
                   "@/components/layout/header/navTypes.ts",
                   "@/components/ui/sheet.tsx",
                   "@/components/ui/sonner.tsx",
                   "@/components/ui/tooltip.tsx",
                   "@/config/navigation.ts",
                   "@/config/roles.ts",
                 ]

relatedFiles:    ["@/components/layout/header/Logo.tsx",
                  "@/components/layout/header/UserMenu.tsx",
                  "@/components/layout/header/nav/frontWorkSpace.ts",
                  "@/components/layout/header/navTypes.ts",
                  "@/components/ui/sheet.tsx",
                  "@/app/blog/components/NotificationBell.tsx",
                  "@/app/layout.tsx",
                  "@/config/roles.ts"]

imports:         ["react", "next/link", "lucide-react",
                  "@/components/ui/button",
                  "@/components/ui/sheet",
                  "@/components/layout/header/Logo",
                  "@/components/layout/header/UserMenu",
                  "@/components/layout/header/nav/frontWorkSpace",
                  "@/components/layout/header/navTypes",
                  "@/config/roles"]

exports:         ["default Header", "HeaderProps"]

useBy:           ["@/app/layout.tsx"]

userStories:     ["*en tant que développeur je veux un header avec un burger visible sur tous les écrans",
                  "*en tant que superAdmin je veux voir tous les items de navigation",
                  "*en tant qu'utilisateur je veux un menu burger à gauche du logo qui ouvre un drawer"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (drawerOpen) + interactions burger/drawer.

import { useMemo, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Logo from "@/components/layout/header/Logo";
import UserMenu from "@/components/layout/header/UserMenu";
import { mainNavData } from "@/components/layout/header/nav/frontWorkSpace";
import { canSee, type NavItem } from "@/components/layout/header/navTypes";
import type { PlatformRole } from "@/config/roles";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface HeaderProps {
  readonly notificationSlot?: React.ReactNode;
  readonly platformRole: PlatformRole | null;
}

/* ------------------------------------------------------------------ */
/*  Groupe récursif (rendu dans le Sheet)                              */
/* ------------------------------------------------------------------ */

interface NavGroupProps {
  readonly item: NavItem;
  readonly platformRole: PlatformRole | null;
  readonly onNavigate: () => void;
  readonly depth: number;
}

function NavGroup({
  item,
  platformRole,
  onNavigate,
  depth,
}: NavGroupProps) {
  const children = (item.children ?? [])
    .filter((child) => canSee(child, platformRole))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (children.length === 0) return null;

  const indent = { paddingLeft: `${0.75 + depth * 0.75}rem` };

  return (
    <div className="flex flex-col">
      <span
        className="py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
        style={indent}
      >
        {item.label}
      </span>
      <ul className="flex flex-col gap-0.5">
        {children.map((child) => {
          const hasChildren = (child.children?.length ?? 0) > 0;
          return (
            <li key={child.id}>
              {child.href ? (
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  target={child.external ? "_blank" : undefined}
                  rel={child.external ? "noopener noreferrer" : undefined}
                  className="flex flex-col gap-0.5 rounded-md py-2 pr-3 text-sm transition-colors hover:bg-muted"
                  style={indent}
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
                <span
                  className="block py-2 pr-3 text-sm text-muted-foreground"
                  style={indent}
                >
                  {child.label}
                </span>
              )}

              {hasChildren && (
                <NavGroup
                  item={child}
                  platformRole={platformRole}
                  onNavigate={onNavigate}
                  depth={depth + 1}
                />
              )}
            </li>
          );
        })}
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => setDrawerOpen((v) => !v);
  const closeDrawer = () => setDrawerOpen(false);

  const sortedItems = useMemo(
    () =>
      [...mainNavData]
        .filter((item) => canSee(item, platformRole))
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [platformRole],
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
          {/* ===================== ZONE GAUCHE ===================== */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Burger — TOUJOURS visible (mobile + desktop). */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label={drawerOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={drawerOpen}
              aria-controls="main-drawer"
              onClick={toggleDrawer}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </Button>

            <div className="flex min-w-0 shrink-0 items-center">
              <Logo />
            </div>
          </div>

          {/* ===================== ZONE DROITE ===================== */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {notificationSlot}
            <UserMenu />
          </div>
        </div>
      </header>

      {/* ===================== DRAWER GAUCHE ==================== */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" id="main-drawer">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>

          <nav
            aria-label="Navigation principale"
            className="flex-1 overflow-y-auto px-3 py-4"
          >
            <ul className="flex flex-col gap-1">
              {sortedItems.map((item) => (
                <li key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={closeDrawer}
                      className="flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <NavGroup
                      item={item}
                      platformRole={platformRole}
                      onNavigate={closeDrawer}
                      depth={0}
                    />
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}