/*
path :           app/scrum/[flow]/page.tsx
tag :            ["flow", "overview", "scrum"]
projectId:       new-genesis
type:            page
generic:         false

role:            Vue d'ensemble d'un flux Scrum. Affiche les compteurs de chaque
                 section (idées, features, personas, epics, user stories, sprints,
                 tasks) sous forme de cartes cliquables menant à la section
                 correspondante. Le composant page est synchrone et monte un
                 Suspense ; la lecture des données et la validation du flow sont
                 isolées dans un composant async. Le préfixe d'URL est
                 `/core/${flow}` (source de vérité unique : ScrumNav et le layout
                 du flow utilisent le même préfixe ; il n'existe PAS de route
                 /core/help/[flow]).

flow:            Server Component sync → <Suspense fallback=<OverviewSkeleton />> →
                 <FlowOverview params={params} /> async → await params → validation
                 → getGlobalJson(flow) → calcule les compteurs → rend les cartes
                 pointant vers `/core/${flow}/${section.slug}`.

ecosystem:       Help = [
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
                   "@/app/scrum/layout.tsx",
                   "@/app/scrum/page.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/scrum/services/global-json.ts",
                  "@/app/scrum/lib/scrum/types.ts",
                  "@/app/scrum/components/ScrumNav.tsx",
                  "@/app/scrum/[flow]/layout.tsx"]

imports:         ["react", "next/link", "next/navigation", "lucide-react",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib//services/global-json",
                  "@/components/ui/skeleton"]

exports:         ["default FlowOverviewPage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux une vue d'ensemble des sections Scrum"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Lightbulb,
  Sparkles,
  Users,
  Layers,
  ListChecks,
  Rocket,
  ListTodo, // ← AJOUT
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

import {
  SCRUM_FLOWS,
  type ScrumDocument,
  type ScrumFlow,
} from "@/app/scrum/lib/types";
import { getGlobalJson } from "@/app/scrum/lib/services/global-json";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PageParams = Promise<{ flow: string }>;

interface SectionEntry {
  readonly slug: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly accent: string;
  readonly key: keyof Pick<
    ScrumDocument,
    "idea" | "feature" | "persona" | "epic" | "userStory" | "sprint" | "task" // ← AJOUT
  >;
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const SECTIONS: readonly SectionEntry[] = [
  {
    slug: "idee",
    label: "Idées",
    icon: Lightbulb,
    accent: "chart-1",
    key: "idea",
  },
  {
    slug: "feature",
    label: "Features",
    icon: Sparkles,
    accent: "chart-2",
    key: "feature",
  },
  {
    slug: "persona",
    label: "Personas",
    icon: Users,
    accent: "chart-3",
    key: "persona",
  },
  {
    slug: "epic",
    label: "Epics",
    icon: Layers,
    accent: "chart-4",
    key: "epic",
  },
  {
    slug: "user-story",
    label: "User stories",
    icon: ListChecks,
    accent: "chart-5",
    key: "userStory",
  },
  {
    slug: "sprint",
    label: "Sprints",
    icon: Rocket,
    accent: "chart-1",
    key: "sprint",
  },
  {
    slug: "task",
    label: "Tasks",
    icon: ListTodo,
    accent: "chart-2",
    key: "task",
  }, // ← AJOUT
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

/* ------------------------------------------------------------------ */
/*  Page (sync)                                                        */
/* ------------------------------------------------------------------ */

export default function FlowOverviewPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <FlowOverview params={params} />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Section async                                                      */
/* ------------------------------------------------------------------ */

async function FlowOverview({ params }: { readonly params: PageParams }) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const doc = await getGlobalJson(flow);

  // Préfixe de route unique pour tout le flux : identique à ScrumNav
  // (cf. @/app/core/components/scrum/ScrumNav.tsx) et au layout du flow.
  const base = `/core/${flow}`;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Vue d&apos;ensemble
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dernière modification :{" "}
          {new Date(doc.meta.updatedAt).toLocaleString("fr-FR")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const count = doc[section.key].length;

          return (
            <Link
              key={section.slug}
              href={`${base}/${section.slug}`}
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={
                {
                  "--accent": `var(--${section.accent})`,
                } as React.CSSProperties
              }
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 opacity-70"
                style={{
                  background: `linear-gradient(90deg, var(--${section.accent}), transparent)`,
                }}
              />

              <div
                className="grid size-12 shrink-0 place-items-center rounded-xl text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, var(--${section.accent}), color-mix(in oklab, var(--${section.accent}) 60%, black))`,
                }}
              >
                <Icon className="size-6" aria-hidden />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-3xl font-bold tabular-nums text-foreground">
                  {count}
                </p>
                <p className="text-sm font-medium text-muted-foreground">
                  {section.label}
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 7 }).map((_, i) => (
          // ← MODIFIÉ (6 → 7)
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
