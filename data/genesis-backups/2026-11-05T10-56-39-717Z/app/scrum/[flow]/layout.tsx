/*
path :           app/scrum/[flow]/layout.tsx
tag :            ["scrum", "layout", "flow", "mono-flux"]
projectId:       new-genesis
type:            layout
generic:         false

role:            Layout du flux Scrum. Le composant layout est synchrone
                 et monte un <Suspense> autour d'un composant async qui
                 lit params et valide le flow. ScrumNav est lui aussi
                 streamé sous Suspense car il utilise usePathname (Cache
                 Components).

                 MONO-FLUX : un seul flux actif ("scrum-business"). Le
                 FLOW_LABEL local (Record<ScrumFlow, string>) a été
                 SUPPRIMÉ — il n'y a plus qu'un seul libellé possible.
                 Le titre du header affiche directement "ScrumBusiness"
                 sans passer par un mapping. isScrumFlow() reste utilisé
                 pour valider params.flow (défense en profondeur : une
                 URL forgée /scrum/scrum-app/... tombe en notFound()).

flow:            Server Component sync → <Suspense fallback=<FlowShellFallback />> →
                 <FlowShell params={params} /> async → await params → validation
                 → rend header + ScrumNav (sous Suspense) + children.

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

relatedFiles:    ["@/app/scrum/lib/types.ts",
                  "@/app/scrum/components/ScrumNav.tsx"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/components/ScrumNav",
                  "@/components/ui/skeleton"]

exports:         ["default FlowLayout"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux naviguer entre les sections d'un flux"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { ScrumNav } from "@/app/scrum/components/ScrumNav";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LayoutParams = Promise<{ flow: string }>;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

/**
 * Libellé affiché du flux. Un seul flux actif aujourd'hui
 * ("scrum-business"). Plus de Record<ScrumFlow, string> : le mapping
 * n'a plus de sens avec un seul élément, et un Record à une clé
 * forcerait une mise à jour mécanique à chaque ajout de flux.
 * Si un jour un 2ᵉ flux est ajouté, reintroduire un Record ici.
 */
const FLOW_TITLE = "ScrumBusiness";

/* ------------------------------------------------------------------ */
/*  Layout (sync, ne fait que monter le Suspense)                      */
/* ------------------------------------------------------------------ */

export default function FlowLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: LayoutParams;
}) {
  return (
    <Suspense fallback={<FlowShellFallback />}>
      <FlowShell params={params}>{children}</FlowShell>
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Shell async                                                        */
/* ------------------------------------------------------------------ */

async function FlowShell({
  children,
  params,
}: {
  readonly children: React.ReactNode;
  readonly params: LayoutParams;
}) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-2">
          Flux Scrum
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {FLOW_TITLE}
        </h1>
      </header>

      <Suspense fallback={<ScrumNavFallback />}>
        <ScrumNav flow={flow} />
      </Suspense>

      <div className="pt-4">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Fallbacks                                                          */
/* ------------------------------------------------------------------ */

function FlowShellFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-48" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function ScrumNavFallback() {
  return <div className="h-10 w-full" aria-hidden />;
}