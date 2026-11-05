/*
path :           app/scrum/[flow]/layout.tsx
tag :            ["help", "layout", "flow", "scrum"]
projectId:       new-genesis
type:            layout
generic:         false

role:            Layout du flux Scrum. Le composant layout est synchrone et monte
                 un <Suspense> autour d'un composant async qui lit params et valide
                 le flow. ScrumNav est lui aussi streamé sous Suspense car il utilise
                 usePathname (Cache Components).

flow:            Server Component sync → <Suspense fallback=<FlowShellFallback />> →
                 <FlowShell params={params} /> async → await params → validation
                 → rend header + ScrumNav (sous Suspense) + children.

ecosystem:       Help = [
                   "@/app/scrum/[flow]/epic/page.tsx",
                   "@/app/scrum/[flow]/feature/page.tsx",
                   "@/app/scrum/[flow]/global-json/page.tsx",
                   "@/app/scrum/[flow]/idee/page.tsx",
                   "@/app/scrum/[flow]/layout.tsx",
                   "@/app/scrum/[flow]/page.tsx",
                   "@/app/scrum/[flow]/persona/page.tsx",
                   "@/app/scrum/[flow]/sprint/page.tsx",
                   "@/app/scrum/[flow]/user-story/page.tsx",
                   "@/app/scrum/layout.tsx",
                   "@/app/scrum/page.tsx",
                 ]

relatedFiles:    ["@/app/scrum/lib/types.ts",
                  "@/app/scrum/components/scrum/ScrumNav.tsx"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/components/ScrumNav",
                  "@/components/ui/skeleton"]

exports:         ["default FlowLayout"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux naviguer entre les sections d'un flux"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
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

const FLOW_LABEL: Record<ScrumFlow, string> = {
  "scrum-business": "ScrumBusiness",
  "scrum-app": "ScrumApp",
  "scrum-genesis": "Scrum-Genesis",
};

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {FLOW_LABEL[flow]}
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
