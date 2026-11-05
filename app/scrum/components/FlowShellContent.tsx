/*
path :           app/scrum/components/FlowShellContent.tsx
tag :            ["scrum", "layout", "sidebar", "mobile", "client"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Enveloppe client du contenu d'un flux Scrum. Gère
                 l'état `mobileOpen` de la sheet de navigation et rend,
                 dans l'ordre :
                 - un bouton burger (visible < md uniquement) qui ouvre
                   la sheet ;
                 - la sidebar (desktop ≥ md, sheet mobile < md) ;
                 - le contenu principal (children).
                 Ce composant est nécessaire parce que le layout
                 `[flow]/layout.tsx` est un Server Component : il ne
                 peut pas porter d'état React. On isole donc l'état
                 mobile dans ce Client Component, sans transformer le
                 layout en client.

                 Le bouton burger est sticky sous le header global
                 (top-16) pour rester accessible au scroll.

flow:            Client Component → useState(mobileOpen) → rend
                 <MobileBurger> (button) + <ScrumSidebar mobileOpen
                 onMobileOpenChange> + <main>{children}</main>.
                 Grille responsive : 1 colonne < md, 2 colonnes
                 (sidebar 240px + contenu) ≥ md.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/layout.tsx",
                   "@/app/scrum/components/FlowShellContent.tsx",
                   "@/app/scrum/components/ScrumSidebar.tsx",
                   "@/app/scrum/components/ScrumSidebarGroup.tsx",
                   "@/app/scrum/lib/navigation.ts",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/components/ScrumSidebar.tsx",
                  "@/app/scrum/lib/types.ts",
                  "@/components/ui/button.tsx"]

imports:         ["react", "lucide-react",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/components/ScrumSidebar",
                  "@/components/ui/button"]

exports:         ["FlowShellContent", "FlowShellContentProps"]

useBy:           ["@/app/scrum/[flow]/layout.tsx"]

userStories:     ["*en tant qu'utilisateur je veux ouvrir la navigation sur mobile"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (mobileOpen) + bouton burger.

import { useState } from "react";
import { Menu } from "lucide-react";

import type { ScrumFlow } from "@/app/scrum/lib/types";
import { ScrumSidebar } from "@/app/scrum/components/ScrumSidebar";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface FlowShellContentProps {
  readonly flow: ScrumFlow;
  readonly children: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function FlowShellContent({
  flow,
  children,
}: FlowShellContentProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Bouton burger mobile — sticky sous le header global */}
      <div className="sticky top-16 z-20 -mx-4 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-2 backdrop-blur md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Ouvrir la navigation Scrum"
          aria-expanded={mobileOpen}
          aria-controls="scrum-mobile-nav"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-4" aria-hidden />
        </Button>
        <span className="text-sm font-medium text-foreground">
          Navigation Scrum
        </span>
      </div>

      {/* Grille sidebar + contenu */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <ScrumSidebar
          flow={flow}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        />
        <main id="scrum-mobile-nav" className="min-w-0 flex-1 pt-2 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}