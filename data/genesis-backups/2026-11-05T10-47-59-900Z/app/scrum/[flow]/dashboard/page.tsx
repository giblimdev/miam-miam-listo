/*
path :           app/scrum/[flow]/dashboard/page.tsx
tag :            ["scrum", "dashboard", "synthesis", "page", "phase-4"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de SYNTHÈSE du flux Scrum. Agrège en une seule vue
                 les indicateurs clés produits par /roadmap (sprints) et
                 /progress (US/tasks). C'est un AGRÉGATEUR EN LECTURE
                 SEULE : elle ne calcule rien de métier elle-même, elle
                 consomme les compteurs bruts des services existants et
                 renvoie vers /roadmap et /progress pour le détail.

                 Phase 1 (cette livraison) : squelette + compteurs bruts
                 (nombre de sprints, US, tasks, epics, features,
                 personas, idées). Aucun calcul métier (pas de « sprint
                 terminé », pas de « US finie », pas de vélocité, pas de
                 burndown). Un bloc « À venir — Phase 4 » liste les
                 indicateurs qui seront branchés quand /roadmap et
                 /progress auront livré leurs features (vélocité,
                 burndown, alertes, top US bloquées).

                 PHASE 4 (à venir) : agrégation réelle.
                 - Consommera les helpers exposés par /roadmap
                   (sprintsTermines, sprintsArchives) et par /progress
                   (usTerminees, tasksParStatut).
                 - Ajoutera vélocité (points livrés / sprint), burndown
                   (ligne idéale vs réel), alertes (US sans epic, tasks
                   sans US, sprints sans US), top 5 US bloquées.
                 - Cartes cliquables renvoyant vers /roadmap ou
                   /progress selon l'indicateur.

                 Le hub existant /scrum/[flow]/page.tsx reste INCHANGÉ
                 (vue d'ensemble des 7 sections CRUD). Cette page est un
                 onglet séparé de ScrumNav.

flow:            Server Component sync → <Suspense fallback=<DashboardSkeleton />> →
                 <DashboardSection params /> async → await params →
                 validation isScrumFlow → Promise.all([listSprints,
                 listUserStories, listTasks, listEpics, listFeatures,
                 listPersonas, listIdees]) → calcule des COMPTES BRUTS
                 (length) → rend un header + une grille de 7 cartes
                 compteurs + un bloc « À venir — Phase 4 ». Aucun état,
                 aucun effet, aucune mutation.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/dashboard/page.tsx",
                   "@/app/scrum/components/ScrumNav.tsx",
                   "@/app/scrum/lib/services/epic.ts",
                   "@/app/scrum/lib/services/feature.ts",
                   "@/app/scrum/lib/services/idee.ts",
                   "@/app/scrum/lib/services/persona.ts",
                   "@/app/scrum/lib/services/sprint.ts",
                   "@/app/scrum/lib/services/task.ts",
                   "@/app/scrum/lib/services/user-story.ts",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/sprint.ts",
                  "@/app/scrum/lib/services/user-story.ts",
                  "@/app/scrum/lib/services/task.ts",
                  "@/app/scrum/lib/services/epic.ts",
                  "@/app/scrum/lib/services/feature.ts",
                  "@/app/scrum/lib/services/persona.ts",
                  "@/app/scrum/lib/services/idee.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/link", "next/navigation", "lucide-react",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/idee",
                  "@/app/scrum/lib/services/feature",
                  "@/app/scrum/lib/services/persona",
                  "@/app/scrum/lib/services/epic",
                  "@/app/scrum/lib/services/user-story",
                  "@/app/scrum/lib/services/sprint",
                  "@/app/scrum/lib/services/task",
                  "@/components/ui/skeleton"]

exports:         ["default DashboardPage"]

useBy:           []

userStories:     ["*en tant que développeur je veux une page de synthèse qui agrège roadmap et progress",
                  "*en tant que product owner je veux voir les indicateurs clés du flux en un écran"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Layers,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  ListTodo,
  Rocket,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listIdees } from "@/app/scrum/lib/services/idee";
import { listFeatures } from "@/app/scrum/lib/services/feature";
import { listPersonas } from "@/app/scrum/lib/services/persona";
import { listEpics } from "@/app/scrum/lib/services/epic";
import { listUserStories } from "@/app/scrum/lib/services/user-story";
import { listSprints } from "@/app/scrum/lib/services/sprint";
import { listTasks } from "@/app/scrum/lib/services/task";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PageParams = Promise<{ flow: string }>;

interface CounterCard {
  readonly slug: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly accent: string;
  readonly count: number;
  /** Cible du clic (renvoie vers la page CRUD ou vers /roadmap ou /progress). */
  readonly href: string;
}

interface UpcomingCard {
  readonly title: string;
  readonly description: string;
  readonly target: "roadmap" | "progress";
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

const FLOW_LABEL: Record<ScrumFlow, string> = {
  "scrum-business": "ScrumBusiness",
  "scrum-app": "ScrumApp",
  "scrum-genesis": "Scrum-Genesis",
};

/* ------------------------------------------------------------------ */
/*  Contenu « à venir » (Phase 4)                                      */
/* ------------------------------------------------------------------ */

const UPCOMING: readonly UpcomingCard[] = [
  {
    title: "Vélocité par sprint",
    description:
      "Points livrés vs points prévus, calculé à partir des US done par sprint (à brancher sur /roadmap).",
    target: "roadmap",
  },
  {
    title: "Burndown",
    description:
      "Ligne idéale vs réel sur la durée du sprint (à brancher sur /roadmap et /progress).",
    target: "roadmap",
  },
  {
    title: "US terminées",
    description:
      "Calcul automatique : une US est terminée quand toutes ses tasks sont done (à brancher sur /progress).",
    target: "progress",
  },
  {
    title: "Alertes",
    description:
      "US sans epic, tasks sans US, sprints sans US, US bloquées depuis > 3 jours.",
    target: "progress",
  },
];

/* ------------------------------------------------------------------ */
/*  Page (sync)                                                        */
/* ------------------------------------------------------------------ */

export default function DashboardPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardSection params={params} />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Section async                                                      */
/* ------------------------------------------------------------------ */

async function DashboardSection({ params }: { readonly params: PageParams }) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const [
    idees,
    features,
    personas,
    epics,
    userStories,
    sprints,
    tasks,
  ] = await Promise.all([
    listIdees(flow),
    listFeatures(flow),
    listPersonas(flow),
    listEpics(flow),
    listUserStories(flow),
    listSprints(flow),
    listTasks(flow),
  ]);

  const base = `/scrum/${flow}`;

  const counters: readonly CounterCard[] = [
    {
      slug: "idee",
      label: "Idées",
      icon: Lightbulb,
      accent: "chart-1",
      count: idees.length,
      href: `${base}/idee`,
    },
    {
      slug: "feature",
      label: "Features",
      icon: Sparkles,
      accent: "chart-2",
      count: features.length,
      href: `${base}/feature`,
    },
    {
      slug: "persona",
      label: "Personas",
      icon: Users,
      accent: "chart-3",
      count: personas.length,
      href: `${base}/persona`,
    },
    {
      slug: "epic",
      label: "Epics",
      icon: Layers,
      accent: "chart-4",
      count: epics.length,
      href: `${base}/epic`,
    },
    {
      slug: "user-story",
      label: "User stories",
      icon: ListChecks,
      accent: "chart-5",
      count: userStories.length,
      href: `${base}/user-story`,
    },
    {
      slug: "sprint",
      label: "Sprints",
      icon: Rocket,
      accent: "chart-1",
      count: sprints.length,
      href: `${base}/roadmap`,
    },
    {
      slug: "task",
      label: "Tasks",
      icon: ListTodo,
      accent: "chart-2",
      count: tasks.length,
      href: `${base}/progress`,
    },
  ];

  return (
    <div className="space-y-10">
      {/* En-tête */}
      <header className="space-y-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-chart-2">
          <LayoutDashboard className="size-3.5" aria-hidden />
          Synthèse
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Tableau de bord — {FLOW_LABEL[flow]}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Vue consolidée des indicateurs du flux. Pour le détail de la
          planification, voir <strong>Roadmap</strong> ; pour le suivi des
          US et des tasks, voir <strong>Progress</strong>.
        </p>
      </header>

      {/* Compteurs */}
      <section aria-labelledby="counters-title" className="space-y-4">
        <h2
          id="counters-title"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          Compteurs bruts
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {counters.map((counter) => {
            const Icon = counter.icon;
            return (
              <Link
                key={counter.slug}
                href={counter.href}
                className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={
                  {
                    "--accent": `var(--${counter.accent})`,
                  } as React.CSSProperties
                }
              >
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 opacity-70"
                  style={{
                    background: `linear-gradient(90deg, var(--${counter.accent}), transparent)`,
                  }}
                />
                <div
                  className="grid size-12 shrink-0 place-items-center rounded-xl text-white shadow-md"
                  style={{
                    background: `linear-gradient(135deg, var(--${counter.accent}), color-mix(in oklab, var(--${counter.accent}) 60%, black))`,
                  }}
                >
                  <Icon className="size-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-3xl font-bold tabular-nums text-foreground">
                    {counter.count}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {counter.label}
                  </p>
                </div>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* À venir */}
      <section aria-labelledby="upcoming-title" className="space-y-4">
        <h2
          id="upcoming-title"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          À venir — Phase 4
        </h2>
        <p className="text-sm text-muted-foreground">
          Les indicateurs suivants seront branchés sur cette page une fois
          les features de <strong>Roadmap</strong> et <strong>Progress</strong>{" "}
          livrées.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {UPCOMING.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5"
            >
              <h3 className="text-sm font-bold text-foreground">
                {card.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {card.description}
              </p>
              <Link
                href={`${base}/${card.target}`}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-chart-2 hover:underline"
              >
                Ouvrir {card.target === "roadmap" ? "Roadmap" : "Progress"}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}