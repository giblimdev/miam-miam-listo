/*
path :           app/scrum/layout.tsx
tag :            ["help", "layout", "scrum"]
projectId:       new-genesis
type:            layout
generic:         false

role:            Layout commun au module Scrum. Fournit un conteneur avec fond
                 dégradé et une largeur maximale cohérente pour toutes les pages
                 du module (hub + sous-pages par flux).

flow:            Server Component → rend un wrapper <div> avec classes de fond et
                 centre le contenu dans un max-w-7xl.

ecosystem:       Scrum = [
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

relatedFiles:    ["@/app/scrum/page.tsx"]

imports:         []

exports:         ["default ScrumLayout"]

useBy:           []

userStories:     ["*en tant que développeur je veux un layout commun au module Scrum"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
