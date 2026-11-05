/*
path :           app/scrum/lib/navigation.ts
tag :            ["scrum", "navigation", "config", "sidebar", "mono-flux"]
projectId:       <à fournir>
type:            config
generic:         true

role:            Source unique de vérité pour la navigation du module
                 Scrum. Décrit les QUATRE familles de la sidebar
                 (Pipeline, Boards, Pilotage, Outils) plus les deux
                 entrées transverses (Vue d'ensemble, Global JSON).
                 Chaque entrée porte un slug, un label et une icône
                 Lucide. Le préfixe d'URL est construit par le
                 consommateur (`/scrum/${flow}`), pas ici : ce module
                 ne connaît pas le flow, il ne décrit que la structure.

                 MONO-FLUX : un seul flux actif ("scrum-business").
                 Le menu est identique quel que soit le flow — c'est
                 pourquoi ce fichier est totalement découplé du flow.

flow:            Module TypeScript pur → export des types NavEntry,
                 NavGroup et de la constante SCRUM_NAV_GROUPS. Aucun
                 état, aucun effet, aucune dépendance runtime autre
                 que lucide-react (types d'icônes).

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
                   "@/app/scrum/[flow]/sprint/[sprintId]/edit/page.tsx",
                   "@/app/scrum/[flow]/sprint/board/page.tsx",
                   "@/app/scrum/[flow]/sprint/page.tsx",
                   "@/app/scrum/[flow]/task/board/page.tsx",
                   "@/app/scrum/[flow]/task/page.tsx",
                   "@/app/scrum/[flow]/user-story/page.tsx",
                   "@/app/scrum/components/ScrumNav.tsx",
                   "@/app/scrum/components/ScrumSidebar.tsx",
                   "@/app/scrum/components/ScrumSidebarGroup.tsx",
                   "@/app/scrum/components/SprintBoardHub.tsx",
                   "@/app/scrum/lib/navigation.ts",
                   "@/app/scrum/layout.tsx",
                   "@/app/scrum/page.tsx",
                 ]

relatedFiles:    ["@/app/scrum/components/ScrumSidebar.tsx",
                  "@/app/scrum/components/ScrumSidebarGroup.tsx"]

imports:         ["lucide-react"]

exports:         ["NavEntry", "NavGroup", "SCRUM_NAV_GROUPS"]

useBy:           ["@/app/scrum/components/ScrumSidebar.tsx",
                  "@/app/scrum/components/ScrumSidebarGroup.tsx"]

userStories:     ["*en tant que développeur je veux une source unique pour la navigation Scrum",
                  "*en tant qu'utilisateur je veux une navigation groupée par famille"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import {
  Layers,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  ListTodo,
  MapPin,
  Rocket,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface NavEntry {
  /** Slug utilisé pour construire l'URL : `${base}/${slug}`. */
  readonly slug: string;
  /** Libellé affiché dans la sidebar. */
  readonly label: string;
  /** Icône Lucide affichée à gauche du libellé. */
  readonly icon: LucideIcon;
  /** Couleur d'accent Tailwind (ex. "chart-1"). */
  readonly accent: string;
  /** Description courte (tooltip, aria-label). Optionnel. */
  readonly description?: string;
}

export interface NavGroup {
  /** Identifiant stable du groupe (clé React, persistance collapse). */
  readonly id: string;
  /** Titre du groupe affiché en majuscules. */
  readonly label: string;
  /** Entrées du groupe, dans l'ordre d'affichage. */
  readonly entries: readonly NavEntry[];
}

/* ------------------------------------------------------------------ */
/*  Config — quatre familles                                           */
/* ------------------------------------------------------------------ */

/**
 * Groupes de la sidebar Scrum. L'ordre des groupes et l'ordre des
 * entrées dans chaque groupe sont ceux du rendu — ne pas trier.
 *
 * Les slugs sont relatifs au flux : la sidebar construit
 * `href = /scrum/${flow}/${entry.slug}`.
 *
 * - Pipeline  : le flux CRUD séquentiel (Idée → Task).
 * - Boards    : les pages d'association par glisser-déposer.
 *               sprint/board est une page hub qui liste les sprints
 *               et mène vers l'éditeur DnD US ↔ Sprint.
 * - Pilotage  : les vues de synthèse et de suivi (phases 2-4).
 * - Outils    : l'export Global JSON (page technique).
 */
export const SCRUM_NAV_GROUPS: readonly NavGroup[] = [
  {
    id: "pipeline",
    label: "Pipeline",
    entries: [
      {
        slug: "idee",
        label: "Idée",
        icon: Lightbulb,
        accent: "chart-1",
        description: "Formuler le problème à résoudre.",
      },
      {
        slug: "feature",
        label: "Feature",
        icon: Sparkles,
        accent: "chart-2",
        description: "Explorer librement les solutions.",
      },
      {
        slug: "persona",
        label: "Persona",
        icon: Users,
        accent: "chart-3",
        description: "Valider les hypothèses utilisateurs.",
      },
      {
        slug: "epic",
        label: "Epic",
        icon: Layers,
        accent: "chart-4",
        description: "Regrouper les features en blocs cohérents.",
      },
      {
        slug: "user-story",
        label: "User story",
        icon: ListChecks,
        accent: "chart-5",
        description: "Découper les epics en incréments testables.",
      },
      {
        slug: "sprint",
        label: "Sprint",
        icon: Rocket,
        accent: "chart-1",
        description: "Décider quoi faire, quand et pourquoi.",
      },
      {
        slug: "task",
        label: "Task",
        icon: ListTodo,
        accent: "chart-2",
        description: "Découper les US en unités de travail.",
      },
    ],
  },
  {
    id: "boards",
    label: "Boards",
    entries: [
      {
        slug: "epic/board",
        label: "Epic ↔ US",
        icon: Workflow,
        accent: "chart-4",
        description: "Rattacher les user stories aux epics par DnD.",
      },
      {
        slug: "task/board",
        label: "Task ↔ US",
        icon: Workflow,
        accent: "chart-2",
        description: "Rattacher les tasks aux user stories par DnD.",
      },
      {
        slug: "sprint/board",
        label: "US ↔ Sprint",
        icon: Workflow,
        accent: "chart-1",
        description: "Organiser les US d'un sprint par DnD.",
      },
    ],
  },
  {
    id: "pilotage",
    label: "Pilotage",
    entries: [
      {
        slug: "dashboard",
        label: "Tableau de bord",
        icon: LayoutDashboard,
        accent: "chart-1",
        description: "Synthèse des indicateurs clés du flux.",
      },
      {
        slug: "roadmap",
        label: "Roadmap",
        icon: MapPin,
        accent: "chart-3",
        description: "Organiser les sprints et affecter les US.",
      },
      {
        slug: "progress",
        label: "Progress",
        icon: TrendingUp,
        accent: "chart-2",
        description: "Suivre l'avancement des US et des tasks.",
      },
    ],
  },
];