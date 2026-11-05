/*
path :           components/layout/header/Header.tsx
tag :            ["layout", "header", "navigation", "slot", "ui", "platform-role", "recursive", "dynamic-href"]
projectId:       new-genesis
type :           component
generic:         false

role:            En-tête global. Composant CLIENT (useState pour le
                 menu mobile). Reçoit en props :
                 - `notificationSlot` : Server Component async (la
                   cloche) monté sous Suspense par app/layout.tsx.
                 - `platformRole` : rôle plateforme de l'utilisateur
                   courant (null = anonyme), calculé côté serveur par
                   app/layout.tsx.
                 Le Header ne lit PAS la session (interdit côté client) :
                 tout vient du layout serveur.

                 RÉSOLUTION DES HREFS DYNAMIQUES : lit les params de la
                 route courante via useParams() et les transmet :
                 - à MainNav via la prop `params`
                 - à MobileGroup via la prop `params`
                 Chaque consommateur appelle resolveHrefString AU
                 DERNIER MOMENT sur le href, à la profondeur où il se
                 trouve. Sans cela, next/link lève l'erreur « Dynamic
                 href /scrum/[flow]/roadmap found in <Link> while using
                 the /app router, this is not supported ».

                 Le menu mobile est RÉCURSIF : chaque groupe
                 (item avec children) affiche ses enfants, et chaque
                 enfant qui a lui-même des children ouvre un sous-groupe
                 indenté (pl-6, pl-9, …). Supporte N niveaux.

flow:            Client Component → useState(mobileOpen) → useParams()
                 → useMemo(sortedItems : filtre canSee + tri) → rend
                 <header> sticky → zone gauche (Logo + MainNav avec
                 items + platformRole + params) + zone droite
                 (notificationSlot + UserMenu + burger mobile) → panneau
                 mobile conditionnel (MobileGroup avec params). Filtrage :
                 canSee(item, platformRole) importé depuis navTypes.ts.
                 Anonyme (null) : seuls les items minPlatformRole:
                 "user" sont visibles. superAdmin : tous.

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

imports:         ["react", "next/link", "next/navigation", "lucide-react",
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
                  "*en tant que superAdmin je veux voir tous les items de navigation",
                  "*en tant que développeur je veux résoudre les hrefs dynamiques [flow] à toutes les profondeurs",
                  "us5100001"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (mobileOpen) + useParams + interactions burger.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import Logo from "@/components/layout/header/Logo";
import MainNav from "@/components/layout/header/MainNav";
import UserMenu from "@/components/layout/header/UserMenu";
import { mainNavData } from "@/components/layout/header/nav/frontWorkSpace";
import {
  canSee,
  resolveHrefString,
  type NavItem,
} from "@/components/layout/header/navTypes";
import type { PlatformRole } from "@/config/roles";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RouteParams = Readonly<Record<string, string | undefined>>;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface HeaderProps {
  /**
   * Slot optionnel rendu côté serveur (Server Component async) — par
   * exemple <NotificationBell />. Monté sous Suspense par app/layout.tsx.
   */
  readonly notificationSlot?: React.ReactNode;
  /**
   * Rôle plateforme de l'utilisateur courant (null = anonyme).
   * Calculé côté serveur par app/layout.tsx.
   */
  readonly platformRole: PlatformRole | null;
}

/* ------------------------------------------------------------------ */
/*  Groupe mobile récursif                                             */
/* ------------------------------------------------------------------ */

interface MobileGroupProps {
  readonly item: NavItem;
  readonly platformRole: PlatformRole | null;
  readonly params: RouteParams;
  readonly onNavigate: () => void;
  /** Profondeur d'indentation (0 = premier niveau). */
  readonly depth: number;
}

function MobileGroup({
  item,
  platformRole,
  params,
  onNavigate,
  depth,
}: MobileGroupProps) {
  const children = (item.children ?? [])
    .filter((child) => canSee(child, platformRole))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  /* Si aucun enfant visible, ne rien rendre (évite les en-têtes vides). */
  if (children.length === 0) return null;

  /* Indentation progressive : depth 0 → pl-3, depth 1 → pl-6, depth 2 → pl-9. */
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
          const resolvedChildHref = child.href
            ? (resolveHrefString(child.href, params) ?? child.href)
            : undefined;
          return (
            <li key={child.id}>
              {resolvedChildHref ? (
                <Link
                  href={resolvedChildHref}
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
                <MobileGroup
                  item={child}
                  platformRole={platformRole}
                  params={params}
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
  const [mobileOpen, setMobileOpen] = useState(false);

  /*
   * Params de la route courante. Sert UNIQUEMENT à résoudre les hrefs
   * contenant un segment dynamique `[flow]` — sinon next/link lève
   * l'erreur « Dynamic href … found in <Link> while using the /app
   * router, this is not supported ». useParams() côté client donne la
   * valeur réelle (ex. "scrum-app") à substituer.
   *
   * Les params sont transmis tels quels à MainNav et MobileGroup, qui
   * résolvent les hrefs au dernier moment (à la profondeur où ils se
   * trouvent). Cela évite de traverser récursivement l'arbre deux fois
   * et garantit qu'aucun href dynamique ne parvient à <Link>.
   */
  const params = useParams<{ flow?: string }>();
  const routeParams: RouteParams = { flow: params?.flow };

  const toggleMobile = () => setMobileOpen((v) => !v);
  const closeMobile = () => setMobileOpen(false);

  const sortedItems = useMemo(
    () =>
      [...mainNavData]
        .filter((item) => canSee(item, platformRole))
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [platformRole],
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <MainNav
            items={sortedItems}
            platformRole={platformRole}
            params={routeParams}
          />
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
              {sortedItems.map((item) => {
                const resolvedHref = item.href
                  ? (resolveHrefString(item.href, routeParams) ?? item.href)
                  : undefined;
                return (
                  <li key={item.id}>
                    {resolvedHref ? (
                      <Link
                        href={resolvedHref}
                        onClick={closeMobile}
                        className="flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <MobileGroup
                        item={item}
                        platformRole={platformRole}
                        params={routeParams}
                        onNavigate={closeMobile}
                        depth={0}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
