/*
path :           app/scrum/components/ScrumNav.tsx
tag :            ["scrum", "nav", "ui", "dashboard", "roadmap", "progress", "board"]
projectId :      <à fournir>
type:            component
generic:         false

role:            Navigation entre les sections d'un flux Scrum. Affiche
                 des onglets regroupés en TROIS familles visuelles :

                 1. SECTIONS  — pipeline CRUD du flux : Idée, Feature,
                    Persona, Epic, User story, Sprint, Task.
                 2. BOARDS    — pages d'association par glisser-déposer :
                    Epic ↔ US (epic/board), Task ↔ US (task/board),
                    US ↔ Sprint (sprint/board, page hub qui mène vers
                    l'éditeur DnD du sprint).
                 3. DASHBOARD — vues de synthèse / suivi : Tableau de
                    bord, Roadmap, Progress.

                 « Vue d'ensemble » (accueil du flux) et « Global JSON »
                 (export) encadrent les trois familles : ce sont des
                 pages transverses, pas des sections métier.

                 Le préfixe d'URL est `/scrum/${flow}` — aligné sur le
                 layout et les pages du flux. Chaque famille est séparée
                 par un trait vertical fin pour matérialiser les groupes.

flow:            Client Component → usePathname → détecte la section
                 active → rend une liste de liens (Next/Link) avec styles
                 conditionnels. Aucun état, aucun effet de bord.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/dashboard/page.tsx",
                   "@/app/scrum/[flow]/epic/board/page.tsx",
                   "@/app/scrum/[flow]/epic/page.tsx",
                   "@/app/scrum/[flow]/feature/page.tsx",
                   "@/app/scrum/[flow]/global-json/page.tsx",
                   "@/app/scrum/[flow]/idee/page.tsx",
                   "@/app/scrum/[flow]/layout.tsx",
                   "@/app/scrum/[flow]/page.tsx",
                   "@/app/scrum/[flow]/persona/page.tsx",
                   "@/app/scrum/[flow]/progress/page.tsx",
                   "@/app/scrum/[flow]/roadmap/page.tsx",
                   "@/app/scrum/[flow]/sprint/board/page.tsx",
                   "@/app/scrum/[flow]/sprint/page.tsx",
                   "@/app/scrum/[flow]/task/board/page.tsx",
                   "@/app/scrum/[flow]/task/page.tsx",
                   "@/app/scrum/[flow]/user-story/page.tsx",
                   "@/app/scrum/components/ScrumNav.tsx",
                   "@/app/scrum/layout.tsx",
                   "@/app/scrum/page.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/types.ts",
                  "@/app/scrum/[flow]/layout.tsx"]

imports:         ["next/link", "next/navigation",
                  "@/app/scrum/lib/types"]

exports:         ["ScrumNav", "ScrumNavProps"]

useBy:           ["@/app/scrum/[flow]/layout.tsx"]

userStories:     ["*en tant qu'utilisateur je veux naviguer entre les sections Scrum",
                  "*en tant qu'utilisateur je veux accéder aux boards d'association",
                  "*en tant qu'utilisateur je veux accéder au tableau de bord, à la roadmap et au suivi"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true 
*/

"use client";
// "use client" justifié : usePathname pour l'état actif.

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { ScrumFlow } from "@/app/scrum/lib/types";

/* ------------------------------------------------------------------ */
/*  Config — trois familles + pages transverses                        */
/* ------------------------------------------------------------------ */

interface NavEntry {
  readonly slug: string;
  readonly label: string;
}

/** 1. Pipeline CRUD du flux Scrum (dans l'ordre logique). */
const SECTIONS: readonly NavEntry[] = [
  { slug: "idee", label: "Idée" },
  { slug: "feature", label: "Feature" },
  { slug: "persona", label: "Persona" },
  { slug: "epic", label: "Epic" },
  { slug: "user-story", label: "User story" },
  { slug: "sprint", label: "Sprint" },
  { slug: "task", label: "Task" },
];

/**
 * 2. Pages d'association par glisser-déposer.
 * - epic/board   : UserStoryBoard (US ↔ Epic)
 * - task/board   : TaskBoard (Task ↔ US)
 * - sprint/board : page hub qui liste les sprints et mène vers
 *                  l'éditeur DnD US ↔ Sprint (SprintStoriesBoard).
 */
const BOARDS: readonly NavEntry[] = [
  { slug: "epic/board", label: "Epic ↔ US" },
  { slug: "task/board", label: "Task ↔ US" },
  { slug: "sprint/board", label: "US ↔ Sprint" },
];

/** 3. Vues de synthèse et de suivi (phases 2, 3, 4). */
const DASHBOARD: readonly NavEntry[] = [
  { slug: "dashboard", label: "Tableau de bord" },
  { slug: "roadmap", label: "Roadmap" },
  { slug: "progress", label: "Progress" },
];

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ScrumNavProps {
  readonly flow: ScrumFlow;
}

/* ------------------------------------------------------------------ */
/*  Sous-composants                                                    */
/* ------------------------------------------------------------------ */

function NavLink({
  href,
  label,
  isActive,
}: {
  readonly href: string;
  readonly label: string;
  readonly isActive: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-chart-1/10 text-chart-1"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    </li>
  );
}

function GroupSeparator() {
  return <li aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border/60" />;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function ScrumNav({ flow }: ScrumNavProps) {
  const pathname = usePathname();
  const base = `/scrum/${flow}`;

  const isActive = (href: string): boolean =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Navigation des sections Scrum"
      className="overflow-x-auto border-b border-border/60 pb-px"
    >
      <ul className="flex min-w-max items-center gap-1">
        {/* Vue d'ensemble (transverse, en tête) */}
        <NavLink
          href={base}
          label="Vue d'ensemble"
          isActive={pathname === base}
        />

        <GroupSeparator />

        {/* 1. SECTIONS — pipeline CRUD */}
        {SECTIONS.map((section) => {
          const href = `${base}/${section.slug}`;
          return (
            <NavLink
              key={section.slug}
              href={href}
              label={section.label}
              isActive={isActive(href)}
            />
          );
        })}

        <GroupSeparator />

        {/* 2. BOARDS — associations DnD */}
        {BOARDS.map((board) => {
          const href = `${base}/${board.slug}`;
          return (
            <NavLink
              key={board.slug}
              href={href}
              label={board.label}
              isActive={isActive(href)}
            />
          );
        })}

        <GroupSeparator />

        {/* 3. DASHBOARD — synthèse et suivi */}
        {DASHBOARD.map((view) => {
          const href = `${base}/${view.slug}`;
          return (
            <NavLink
              key={view.slug}
              href={href}
              label={view.label}
              isActive={isActive(href)}
            />
          );
        })}

        <GroupSeparator />

        {/* Global JSON (transverse, en pied) */}
        <NavLink
          href={`${base}/global-json`}
          label="Global JSON"
          isActive={isActive(`${base}/global-json`)}
        />
      </ul>
    </nav>
  );
}
