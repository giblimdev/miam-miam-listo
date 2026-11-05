/*
path :           components/layout/header/MainNav.tsx
tag :            ["layout", "header", "nav", "platform-role", "rbac", "recursive", "hover", "dynamic-href"]
projectId:       new-genesis
type :           component
generic:         true

role:            Navigation principale desktop. Reçoit les items (déjà
                 filtrés et résolus au 1er niveau par Header) + le rôle
                 plateforme (PlatformRole) de l'utilisateur courant + les
                 params de la route courante (lus par Header via
                 useParams). Filtre les items ET leurs enfants (récursif)
                 selon `visible` ET `minPlatformRole`.

                 RÉSOLUTION DES HREFS DYNAMIQUES : ne résout PLUS au
                 niveau racine (Header le fait déjà). Résout à la volée
                 dans ChildrenListItem et NavItemRow, AU MOMENT de
                 passer le href à <NavActiveLink>, pour couvrir TOUTES
                 les profondeurs (racine, enfants, sous-enfants). Sans
                 cela, next/link lève l'erreur « Dynamic href
                 /scrum/[flow]/roadmap found in <Link> while using the
                 /app router, this is not supported ».

                 OUVERTURE AU SURVOL UNIQUEMENT : chaque item avec
                 children gère son propre état `open` via useState
                 (false par défaut). Le sous-menu n'est RENDU DANS LE
                 DOM que si `open === true` — pas de opacity-0, pas de
                 data-open, pas de classe conditionnelle fragile. Si
                 `open` est false, le <ul> n'existe pas : il ne peut
                 pas être visible.

                 canSee et resolveHrefString sont importés depuis
                 navTypes.ts (source unique de vérité, partagée avec
                 Header.tsx).

flow:            Client Component → reçoit items (déjà filtrés/résolus
                 au 1er niveau) + platformRole + params → useMemo(filtre
                 via canSee + tri) → NavItemRow (state local `open`) →
                 wrapper <li onMouseEnter/onMouseLeave/onFocus/onBlur>
                 → bouton/lien + sous-menu conditionnel
                 ({open && <ChildrenList …/>}). ChildrenList et
                 ChildrenListItem reçoivent `params` et résolvent
                 child.href via resolveHrefString AU MOMENT du rendu
                 du <NavActiveLink>. Anonyme (platformRole null) :
                 seuls les items minPlatformRole: "user" sont visibles.
                 superAdmin : tous.

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

relatedFiles:    ["@/components/layout/header/navTypes.ts",
                  "@/components/layout/header/NavActiveLink.tsx",
                  "@/components/layout/header/Header.tsx",
                  "@/config/navigation.ts",
                  "@/config/roles.ts"]

imports:         ["react", "next/link", "lucide-react",
                  "@/components/layout/header/navTypes",
                  "@/components/layout/header/NavActiveLink",
                  "@/config/roles"]

exports:         ["default MainNav", "MainNavProps"]

useBy:           ["@/components/layout/header/Header.tsx"]

userStories:     ["*en tant que développeur je veux une nav desktop paramétrable par rôle plateforme",
                  "*en tant que superAdmin je veux voir tous les items de navigation",
                  "*en tant que développeur je veux résoudre les hrefs dynamiques [flow] à toutes les profondeurs"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (open par item) + useMemo + interactions.

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

import {
  canSee,
  resolveHrefString,
  type NavItem,
} from "@/components/layout/header/navTypes";
import { NavActiveLink } from "@/components/layout/header/NavActiveLink";
import type { PlatformRole } from "@/config/roles";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RouteParams = Readonly<Record<string, string | undefined>>;

/* ------------------------------------------------------------------ */
/*  Helpers de style                                                   */
/* ------------------------------------------------------------------ */

const LINK_BASE =
  "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const LINK_INACTIVE = `${LINK_BASE} text-muted-foreground hover:bg-muted hover:text-foreground`;

const LINK_ACTIVE = `${LINK_BASE} bg-primary/10 text-primary`;

const SUB_LINK_BASE =
  "flex items-start gap-2 rounded-md px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const SUB_LINK_INACTIVE = `${SUB_LINK_BASE} text-foreground hover:bg-muted`;

const SUB_LINK_ACTIVE = `${SUB_LINK_BASE} bg-primary/10 text-primary`;

/* ------------------------------------------------------------------ */
/*  Fallback : lien neutre (prérendu)                                  */
/* ------------------------------------------------------------------ */

function NeutralLink({
  item,
  params,
}: {
  readonly item: NavItem;
  readonly params: RouteParams;
}) {
  if (!item.href) {
    return (
      <button type="button" className={LINK_INACTIVE} disabled={item.disabled}>
        {item.label}
      </button>
    );
  }
  const href = resolveHrefString(item.href, params) ?? item.href;
  return (
    <Link
      href={href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
      className={LINK_INACTIVE}
    >
      {item.label}
      {item.external && (
        <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
      )}
    </Link>
  );
}

function NeutralSubLink({
  child,
  params,
}: {
  readonly child: NavItem;
  readonly params: RouteParams;
}) {
  const href = child.href
    ? (resolveHrefString(child.href, params) ?? child.href)
    : "#";
  return (
    <Link
      href={href}
      target={child.external ? "_blank" : undefined}
      rel={child.external ? "noopener noreferrer" : undefined}
      className={SUB_LINK_INACTIVE}
    >
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="font-medium">{child.label}</span>
        {child.description && (
          <span className="text-xs text-muted-foreground">
            {child.description}
          </span>
        )}
      </span>
      {child.external && (
        <ExternalLink
          className="mt-0.5 h-3 w-3 shrink-0 opacity-60"
          aria-hidden
        />
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Sous-menu récursif (N niveaux) — rendu conditionnel                */
/* ------------------------------------------------------------------ */

interface ChildrenListProps {
  readonly children: readonly NavItem[];
  readonly platformRole: PlatformRole | null;
  readonly params: RouteParams;
  /** Profondeur (0 = premier sous-menu, 1 = sous-sous-menu, …). */
  readonly depth: number;
}

function ChildrenList({
  children,
  platformRole,
  params,
  depth,
}: ChildrenListProps) {
  const sorted = useMemo(
    () =>
      [...children]
        .filter((child) => canSee(child, platformRole))
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [children, platformRole],
  );

  if (sorted.length === 0) return null;

  /* Premier niveau : sous le parent (left-0 top-full).
     Niveaux suivants : à droite du parent (left-full top-0). */
  const positionClass =
    depth === 0 ? "left-0 top-full mt-1" : "left-full top-0 ml-1";

  return (
    <ul
      role="menu"
      className={`absolute z-50 min-w-[220px] rounded-lg border border-border bg-popover p-1.5 shadow-lg ${positionClass}`}
    >
      {sorted.map((child) => (
        <li key={child.id} role="none">
          <ChildrenListItem
            child={child}
            platformRole={platformRole}
            params={params}
            depth={depth}
          />
        </li>
      ))}
    </ul>
  );
}

interface ChildrenListItemProps {
  readonly child: NavItem;
  readonly platformRole: PlatformRole | null;
  readonly params: RouteParams;
  readonly depth: number;
}

function ChildrenListItem({
  child,
  platformRole,
  params,
  depth,
}: ChildrenListItemProps) {
  const hasChildren = (child.children?.length ?? 0) > 0;
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Nettoyage du timer au démontage. */
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  }

  /* Résolution AU DERNIER MOMENT, quelle que soit la profondeur. */
  const resolvedHref = child.href
    ? (resolveHrefString(child.href, params) ?? child.href)
    : undefined;

  const content = (
    <>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="font-medium">{child.label}</span>
        {child.description && (
          <span className="text-xs text-muted-foreground">
            {child.description}
          </span>
        )}
      </span>
      {child.external && (
        <ExternalLink
          className="mt-0.5 h-3 w-3 shrink-0 opacity-60"
          aria-hidden
        />
      )}
      {hasChildren && (
        <ChevronRight
          className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60"
          aria-hidden
        />
      )}
    </>
  );

  return (
    <div
      className="relative"
      onMouseEnter={hasChildren ? cancelClose : undefined}
      onMouseLeave={hasChildren ? scheduleClose : undefined}
      onFocus={hasChildren ? cancelClose : undefined}
      onBlur={hasChildren ? scheduleClose : undefined}
    >
      {resolvedHref ? (
        <Suspense
          fallback={<NeutralSubLink child={child} params={params} />}
        >
          <NavActiveLink
            href={resolvedHref}
            external={child.external}
            classNameInactive={SUB_LINK_INACTIVE}
            classNameActive={SUB_LINK_ACTIVE}
            role="menuitem"
          >
            {content}
          </NavActiveLink>
        </Suspense>
      ) : (
        <span className="flex items-start gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground">
          {content}
        </span>
      )}

      {/* Sous-sous-menu : rendu UNIQUEMENT si open === true. */}
      {hasChildren && open && child.children && (
        <ChildrenList
          children={child.children}
          platformRole={platformRole}
          params={params}
          depth={depth + 1}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ligne d'item (state open par item racine)                          */
/* ------------------------------------------------------------------ */

interface NavItemRowProps {
  readonly item: NavItem;
  readonly platformRole: PlatformRole | null;
  readonly params: RouteParams;
}

function NavItemRow({ item, platformRole, params }: NavItemRowProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortedChildren = useMemo(() => {
    if (!item.children) return [];
    return [...item.children]
      .filter((child) => canSee(child, platformRole))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [item.children, platformRole]);

  const hasChildren = sortedChildren.length > 0;

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  }

  /* Résolution AU DERNIER MOMENT (niveau racine). */
  const resolvedHref = item.href
    ? (resolveHrefString(item.href, params) ?? item.href)
    : undefined;

  return (
    <li
      className="relative"
      onMouseEnter={hasChildren ? cancelClose : undefined}
      onMouseLeave={hasChildren ? scheduleClose : undefined}
      onFocus={hasChildren ? cancelClose : undefined}
      onBlur={hasChildren ? scheduleClose : undefined}
    >
      {resolvedHref ? (
        <Suspense fallback={<NeutralLink item={item} params={params} />}>
          <NavActiveLink
            href={resolvedHref}
            external={item.external}
            classNameInactive={LINK_INACTIVE}
            classNameActive={LINK_ACTIVE}
          >
            {item.label}
            {item.external && (
              <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
            )}
            {hasChildren && (
              <ChevronDown
                className={`h-3.5 w-3.5 opacity-60 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            )}
          </NavActiveLink>
        </Suspense>
      ) : (
        <button
          type="button"
          className={LINK_INACTIVE}
          disabled={item.disabled}
          aria-haspopup={hasChildren ? "menu" : undefined}
          aria-expanded={hasChildren ? open : undefined}
        >
          {item.label}
          {hasChildren && (
            <ChevronDown
              className={`h-3.5 w-3.5 opacity-60 transition-transform ${
                open ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          )}
        </button>
      )}

      {/* Sous-menu de premier niveau : rendu UNIQUEMENT si open === true. */}
      {hasChildren && open && (
        <ChildrenList
          children={sortedChildren}
          platformRole={platformRole}
          params={params}
          depth={0}
        />
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Composant principal                                                */
/* ------------------------------------------------------------------ */

export type MainNavProps = {
  /** Items à afficher. Obligatoire : la source est décidée par l'appelant. */
  readonly items: readonly NavItem[];
  /**
   * Rôle plateforme de l'utilisateur courant (null = anonyme).
   * Filtrage via canSee (hiérarchie superAdmin > dev > admin > user).
   */
  readonly platformRole?: PlatformRole | null;
  /**
   * Params de la route courante (lus par Header via useParams). Sert
   * UNIQUEMENT à résoudre les hrefs contenant un segment dynamique
   * `[flow]` au moment du rendu du <NavActiveLink>.
   */
  readonly params: RouteParams;
};

export default function MainNav({
  items,
  platformRole,
  params,
}: MainNavProps) {
  const sortedItems = useMemo(
    () =>
      [...items]
        .filter((item) => canSee(item, platformRole ?? null))
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [items, platformRole],
  );

  return (
    <nav aria-label="Navigation principale" className="hidden md:block">
      <ul className="flex items-center gap-0.5">
        {sortedItems.map((item) => (
          <NavItemRow
            key={item.id}
            item={item}
            platformRole={platformRole ?? null}
            params={params}
          />
        ))}
      </ul>
    </nav>
  );
}