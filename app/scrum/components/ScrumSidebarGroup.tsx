/*
path :           app/scrum/components/ScrumSidebarGroup.tsx
tag :            ["scrum", "nav", "sidebar", "group", "ui", "collapse"]
projectId:       <à fournir>
type:            component
generic:         true

role:            Groupe repliable de la sidebar Scrum. Affiche un titre
                 de groupe (majuscules) et ses entrées sous forme de
                 liens. Le groupe est replié par défaut sur mobile
                 (écran < md) et déplié sur desktop, pour éviter un
                 scroll vertical excessif sur petit écran. L'état
                 `open` est mémorisé par `groupId` dans le
                 localStorage : au retour sur la page, le groupe
                 retrouve son état.

                 Le composant est purement présentationnel : il reçoit
                 les entrées déjà résolues (href construit par le
                 parent) et remonte les clics via onClick pour que le
                 parent ferme la sheet mobile.

                 Utilise l'élément natif <details> plutôt que le
                 composant Collapsible de @/components/ui/collapsible
                 pour deux raisons :
                 1) <details> fonctionne sans JS (fallback SSR).
                 2) Pas de dépendance à un contexte React pour l'état
                    ouvert/fermé — le parent peut quand même piloter
                    via l'attribut `open`.
                 L'animation d'ouverture est gérée en CSS pur via
                 data-[state] sur le <details>, sans JS.

flow:            Client Component → useState(open) initialisé depuis
                 localStorage[`scrum-nav-group:${groupId}`] (fallback :
                 false sur mobile, true sur desktop) → rend
                 <details open={open}> avec un <summary> cliquable
                 (toggle) + <ul> des liens → onClick d'un lien :
                 persiste l'état + remonte au parent pour fermer la
                 sheet mobile.

ecosystem:       Scrum = [
                   "@/app/scrum/components/ScrumSidebar.tsx",
                   "@/app/scrum/components/ScrumSidebarGroup.tsx",
                   "@/app/scrum/lib/navigation.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/navigation.ts",
                  "@/app/scrum/components/ScrumSidebar.tsx",
                  "@/components/ui/button.tsx"]

imports:         ["react", "next/link", "lucide-react",
                  "@/app/scrum/lib/navigation",
                  "@/components/ui/button"]

exports:         ["ScrumSidebarGroup", "ScrumSidebarGroupProps"]

useBy:           ["@/app/scrum/components/ScrumSidebar.tsx"]

userStories:     ["*en tant qu'utilisateur je veux replier/déplier les groupes de la sidebar"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (open), useEffect (localStorage), onClick.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import type { NavEntry } from "@/app/scrum/lib/navigation";
import { buttonVariants } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ScrumSidebarGroupProps {
  readonly groupId: string;
  readonly label: string;
  readonly entries: readonly NavEntry[];
  /** Préfixe d'URL (`/scrum/${flow}`) — construit par le parent. */
  readonly base: string;
  /** Pathname courant — pour l'état actif. */
  readonly pathname: string;
  /** Callback déclenché au clic d'un lien (ferme la sheet mobile). */
  readonly onNavigate?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STORAGE_PREFIX = "scrum-nav-group:";

function isHrefActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function ScrumSidebarGroup({
  groupId,
  label,
  entries,
  base,
  pathname,
  onNavigate,
}: ScrumSidebarGroupProps) {
  const [open, setOpen] = useState<boolean>(false);

  /* Initialise l'état depuis localStorage (fallback : false sur mobile,
     true sur desktop). On lit après le mount pour éviter le mismatch
     d'hydratation. */
  useEffect(() => {
    const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${groupId}`);
    if (stored === "true") {
      setOpen(true);
    } else if (stored === "false") {
      setOpen(false);
    } else {
      /* Fallback : ouvert sur desktop (≥ md), fermé sur mobile. */
      setOpen(window.matchMedia("(min-width: 768px)").matches);
    }
  }, [groupId]);

  function toggle(next: boolean) {
    setOpen(next);
    window.localStorage.setItem(`${STORAGE_PREFIX}${groupId}`, String(next));
  }

  return (
    <details
      open={open}
      onToggle={(event) => {
        const isOpen = (event.currentTarget as HTMLDetailsElement).open;
        toggle(isOpen);
      }}
      className="group/group"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDown
          className="size-3.5 shrink-0 transition-transform group-open/group:rotate-180"
          aria-hidden
        />
      </summary>

      <ul className="mt-1 flex flex-col gap-0.5">
        {entries.map((entry) => {
          const href = `${base}/${entry.slug}`;
          const active = isHrefActive(pathname, href);
          const Icon = entry.icon;

          return (
            <li key={entry.slug}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={entry.description}
                className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-chart-1/10 font-semibold text-chart-1"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                }`}
                style={
                  {
                    "--accent": `var(--${entry.accent})`,
                  } as React.CSSProperties
                }
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-md ${
                    active
                      ? "bg-chart-1/15 text-chart-1"
                      : "bg-muted/60 text-muted-foreground"
                  }`}
                >
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate">{entry.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}