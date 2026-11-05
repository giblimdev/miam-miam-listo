/*
path :           app/scrum/[flow]/sprint/board/page.tsx
tag :            ["scrum", "sprint", "board", "page", "dnd", "edit"]
projectId:       <à fournir>
type:            page
generic:         false

role:            Page du board DnD US ↔ Sprint. Sync page + Suspense ;
                 validation du flow et lecture des sprints + US +
                 epics dans un composant async. Le board permet de
                 rattacher / détacher une US d'un sprint par
                 glisser-déposer (backlog implicite : US sans sprint
                 = colonne "Backlog") ET d'ouvrir une modale
                 d'édition au clic sur une US.

                 ⚠️ CHANGEMENT DE COMPORTEMENT : cette page
                 affichait auparavant SprintBoardHub (grille de
                 cartes sprint menant vers /sprint/[sprintId]/edit).
                 Elle affiche désormais directement le board DnD
                 SprintBoardDnd, ALIGNÉ SUR L'UI/UX de /epic/board
                 et /task/board.

flow:            Sync page → <Suspense fallback=<SprintBoardSkeleton />> →
                 <SprintBoardSection params /> async → await params →
                 isScrumFlow → Promise.all([listSprints,
                 listUserStories, listEpics]) → <SprintBoardDnd
                 flow sprints stories epics />.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/sprint/board/page.tsx",
                   "@/app/scrum/components/BoardColumn.tsx",
                   "@/app/scrum/components/SprintBoardDnd.tsx",
                   "@/app/scrum/components/UserStoryForm.tsx",
                   "@/app/scrum/components/UserStoryMiniCard.tsx",
                   "@/app/scrum/lib/actions/sprint.ts",
                   "@/app/scrum/lib/actions/user-story.ts",
                   "@/app/scrum/lib/services/epic.ts",
                   "@/app/scrum/lib/services/sprint.ts",
                   "@/app/scrum/lib/services/user-story.ts",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/components/SprintBoardDnd.tsx",
                  "@/app/scrum/lib/services/sprint.ts",
                  "@/app/scrum/lib/services/user-story.ts",
                  "@/app/scrum/lib/services/epic.ts",
                  "@/app/scrum/lib/types.ts"]

imports:         ["react", "next/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/lib/services/epic",
                  "@/app/scrum/lib/services/sprint",
                  "@/app/scrum/lib/services/user-story",
                  "@/app/scrum/components/SprintBoardDnd",
                  "@/components/ui/skeleton"]

exports:         ["default SprintBoardPage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux organiser les US d'un sprint par DnD",
                  "*en tant qu'utilisateur je veux cliquer sur une US pour l'éditer"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { SCRUM_FLOWS, type ScrumFlow } from "@/app/scrum/lib/types";
import { listEpics } from "@/app/scrum/lib/services/epic";
import { listSprints } from "@/app/scrum/lib/services/sprint";
import { listUserStories } from "@/app/scrum/lib/services/user-story";
import { SprintBoardDnd } from "@/app/scrum/components/SprintBoardDnd";
import { Skeleton } from "@/components/ui/skeleton";

type PageParams = Promise<{ flow: string }>;

function isScrumFlow(value: string): value is ScrumFlow {
  return (SCRUM_FLOWS as readonly string[]).includes(value);
}

export default function SprintBoardPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<SprintBoardSkeleton />}>
      <SprintBoardSection params={params} />
    </Suspense>
  );
}

async function SprintBoardSection({
  params,
}: {
  readonly params: PageParams;
}) {
  const { flow } = await params;

  if (!isScrumFlow(flow)) {
    notFound();
  }

  const [sprints, stories, epics] = await Promise.all([
    listSprints(flow),
    listUserStories(flow),
    listEpics(flow),
  ]);

  return (
    <SprintBoardDnd
      flow={flow}
      sprints={sprints}
      stories={stories}
      epics={epics}
    />
  );
}

function SprintBoardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-96 rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}