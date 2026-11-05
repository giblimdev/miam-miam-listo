/*
path :           app/scrum/[flow]/epic/[epicId]/edit/page.tsx
tag :            ["scrum", "epic", "edit", "page"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page d'édition d'un epic. Sync page + Suspense ; toute
                 la logique runtime (await params, validation flow,
                 chargement epic) est isolée dans un composant async.
                 La résolution de l'epicId est robuste : accepte
                 params.epicId, params.id ou params.slug (utile si le
                 dossier dynamique est renommé).

                 ALIGNEMENT SUR SPRINT : l'édition passe d'une modale
                 (dans EpicList) à une page dédiée, comme pour Sprint
                 (/scrum/[flow]/sprint/[sprintId]/edit). Le formulaire
                 reste EpicForm, monté dans EpicEditor.

flow:            Sync page → <Suspense fallback=<EpicEditSkeleton />> →
                 <EpicEditSection params /> async → await params →
                 résolution epicId → isScrumFlow → listEpics → find
                 epic → notFound si absent → <EpicEditor />.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/epic/[epicId]/edit/page.tsx",
                   "@/app/scrum/components/EpicEditor.tsx",
                   "@/app/scrum/components/EpicForm.tsx",
                   "@/app/scrum/lib/actions/epic.ts",
                   "@/app/scrum/lib/services/epic.ts",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/components/EpicEditor.tsx",
                  "@/app/scrum/lib/services/epic.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/epic",
                  "@/app/scrum/components/EpicEditor",
                  "@/components/ui/skeleton"]

exports:         ["default EpicEditPage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux éditer un epic sur une page dédiée"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listEpics } from "@/app/scrum/lib/services/epic";
import { EpicEditor } from "@/app/scrum/components/EpicEditor";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<Record<string, string>>;

function isScrumFlow(value: string | undefined): value is ScrumFlow {
  if (!value) return false;
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

function resolveEpicId(params: Record<string, string>): string | null {
  return params.epicId ?? params.id ?? params.slug ?? null;
}

export default function EpicEditPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<EpicEditSkeleton />}>
      <EpicEditSection params={params} />
    </Suspense>
  );
}

async function EpicEditSection({ params }: { readonly params: PageParams }) {
  const resolved = await params;

  const flow = resolved.flow;
  if (!isScrumFlow(flow)) {
    notFound();
  }

  const epicId = resolveEpicId(resolved);
  if (!epicId) {
    notFound();
  }

  const epics = await listEpics(flow);
  const epic = epics.find((e) => e.id === epicId);
  if (!epic) {
    notFound();
  }

  return <EpicEditor flow={flow} epic={epic} />;
}

function EpicEditSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}