/*
path :           components/layout/header/MainNav.tsx
tag :            ["layout", "header", "nav", "platform-role", "rbac"]
projectId:       new-genesis
type :           component
generic:         true

role:            Navigation principale desktop. Reçoit les items + le
                 rôle plateforme (PlatformRole) de l'utilisateur courant
                 par props. Filtre les items ET leurs enfants selon
                 `visible` ET `minPlatformRole` (un item avec
                 minPlatformRole: "dev" n'est rendu que si le rôle
                 plateforme de l'utilisateur a un rang ≥ dev, donc dev
                 ou superAdmin). La lecture de usePathname() est isolée
                 dans NavActiveLink (sous Suspense) — obligatoire avec
                 Cache Components sur les routes dynamiques, sinon le
                 prérendu bloque.

                 canSee est importé depuis navTypes.ts (source unique de
                 vérité, partagée avec Header.tsx) — plus de duplication
                 locale qui causait des incohérences desktop/mobile.

flow:            Client Component → useMemo(filtre + tri des items
                 selon platformRole via canSee) → NavItemRow (statique)
                 → chaque lien sous <Suspense><NavActiveLink /></Suspense>
                 pour l'état actif ; sous-menu si children, enfants
                 filtrés via canSee. Anonyme (platformRole null) : seuls
                 les items minPlatformRole: "user" sont visibles.
                 superAdmin : tous les items.

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
// "use client" justifié : useMemo + interactions au survol/clavier.

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";

import {
  canSee,
  type NavItem,
} from "@/components/layout/header/navTypes";
import { NavActiveLink } from "@/components/layout/header/NavActiveLink";
import type { PlatformRole } from "@/config/roles";

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
  return (
    <Link
      href={child.href!}
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
/*  Sous-menu (statique — chaque lien actif sous Suspense)             */
/* ------------------------------------------------------------------ */

interface ChildrenListProps {
  readonly children: readonly NavItem[];
}

function ChildrenList({ children }: ChildrenListProps) {
  return (
    <ul
      role="menu"
      className="invisible absolute left-0 top-full z-50 mt-1 min-w-[220px] translate-y-1 rounded-lg border border-border bg-popover p-1.5 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
    >
      {children.map((child) => (
        <li key={child.id} role="none">
          {child.href ? (
            <Suspense fallback={<NeutralSubLink child={child} />}>
              <NavActiveLink
                href={child.href}
                external={child.external}
                classNameInactive={SUB_LINK_INACTIVE}
                classNameActive={SUB_LINK_ACTIVE}
                role="menuitem"
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
              </NavActiveLink>
            </Suspense>
          ) : (
            <span className="block rounded-md px-2.5 py-2 text-sm text-muted-foreground">
              {child.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Ligne d'item (statique + slot Suspense pour le point actif)        */
/* ------------------------------------------------------------------ */

interface NavItemRowProps {
  readonly item: NavItem;
  readonly platformRole: PlatformRole | null;
}

function NavItemRow({ item, platformRole }: NavItemRowProps) {
  const sortedChildren = useMemo(() => {
    if (!item.children) return [];
    return [...item.children]
      .filter((child) => canSee(child, platformRole))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [item.children, platformRole]);

  const hasChildren = sortedChildren.length > 0;

  return (
    <li className={hasChildren ? "group relative" : "relative"}>
      {item.href ? (
        <Suspense fallback={<NeutralLink item={item} />}>
          <NavActiveLink
            href={item.href}
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
                className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:rotate-180"
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
        >
          {item.label}
          {hasChildren && (
            <ChevronDown
              className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:rotate-180"
              aria-hidden
            />
          )}
        </button>
      )}

      {hasChildren && <ChildrenList children={sortedChildren} />}
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