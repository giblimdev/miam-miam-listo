/*
path :           app/scrum/[flow]/layout.tsx
tag :            ["scrum", "layout", "flow", "sidebar", "mobile", "mono-flux"]
projectId:       new-genesis
type:            layout
generic:         false

role:            Layout du flux Scrum. Le composant layout est synchrone
                 et monte un <Suspense> autour d'un composant async qui
                 lit params et valide le flow. La navigation est une
                 SCRUM SIDEBAR (verticale) sur desktop, une Sheet sur
                 mobile. Un bouton burger est rendu dans le header pour
                 piloter l'ouverture de la sheet mobile.

                 MONO-FLUX : un seul flux actif ("scrum-business"). Le
                 FLOW_TITLE local remplace l'ancien FLOW_LABEL
                 (Record<ScrumFlow, string>) — plus de mapping inutile.
                 isScrumFlow() reste utilisé pour valider params.flow
                 (défense en profondeur : une URL forgée
                 /scrum/scrum-app/... tombe en notFound()).

                 Réorganisation du rendu : la sidebar est EXTRAITE du
                 flux de contenu (grid 2 colonnes sur md+ : sidebar +
                 contenu), pour permettre le sticky et le scroll
                 indépendant.

flow:            Server Component sync → <Suspense fallback=<FlowShellFallback />> →
                 <FlowShell params={params} /> async → await params →
                 validation → rend header (titre + burger mobile) +
                 <FlowShellContent> (Client Component : gère l'état
                 mobileOpen de la sheet) qui affiche :
                 - sidebar desktop (≥ md)
                 - sheet mobile (< md)
                 - contenu principal (children).

ecosystem:       Scrum = [
                   "@/app/scrum/components/ScrumSidebar.tsx",
                   "@/app/scrum/components/ScrumSidebarGroup.tsx",
                   "@/app/scrum/lib/navigation.ts",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/components/ScrumSidebar.tsx",
                  "@/app/scrum/lib/navigation.ts",
                  "@/app/scrum/lib/types.ts",
                  "@/components/ui/button.tsx"]

imports:         ["react", "next/navigation", "lucide-react",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/components/ScrumSidebar",
                  "@/components/ui/button",
                  "@/components/ui/skeleton"]

exports:         ["default FlowLayout"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux naviguer entre les sections d'un flux",
                  "*en tant qu'utilisateur je veux une sidebar sur desktop et une sheet sur mobile"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { FlowShellContent } from "@/app/scrum/components/FlowShellContent";
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
 * Libellé affiché du flux. Un seul flux actif ("scrum-business").
 * Plus de Record<ScrumFlow, string> : le mapping est inutile.
 */
const FLOW_TITLE = "ScrumBusiness";

/* ------------------------------------------------------------------ */
/*  Layout (sync)                                                      */
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

      <FlowShellContent flow={flow}>{children}</FlowShellContent>
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