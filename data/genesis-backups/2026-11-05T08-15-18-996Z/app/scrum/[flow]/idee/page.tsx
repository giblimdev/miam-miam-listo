/*
path :           app/scrum/[flow]/idee/page.tsx
tag :            ["help", "idee", "page", "scrum"]
projectId:       new-genesis
type:            page
generic:         false

role:            Page de gestion des idées pour un flux Scrum donné. Le composant
                 page est synchrone et ne fait que monter un <Suspense>. Tout l'accès
                 runtime (await params, validation, lecture des données) est isolé
                 dans le composant async <IdeeSection />, conformément à Cache
                 Components.

flow:            Server Component sync → <Suspense fallback=<IdeeListSkeleton />> →
                 <IdeeSection params={params} /> async → await params → validation
                 via SCRUM_FLOWS → listIdees(flow) → <IdeeList />.

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

relatedFiles:    ["@/app/scrum/components/IdeeList.tsx",
                  "@/app/scrum/lib/services/idee.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/idee",
                  "@/app/scrum/components/IdeeList",
                  "@/components/ui/skeleton"]

exports:         ["default IdeePage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux gérer les idées d'un flux Scrum"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listIdees } from "@/app/scrum/lib/services/idee";
import { IdeeList } from "@/app/scrum/components/IdeeList";
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

/* ------------------------------------------------------------------ */
/*  Page (sync, ne fait que monter le Suspense)                        */
/* ------------------------------------------------------------------ */

export default function IdeePage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<IdeeListSkeleton />}>
      <IdeeSection params={params} />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Section async (toute la logique runtime est ici)                   */
/* ------------------------------------------------------------------ */

async function IdeeSection({ params }: { readonly params: PageParams }) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const idees = await listIdees(flow);
  return <IdeeList flow={flow} idees={idees} />;
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function IdeeListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}
