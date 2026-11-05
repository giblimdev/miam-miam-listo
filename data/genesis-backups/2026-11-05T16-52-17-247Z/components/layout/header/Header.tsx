/*
path :           components/layout/header/Header.tsx
tag :            ["layout", "header", "navigation", "sheet", "drawer", "ui", "platform-role", "recursive", "production"]
projectId:       miam-miam-listo
type :           component
generic:         false

role:            En-tête global niveau production. Composant CLIENT
                 (useState pour le drawer, usePathname pour l'état actif
                 des liens). Reçoit en props :
                 - `notificationSlot` : Server Component async (la
                   cloche) monté sous Suspense par app/layout.tsx.
                 - `platformRole` : rôle plateforme de l'utilisateur
                   courant (null = anonyme), calculé côté serveur par
                   app/layout.tsx.
                 Le Header ne lit PAS la session (interdit côté client) :
                 tout vient du layout serveur.

                 INSPIRATION UBER EATS (stratégie A) : le bouton burger
                 est TOUJOURS visible (mobile ET desktop), placé À GAUCHE
                 du logo. Il ouvre un DRAWER latéral gauche qui contient
                 la navigation complète (récursive, N niveaux) avec :
                 - icônes par item racine ;
                 - lien actif surligné (usePathname) ;
                 - sections séparées pour les groupes ;
                 - footer avec CTA et mention MVP.
                 Le drawer est la SEULE source de navigation sur tous les
                 écrans. Le header reste sticky en haut.

                 AMÉLIORATIONS PRODUCTION :
                 - Burger avec icône qui tourne légèrement au survol.
                 - Logo centré visuellement (flex-1 sur la zone gauche).
                 - Actions à droite (cloche + UserMenu) alignées.
                 - Drawer avec hiérarchie visuelle claire : item racine
                   (icône + label + chevron), sous-groupe indenté.
                 - État actif piloté par usePathname (préfixe match).
                 - Footer drawer : lien "Aide" + mention MVP.
                 - Aucune duplication de logique (canSee partagé).

                 ROUTES STATIQUES : le projet n'a qu'un seul flux Scrum
                 (scrum-business). Les hrefs Scrum sont écrits en dur
                 dans frontWorkSpace.ts. Ce composant N'UTILISE PAS
                 useParams() — évite l'erreur « Blocking Route » de
                 Next.js 16.

flow:            Client Component → useState(drawerOpen) +
                 usePathname → useMemo (sortedItems : filtre canSee +
                 tri) → rend <header> sticky → zone gauche (burger +
                 Logo) → zone droite (notificationSlot + UserMenu) →
                 <Sheet open={drawerOpen}> + <SheetContent side="left">
                 avec SheetHeader (titre + description), nav (items
                 racine + NavGroup récursif avec état actif),
                 SheetFooter (CTA). Filtrage : canSee(item,
                 platformRole). Anonyme (null) : seuls les items
                 minPlatformRole: "user" sont visibles. superAdmin :
                 tous.

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

imports:         ["react", "next/link", "next/navigation", "lucide-react",
                  "@/components/ui/button",
                  "@/components/ui/sheet",
                  "@/components/layout/header/Logo",
                  "@/components/layout/header/UserMenu",
                  "@/components/layout/header/nav/frontWorkSpace",
                  "@/components/layout/header/navTypes",
                  "@/config/roles"]

exports:         ["default Header", "HeaderProps"]

useBy:           ["@/app/layout.tsx"]

userStories:     ["*en tant que développeur je veux un header professionnel avec burger visible sur tous les écrans",
                  "*en tant que superAdmin je veux voir tous les items de navigation",
                  "*en tant qu'utilisateur je veux un drawer clair, animé et accessible"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, usePathname, interactions burger/drawer.

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  CircleHelp,
  Home,
  Menu,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
/*  Icônes par item racine (fallback : Sparkles)                       */
/* ------------------------------------------------------------------ */

const ROOT_ICONS: Record<string, LucideIcon> = {
  "nav-home": Home,
  "nav-client": Store,
  "nav-admin": ShieldCheck,
  "nav-super-admin": Users,
  "nav-scrum": Sparkles,
  "nav-genesis": Wrench,
  "nav-help": CircleHelp,
};

/* ------------------------------------------------------------------ */
/*  Helper : état actif                                                */
/* ------------------------------------------------------------------ */

function isActivePath(pathname: string, href: string | undefined): boolean {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ------------------------------------------------------------------ */
/*  Groupe récursif (rendu dans le Sheet)                              */
/* ------------------------------------------------------------------ */

interface NavGroupProps {
  readonly item: NavItem;
  readonly platformRole: PlatformRole | null;
  readonly onNavigate: () => void;
  readonly depth: number;
  readonly pathname: string;
}

function NavGroup({
  item,
  platformRole,
  onNavigate,
  depth,
  pathname,
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
          const active = isActivePath(pathname, child.href);
          return (
            <li key={child.id}>
              {child.href ? (
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  target={child.external ? "_blank" : undefined}
                  rel={child.external ? "noopener noreferrer" : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col gap-0.5 rounded-md py-2 pr-3 text-sm transition-colors ${
                    active
                      ? "bg-chart-1/10 text-chart-1"
                      : "hover:bg-muted"
                  }`}
                  style={indent}
                >
                  <span className="font-medium">{child.label}</span>
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
                  pathname={pathname}
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
  const pathname = usePathname();

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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 transition-transform hover:rotate-90"
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
            <SheetDescription>
              Miam-miam Listo · MVP
            </SheetDescription>
          </SheetHeader>

          <nav
            aria-label="Navigation principale"
            className="flex-1 overflow-y-auto px-3 py-4"
          >
            <ul className="flex flex-col gap-1">
              {sortedItems.map((item) => {
                const Icon = ROOT_ICONS[item.id] ?? Sparkles;
                const active = isActivePath(pathname, item.href);

                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={closeDrawer}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          active
                            ? "bg-chart-1/10 text-chart-1"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        <span className="flex-1">{item.label}</span>
                        {active && (
                          <span
                            aria-hidden
                            className="size-1.5 rounded-full bg-chart-1"
                          />
                        )}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground">
                        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight
                          className="size-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      </div>
                    )}

                    {/* Sous-groupes éventuels */}
                    {(item.children?.length ?? 0) > 0 && (
                      <NavGroup
                        item={item}
                        platformRole={platformRole}
                        onNavigate={closeDrawer}
                        depth={0}
                        pathname={pathname}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <SheetFooter>
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              Miam-miam Listo · MVP
              <br />
              © {new Date().getFullYear()} — Tous droits réservés
            </p>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}