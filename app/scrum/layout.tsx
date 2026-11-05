/*
path :           app/scrum/layout.tsx
tag :            ["scrum", "layout", "container", "wide", "mono-flux"]
projectId:       new-genesis
type:            layout
generic:         false

role:            Layout commun au module Scrum. Fournit un conteneur
                 avec fond dégradé et une largeur maximale cohérente
                 pour toutes les pages du module (hub + sous-pages par
                 flux).

                 LARGEUR : `max-w-screen-2xl` (1536px) au lieu de
                 `max-w-7xl` (1280px). Sur les grands écrans (≥ 1536px),
                 le module Scrum utilise jusqu'à 1536px de large, ce qui
                 laisse plus de place aux boards DnD (Backlog + colonnes
                 Epic côte à côte) et aux grilles de cartes. Sur les
                 écrans plus petits, le comportement est inchangé (100%
                 de la largeur jusqu'à 1536px).

                 Le choix `max-w-screen-2xl` (et non `w-full`) est
                 délibéré : les pages de lecture (Idee, Feature, etc.)
                 restent lisibles sur grands écrans. Si un jour on veut
                 des boards en pleine largeur sans limite, il faudra
                 créer un layout dédié `app/scrum/[flow]/epic/board/
                 layout.tsx` et `app/scrum/[flow]/task/board/layout.tsx`
                 qui override le `max-w-`. Ce n'est PAS fait ici.

flow:            Server Component → rend un wrapper <div> avec classes
                 de fond + conteneur `mx-auto w-full max-w-screen-2xl`
                 avec padding responsive.

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
                   "@/app/scrum/components/BoardColumn.tsx",
                   "@/app/scrum/components/FlowShellContent.tsx",
                   "@/app/scrum/components/ScrumSidebar.tsx",
                   "@/app/scrum/components/ScrumSidebarGroup.tsx",
                   "@/app/scrum/components/SprintBoardHub.tsx",
                   "@/app/scrum/components/UserStoryBoard.tsx",
                   "@/app/scrum/components/UserStoryMiniCard.tsx",
                   "@/app/scrum/lib/navigation.ts",
                   "@/app/scrum/lib/types.ts",
                   "@/app/scrum/layout.tsx",
                   "@/app/scrum/page.tsx",
                 ]

relatedFiles:    ["@/app/scrum/page.tsx",
                  "@/app/scrum/[flow]/layout.tsx"]

imports:         []

exports:         ["default ScrumLayout"]

useBy:           []

userStories:     ["*en tant que développeur je veux un layout commun au module Scrum",
                  "*en tant qu'utilisateur je veux que le module Scrum utilise toute la largeur disponible sur grand écran"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

export default function ScrumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}