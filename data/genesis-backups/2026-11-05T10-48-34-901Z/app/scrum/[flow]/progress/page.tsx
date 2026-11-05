/*
path :           app/scrum/[flow]/progress/page.tsx
tag :            ["scrum", "progress", "suivi", "page", "phase-3"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page de SUIVI des user stories et des tasks d'un flux
                 Scrum. C'est ici que l'on voit l'avancement : quelles US
                 sont en cours, quelles US sont terminées, quelles tasks
                 restent à faire. Cette page est AMENÉE À LIRE
                 majoritairement (le suivi ne mute rien lui-même — les
                 mutations restent dans les pages CRUD dédiées).

                 Phase 1 (cette livraison) : squelette + lecture brute
                 (nombre de US, nombre de tasks, tasks par statut,
                 répartition des tasks par US). AUCUN calcul métier
                 (pas de « US finie », pas de « vélocité », pas de
                 burndown). Un bloc « À venir — Phase 3 » liste les
                 features prévues.

                 PHASE 3 (à venir) : suivi réel.
                 - CALCUL AUTOMATIQUE « US terminée » : une US est
                   considérée terminée quand toutes ses tasks sont done.
                   Calculé à la volée (PAS de champ `status` sur
                   UserStory — décision actée : si un jour on veut le
                   stocker, on fera la modification Prisma + Zod
                   ad hoc).
                 - Vue par statut (todo / in_progress / done) des US et
                   des tasks.
                 - Répartition des tasks par US (barre de progression
                   par US).
                 - Filtres : par sprint, par epic, par assigné.
                 - Tri : par statut, par nombre de tasks restantes.

                 Le hub existant /scrum/[flow]/page.tsx reste INCHANGÉ.
                 Cette page est un onglet séparé de ScrumNav.

flow:            Server Component sync → <Suspense fallback=<ProgressSkeleton />> →
                 <ProgressSection params /> async → await params →
                 validation isScrumFlow → Promise.all([listUserStories,
                 listTasks, listSprints]) → calcule des COMPTES BRUTS
                 (tasks par statut, US avec/sans tasks, US par nombre
                 de tasks done) → rend un header + 3 cartes compteurs +
                 un tableau brut des tasks par US + un bloc « À venir —
                 Phase 3 ». Aucun calcul métier de « US finie », aucune
                 mutation.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/progress/page.tsx",
                   "@/app/scrum/components/ScrumNav.tsx",
                   "@/app/scrum/lib/services/sprint.ts",
                   "@/app/scrum/lib/services/task.ts",
                   "@/app/scrum/lib/services/user-story.ts",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/services/user-story.ts",
                  "@/app/scrum/lib/services/task.ts",
                  "@/app/scrum/lib/services/sprint.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation", "lucide-react",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/user-story",
                  "@/app/scrum/lib/services/task",
                  "@/app/scrum/lib/services/sprint",
                  "@/components/ui/skeleton"]

exports:         ["default ProgressPage"]

useBy:           []

userStories:     ["*en tant que développeur je veux suivre les US et les tasks d'un flux Scrum",
                  "*en tant que product owner je veux voir quelles US sont terminées automatiquement"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ListChecks, ListTodo, TrendingUp } from "lucide-react";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listUserStories } from "@/app/scrum/lib/services/user-story";
import { listTasks } from "@/app/scrum/lib/services/task";
import { listSprints } from "@/app/scrum/lib/services/sprint";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PageParams = Promise<{ flow: string }>;

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
/*  Page (sync)                                                        */
/* ------------------------------------------------------------------ */

export default function ProgressPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<ProgressSkeleton />}>
      <ProgressSection params={params} />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Section async                                                      */
/* ------------------------------------------------------------------ */

async function ProgressSection({ params }: { readonly params: PageParams }) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const [userStories, tasks, sprints] = await Promise.all([
    listUserStories(flow),
    listTasks(flow),
    listSprints(flow),
  ]);

  /* Comptes bruts (PHASE 1) — aucun calcul métier. */
  const tasksTodo = tasks.filter((t) => t.status === "todo").length;
  const tasksInProgress = tasks.filter((t) => t.status === "in_progress").length;
  const tasksDone = tasks.filter((t) => t.status === "done").length;

  const usAvecTasks = userStories.filter((us) =>
    tasks.some((t) => t.storyId === us.id),
  ).length;
  const usSansTasks = userStories.length - usAvecTasks;

  /* PHASE 3 : ce compteur sera remplacé par le vrai calcul « US finie »
     = toutes les tasks de l'US sont done. Pour l'instant, on expose
     seulement les comptes bruts ci-dessus. */

  return (
    <div className="space-y-10">
      {/* En-tête */}
      <header className="space-y-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-chart-2">
          <TrendingUp className="size-3.5" aria-hidden />
          Progress
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Progress — {FLOW_LABEL[flow]}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Suivez l&apos;avancement des US et des tasks. Le calcul
          automatique « US terminée » sera branché en Phase 3.
        </p>
      </header>

      {/* Cartes tasks par statut */}
      <section aria-labelledby="tasks-status-title" className="space-y-4">
        <h2
          id="tasks-status-title"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          Tasks par statut
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              À faire
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
              {tasksTodo}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-3">
              En cours
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-chart-3">
              {tasksInProgress}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-4">
              Terminées
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-chart-4">
              {tasksDone}
            </p>
          </div>
        </div>
      </section>

      {/* US avec / sans tasks */}
      <section aria-labelledby="us-tasks-title" className="space-y-4">
        <h2
          id="us-tasks-title"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          User stories
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-chart-2/15 text-chart-2">
              <ListTodo className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {usAvecTasks}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                US avec au moins 1 task
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-chart-5/15 text-chart-5">
              <ListChecks className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {usSansTasks}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                US sans aucune task
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contexte (lecture brute) */}
      <section
        aria-labelledby="context-title"
        className="space-y-2 rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
      >
        <h2
          id="context-title"
          className="text-sm font-bold tracking-tight text-foreground"
        >
          Contexte
        </h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            • {userStories.length} US réparties sur {sprints.length} sprint
            {sprints.length > 1 ? "s" : ""}.
          </li>
          <li>
            • {tasks.length} tasks au total, dont {tasksDone} terminée
            {tasksDone > 1 ? "s" : ""}.
          </li>
          <li>
            • Calcul automatique « US terminée » et filtres par sprint/epic à
            venir en Phase 3.
          </li>
        </ul>
      </section>

      {/* À venir */}
      <section aria-labelledby="upcoming-title" className="space-y-4">
        <h2
          id="upcoming-title"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          À venir — Phase 3
        </h2>
        <ul className="space-y-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5 text-sm text-muted-foreground">
          <li>
            • Calcul automatique « US terminée » : toutes les tasks de l&apos;US
            sont done (calculé à la volée, pas de champ `status` en base).
          </li>
          <li>• Vue par statut des US et des tasks.</li>
          <li>• Barre de progression par US (tasks done / total tasks).</li>
          <li>• Filtres : par sprint, par epic, par assigné.</li>
          <li>• Tri : par statut, par nombre de tasks restantes.</li>
        </ul>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function ProgressSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}