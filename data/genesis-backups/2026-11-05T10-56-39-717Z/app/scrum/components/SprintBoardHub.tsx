/*
path :           app/scrum/components/SprintBoardHub.tsx
tag :            ["scrum", "sprint", "board", "hub", "ui"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Page hub du board US ↔ Sprint. Liste les sprints du
                 flux sous forme de cartes cliquables. Chaque carte
                 mène vers l'éditeur DnD existant du sprint
                 (/scrum/{flow}/sprint/{sprintId}/edit), qui contient
                 le board Backlog ↔ Sprint (SprintStoriesBoard). Ce
                 composant ne fait AUCUN DnD lui-même : il ne fait
                 que router l'utilisateur vers le bon sprint.

flow:            Reçoit flow + sprints (server) → rend un header +
                 une grille de cartes. Chaque carte = <Link> vers
                 /scrum/${flow}/sprint/${sprint.id}/edit. Si aucun
                 sprint : état vide avec CTA vers /sprint.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/sprint/board/page.tsx",
                   "@/app/scrum/components/SprintBoardHub.tsx",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/[flow]/sprint/board/page.tsx",
                  "@/app/scrum/lib/types.ts"]

imports:         ["next/link", "lucide-react",
                  "@/app/scrum/lib/types"]

exports:         ["SprintBoardHub", "SprintBoardHubProps"]

useBy:           ["@/app/scrum/[flow]/sprint/board/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux choisir un sprint pour associer des US"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import Link from "next/link";
import { ArrowRight, Calendar, Rocket } from "lucide-react";

import type { ScrumFlow, Sprint } from "@/app/scrum/lib/types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface SprintBoardHubProps {
  readonly flow: ScrumFlow;
  readonly sprints: readonly Sprint[];
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function SprintBoardHub({ flow, sprints }: SprintBoardHubProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-chart-1">
          <Rocket className="size-3.5" aria-hidden />
          Board US ↔ Sprint
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Choisir un sprint
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Sélectionnez le sprint dont vous voulez organiser les user
          stories. Le glisser-déposer Backlog ↔ Sprint est disponible
          dans l&apos;éditeur du sprint.
        </p>
      </header>

      {sprints.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-chart-1/10 text-chart-1">
            <Rocket className="size-6" aria-hidden />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            Aucun sprint pour l&apos;instant
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Créez d&apos;abord un sprint pour pouvoir y associer des user
            stories.
          </p>
          <Link
            href={`/scrum/${flow}/sprint`}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Créer un sprint
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sprints.map((sprint) => (
            <Link
              key={sprint.id}
              href={`/scrum/${flow}/sprint/${sprint.id}/edit`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 opacity-70"
                style={{
                  background:
                    "linear-gradient(90deg, var(--chart-1), transparent)",
                }}
              />
              <header className="mb-3 flex items-start gap-3">
                <div
                  className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-md"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--chart-1), color-mix(in oklab, var(--chart-1) 60%, black))",
                  }}
                >
                  <Rocket className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-bold text-foreground">
                    {sprint.name}
                  </h2>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-1">
                    {sprint.storyIds.length} US
                  </p>
                </div>
              </header>

              <p className="mb-3 line-clamp-2 text-sm text-foreground/80">
                {sprint.goal}
              </p>

              {(sprint.startDate || sprint.endDate) && (
                <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="size-3.5" aria-hidden />
                  {sprint.startDate ?? "?"} → {sprint.endDate ?? "?"}
                </p>
              )}

              <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-chart-1">
                Ouvrir le board
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}