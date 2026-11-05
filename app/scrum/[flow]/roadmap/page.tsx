/*
path :           app/scrum/[flow]/roadmap/page.tsx
tag :            ["scrum", "roadmap", "sprints", "page", "phase-2", "mono-flux"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de GESTION et d'ORGANISATION des sprints d'un flux
                 Scrum. C'est ici que l'on ordonne les sprints, affecte
                 les US aux sprints, définit les dates, archive les
                 sprints terminés. Cette page est AMENÉE À ÉCRIRE (via
                 les actions existantes + futures actions d'archivage).

                 Phase 1 (cette livraison) : squelette + lecture brute
                 (nombre de sprints, nombre de sprints sans US, nombre de
                 US non affectées à un sprint, nombre d'US affectées).
                 Aucun calcul métier (pas de « sprint terminé », pas
                 d'archivage). Un bloc « À venir — Phase 2 » liste les
                 features prévues. Le CRUD sprints existant
                 (SprintList / SprintEditor) est branché tel quel pour
                 la création/édition/suppression, sans archivage.

                 MONO-FLUX : un seul flux actif ("scrum-business"). Le
                 FLOW_LABEL local (Record<ScrumFlow, string>) a été
                 SUPPRIMÉ — le titre affiche directement FLOW_TITLE.
                 isScrumFlow() reste utilisé pour valider params.flow.

                 PHASE 2 (à venir) : gestion réelle.
                 - CALCUL AUTOMATIQUE « sprint terminé » : un sprint est
                   considéré terminé quand toutes ses US ont toutes
                   leurs tasks done. Ce calcul sera exposé comme helper
                   partagé pour /dashboard.
                 - ARCHIVAGE des sprints terminés.
                 - Vue timeline des sprints (date début → date fin).
                 - Drag & drop US ↔ sprints (via les boards existants
                   de SprintEditor).
                 - Affectation en masse des US non affectées.

flow:            Server Component sync → <Suspense fallback=<RoadmapSkeleton />> →
                 <RoadmapSection params /> async → await params →
                 validation isScrumFlow → Promise.all([listSprints,
                 listUserStories]) → calcule des COMPTES BRUTS (length,
                 sprints sans US, US orphelines) → rend un header + 4
                 cartes compteurs + le CRUD existant <SprintList /> +
                 un bloc « À venir — Phase 2 ». Aucun calcul métier,
                 aucune mutation nouvelle.

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
                   "@/app/scrum/components/SprintBoardHub.tsx",
                   "@/app/scrum/layout.tsx",
                   "@/app/scrum/page.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/sprint.ts",
                  "@/app/scrum/lib/services/user-story.ts",
                  "@/app/scrum/lib/types.ts",
                  "@/app/scrum/components/SprintList.tsx"]

imports:         ["react", "next/navigation", "lucide-react",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/sprint",
                  "@/app/scrum/lib/services/user-story",
                  "@/app/scrum/components/SprintList",
                  "@/components/ui/skeleton"]

exports:         ["default RoadmapPage"]

useBy:           []

userStories:     ["*en tant que product owner je veux organiser les sprints et affecter les US",
                  "*en tant que développeur je veux archiver un sprint quand toutes ses US sont terminées"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { MapPin, Rocket, ListTodo, Inbox } from "lucide-react";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listSprints } from "@/app/scrum/lib/services/sprint";
import { listUserStories } from "@/app/scrum/lib/services/user-story";
import { SprintList } from "@/app/scrum/components/SprintList";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PageParams = Promise<{ flow: string }>;

interface CountCard {
  readonly label: string;
  readonly value: number;
  readonly icon: typeof MapPin;
  readonly accent: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

/**
 * Libellé affiché du flux. Un seul flux actif ("scrum-business").
 * Plus de Record<ScrumFlow, string> : le mapping est inutile avec un
 * seul élément.
 */
const FLOW_TITLE = "ScrumBusiness";

/* ------------------------------------------------------------------ */
/*  Page (sync)                                                        */
/* ------------------------------------------------------------------ */

export default function RoadmapPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<RoadmapSkeleton />}>
      <RoadmapSection params={params} />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Section async                                                      */
/* ------------------------------------------------------------------ */

async function RoadmapSection({ params }: { readonly params: PageParams }) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const [sprints, userStories] = await Promise.all([
    listSprints(flow),
    listUserStories(flow),
  ]);

  /* Comptes bruts (PHASE 1) — aucun calcul métier. */
  const totalSprints = sprints.length;
  const sprintsSansUs = sprints.filter((s) => s.storyIds.length === 0).length;
  const usAffectees = new Set(sprints.flatMap((s) => s.storyIds)).size;
  const usNonAffectees = userStories.filter(
    (us) => !sprints.some((s) => s.storyIds.includes(us.id)),
  ).length;

  const counts: readonly CountCard[] = [
    { label: "Sprints", value: totalSprints, icon: Rocket, accent: "chart-1" },
    {
      label: "Sprints sans US",
      value: sprintsSansUs,
      icon: Inbox,
      accent: "chart-3",
    },
    {
      label: "US affectées",
      value: usAffectees,
      icon: ListTodo,
      accent: "chart-2",
    },
    {
      label: "US non affectées",
      value: usNonAffectees,
      icon: MapPin,
      accent: "chart-5",
    },
  ];

  return (
    <div className="space-y-10">
      {/* En-tête */}
      <header className="space-y-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-chart-2">
          <MapPin className="size-3.5" aria-hidden />
          Roadmap
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Roadmap — {FLOW_TITLE}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Organisez vos sprints, affectez les US, définissez les dates.
          Le calcul automatique de fin de sprint et l&apos;archivage
          seront branchés en Phase 2.
        </p>
      </header>

      {/* Compteurs */}
      <section aria-labelledby="counts-title" className="space-y-4">
        <h2
          id="counts-title"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          Vue rapide
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {counts.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
                style={
                  { "--accent": `var(--${c.accent})` } as React.CSSProperties
                }
              >
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 opacity-70"
                  style={{
                    background: `linear-gradient(90deg, var(--${c.accent}), transparent)`,
                  }}
                />
                <div
                  className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-md"
                  style={{
                    background: `linear-gradient(135deg, var(--${c.accent}), color-mix(in oklab, var(--${c.accent}) 60%, black))`,
                  }}
                >
                  <Icon className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {c.value}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {c.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CRUD existant (PHASE 1 : tel quel, sans archivage) */}
      <section aria-labelledby="sprints-title" className="space-y-4">
        <h2
          id="sprints-title"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          Sprints
        </h2>
        {/* PHASE 2 : ce bloc sera enrichi avec la timeline, le calcul
            automatique de fin de sprint, l'archivage, et le drag & drop
            US ↔ sprints. Pour l'instant, on réutilise SprintList. */}
        <SprintList flow={flow} sprints={sprints} userStories={userStories} />
      </section>

      {/* À venir */}
      <section aria-labelledby="upcoming-title" className="space-y-4">
        <h2
          id="upcoming-title"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          À venir — Phase 2
        </h2>
        <ul className="space-y-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5 text-sm text-muted-foreground">
          <li>• Vue timeline des sprints (début → fin).</li>
          <li>
            • Calcul automatique « sprint terminé » (toutes les US ont toutes
            leurs tasks done).
          </li>
          <li>
            • Archivage des sprints terminés (soft-archive ou tableau dédié
            — décision Prisma à trancher).
          </li>
          <li>• Affectation en masse des US non affectées.</li>
          <li>• Drag &amp; drop US ↔ sprints.</li>
        </ul>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function RoadmapSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}