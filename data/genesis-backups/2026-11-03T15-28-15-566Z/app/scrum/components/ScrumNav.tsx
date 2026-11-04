/*
path :           app/core/components/ScrumNav.tsx
tag :            ["scrum", "nav", "ui"]
projectId:       new-genesis
type:            component
generic:         false

role:            Navigation entre les 8 sections d'un flux Scrum. Affiche des
                 onglets (Idée, Feature, Persona, Epic, User story, Sprint,
                 Task, Global JSON) et met en évidence la section active selon
                 le pathname.

flow:            Client Component → usePathname → détecte la section active →
                 rend une liste de liens (Next/Link) avec styles conditionnels.

ecosystem:       ScrumUI = [
                   "@/app/core/components/scrum/EpicCard.tsx",
                   "@/app/core/components/scrum/EpicForm.tsx",
                   "@/app/core/components/scrum/EpicList.tsx",
                   "@/app/core/components/scrum/FeatureCard.tsx",
                   "@/app/core/components/scrum/FeatureForm.tsx",
                   "@/app/core/components/scrum/FeatureList.tsx",
                   "@/app/core/components/scrum/FlowSelector.tsx",
                   "@/app/core/components/scrum/GlobalJsonExport.tsx",
                   "@/app/core/components/scrum/IdeeCard.tsx",
                   "@/app/core/components/scrum/IdeeForm.tsx",
                   "@/app/core/components/scrum/IdeeList.tsx",
                   "@/app/core/components/scrum/PersonaCard.tsx",
                   "@/app/core/components/scrum/PersonaForm.tsx",
                   "@/app/core/components/scrum/PersonaList.tsx",
                   "@/app/core/components/scrum/ScrumNav.tsx",
                   "@/app/core/components/scrum/SortableItem.tsx",
                   "@/app/core/components/scrum/SortableList.tsx",
                   "@/app/core/components/scrum/SprintCard.tsx",
                   "@/app/core/components/scrum/SprintForm.tsx",
                   "@/app/core/components/scrum/SprintList.tsx",
                   "@/app/core/components/scrum/TaskCard.tsx",
                   "@/app/core/components/scrum/TaskForm.tsx",
                   "@/app/core/components/scrum/TaskList.tsx",
                   "@/app/core/components/scrum/UserStoryCard.tsx",
                   "@/app/core/components/scrum/UserStoryForm.tsx",
                   "@/app/core/components/scrum/UserStoryList.tsx",
                 ]

relatedFiles:    ["@/app/core/lib/scrum/types.ts",
                  "@/app/core/[flow]/layout.tsx"]

imports:         ["next/link", "next/navigation",
                  "@/app/core/lib/scrum/types"]

exports:         ["ScrumNav", "ScrumNavProps"]

useBy:           ["@/app/core/[flow]/layout.tsx"]

userStories:     ["*en tant qu'utilisateur je veux naviguer entre les sections Scrum"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : usePathname pour l'état actif.

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { ScrumFlow } from "@/app/scrum/lib/types";

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

interface NavEntry {
  readonly slug: string;
  readonly label: string;
}

const SECTIONS: readonly NavEntry[] = [
  { slug: "idee", label: "Idée" },
  { slug: "feature", label: "Feature" },
  { slug: "persona", label: "Persona" },
  { slug: "epic", label: "Epic" },
  { slug: "user-story", label: "User story" },
  { slug: "sprint", label: "Sprint" },
  { slug: "task", label: "Task" }, // ← AJOUT
  { slug: "global-json", label: "Global JSON" },
];

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ScrumNavProps {
  readonly flow: ScrumFlow;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function ScrumNav({ flow }: ScrumNavProps) {
  const pathname = usePathname();
  const base = `/core/${flow}`;

  return (
    <nav
      aria-label="Navigation des sections Scrum"
      className="overflow-x-auto border-b border-border/60 pb-px"
    >
      <ul className="flex min-w-max items-center gap-1">
        <li>
          <Link
            href={base}
            className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname === base
                ? "bg-chart-1/10 text-chart-1"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Vue d&apos;ensemble
          </Link>
        </li>

        {SECTIONS.map((section) => {
          const href = `${base}/${section.slug}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={section.slug}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-chart-1/10 text-chart-1"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
