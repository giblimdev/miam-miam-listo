/*
path :           components/layout/header/MainNav.tsx
tag :            ["layout", "header", "nav", "platform-role", "rbac", "recursive", "hover"]
projectId:       new-genesis
type :           component
generic:         true

role:            Navigation principale desktop. Reçoit les items (déjà
                 filtrés par Header) + le rôle plateforme (PlatformRole)
                 de l'utilisateur courant. Filtre les items ET leurs
                 enfants (récursif) selon `visible` ET `minPlatformRole`.

                 ROUTES STATIQUES : le projet n'a qu'un seul flux Scrum
                 (scrum-business). Les hrefs Scrum sont donc écrits en
                 dur dans frontWorkSpace.ts (/scrum/scrum-business/...),
                 SANS segment dynamique `[flow]`. Ce composant N'UTILISE
                 PLUS useParams() — évite l'erreur « Blocking Route »
                 de Next.js 16 (hook bloquant pour le prérendu).

                 Résolution défensive conservée via resolveHrefString
                 (utile si un jour un flux dynamique est ajouté) mais
                 appelée avec un objet params vide : aucun placeholder
                 n'est substitué, ce qui est le comportement voulu
                 aujourd'hui (les hrefs sont déjà concrets).

                 OUVERTURE AU SURVOL UNIQUEMENT : chaque item avec
                 children gère son propre état `open` via useState
                 (false par défaut). Le sous-menu n'est RENDU DANS LE
                 DOM que si `open === true`.

flow:            Client Component → reçoit items + platformRole →
                 useMemo(filtre via canSee + tri) → NavItemRow (state
                 local `open`) → wrapper <li onMouseEnter/onMouseLeave/
                 onFocus/onBlur> → bouton/lien + sous-menu conditionnel.
                 Anonyme (platformRole null) : seuls les items
                 minPlatformRole: "user" sont visibles. superAdmin : tous.

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
                  "*en tant que superAdmin je veux voir tous les items de navigation"]

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
  type RouteParams,
} from "@/components/layout/header/navTypes";
import { NavActiveLink } from "@/components/layout/header/NavActiveLink";
import type { PlatformRole } from "@/config/roles";

/* ------------------------------------------------------------------ */
/*  Constante : params vides (routes statiques)                        */
/* ------------------------------------------------------------------ */

/**
 * Le projet n'a qu'un flux Scrum (scrum-business) : les hrefs sont
 * statiques. On passe un objet vide pour que resolveHrefString ne
 * fasse aucune substitution (aucun placeholder à résoudre).
 */
const EMPTY_PARAMS: RouteParams = {};

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

function NeutralLink({ item }: { readonly item: NavItem }) {
  if (!item.href) {
    return (
      <button type="button" className={LINK_INACTIVE} disabled={item.disabled}>
        {item.label}
      </button>
    );
  }
  return (
    <Link
      href={item.href}
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

function NeutralSubLink({ child }: { readonly child: NavItem }) {
  if (!child.href) {
    return (
      <span className="flex items-start gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground">
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="font-medium">{child.label}</span>
          {child.description && (
            <span className="text-xs text-muted-foreground">
              {child.description}
            </span>
          )}
        </span>
      </span>
    );
  }
  return (
    <Link
      href={child.href}
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
  readonly depth: number;
}

function ChildrenList({ children, platformRole, depth }: ChildrenListProps) {
  const sorted = useMemo(
    () =>
      [...children]
        .filter((child) => canSee(child, platformRole))
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [children, platformRole],
  );

  if (sorted.length === 0) return null;

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
  readonly depth: number;
}

function ChildrenListItem({
  child,
  platformRole,
  depth,
}: ChildrenListItemProps) {
  const hasChildren = (child.children?.length ?? 0) > 0;
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /* Résolution défensive : les hrefs sont statiques aujourd'hui,
     donc resolveHrefString retourne child.href inchangé. */
  const resolvedHref = child.href
    ? (resolveHrefString(child.href, EMPTY_PARAMS) ?? child.href)
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
        <Suspense fallback={<NeutralSubLink child={child} />}>
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

      {hasChildren && open && child.children && (
        <ChildrenList
          children={child.children}
          platformRole={platformRole}
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
}

function NavItemRow({ item, platformRole }: NavItemRowProps) {
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

  const resolvedHref = item.href
    ? (resolveHrefString(item.href, EMPTY_PARAMS) ?? item.href)
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
        <Suspense fallback={<NeutralLink item={item} />}>
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

      {hasChildren && open && (
        <ChildrenList
          children={sortedChildren}
          platformRole={platformRole}
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
  readonly items: readonly NavItem[];
  readonly platformRole?: PlatformRole | null;
};

export default function MainNav({ items, platformRole }: MainNavProps) {
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
          />
        ))}
      </ul>
    </nav>
  );
}