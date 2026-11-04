/*
path :           app/scrum/components/ScrumNav.tsx
tag :            ["scrum", "nav", "ui"]
projectId:       new-genesis
type:            component
generic:         false

role:            Navigation entre les 8 sections d'un flux Scrum. Affiche des
                 onglets (Idée, Feature, Persona, Epic, User story, Sprint,
                 Task, Global JSON) et met en évidence la section active selon
                 le pathname. Le préfixe d'URL est `/scrum/${flow}` — aligné
                 sur le layout et la page vue d'ensemble du flow.

flow:            Client Component → usePathname → détecte la section active →
                 rend une liste de liens (Next/Link) avec styles conditionnels.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/epic/page.tsx",
                   "@/app/scrum/[flow]/feature/page.tsx",
                   "@/app/scrum/[flow]/global-json/page.tsx",
                   "@/app/scrum/[flow]/idee/page.tsx",
                   "@/app/scrum/[flow]/layout.tsx",
                   "@/app/scrum/[flow]/page.tsx",
                   "@/app/scrum/[flow]/persona/page.tsx",
                   "@/app/scrum/[flow]/sprint/page.tsx",
                   "@/app/scrum/[flow]/task/page.tsx",
                   "@/app/scrum/[flow]/user-story/page.tsx",
                   "@/app/scrum/components/EpicCard.tsx",
                   "@/app/scrum/components/EpicForm.tsx",
                   "@/app/scrum/components/EpicList.tsx",
                   "@/app/scrum/components/FeatureCard.tsx",
                   "@/app/scrum/components/FeatureForm.tsx",
                   "@/app/scrum/components/FeatureList.tsx",
                   "@/app/scrum/components/FlowSelector.tsx",
                   "@/app/scrum/components/GlobalJsonExport.tsx",
                   "@/app/scrum/components/IdeeCard.tsx",
                   "@/app/scrum/components/IdeeDetailDialog.tsx",
                   "@/app/scrum/components/IdeeForm.tsx",
                   "@/app/scrum/components/IdeeList.tsx",
                   "@/app/scrum/components/PersonaCard.tsx",
                   "@/app/scrum/components/PersonaForm.tsx",
                   "@/app/scrum/components/PersonaList.tsx",
                   "@/app/scrum/components/ScrumNav.tsx",
                   "@/app/scrum/components/SortableItem.tsx",
                   "@/app/scrum/components/SortableList.tsx",
                   "@/app/scrum/components/SprintCard.tsx",
                   "@/app/scrum/components/SprintEditor.tsx",
                   "@/app/scrum/components/SprintForm.tsx",
                   "@/app/scrum/components/SprintList.tsx",
                   "@/app/scrum/components/SprintStoriesBoard.tsx",
                   "@/app/scrum/components/TaskCard.tsx",
                   "@/app/scrum/components/TaskForm.tsx",
                   "@/app/scrum/components/TaskList.tsx",
                   "@/app/scrum/components/UserStoryCard.tsx",
                   "@/app/scrum/components/UserStoryForm.tsx",
                   "@/app/scrum/components/UserStoryList.tsx",
                   "@/app/scrum/components/UserStoryMiniCard.tsx",
                   "@/app/scrum/layout.tsx",
                   "@/app/scrum/page.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/types.ts",
                  "@/app/scrum/[flow]/layout.tsx"]

imports:         ["next/link", "next/navigation",
                  "@/app/scrum/lib/types"]

exports:         ["ScrumNav", "ScrumNavProps"]

useBy:           ["@/app/scrum/[flow]/layout.tsx"]

userStories:     ["*en tant qu'utilisateur je veux naviguer entre les sections Scrum"]
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
  { slug: "task", label: "Task" },
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
  /* ✅ Préfixe aligné sur le layout et la page vue d'ensemble : /scrum/${flow} */
  const base = `/scrum/${flow}`;

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