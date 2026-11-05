/*
path :           app/scrum/components/ScrumSidebar.tsx
tag :            ["scrum", "nav", "sidebar", "ui", "mobile", "sheet"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Navigation principale du module Scrum. Affiche une
                 sidebar verticale sur desktop (≥ md) et une Sheet
                 coulissante sur mobile (< md). Trois zones :

                 1. En-tête : lien « Vue d'ensemble » vers la racine
                    du flux (/scrum/${flow}).
                 2. Corps scrollable : les quatre groupes de
                    SCRUM_NAV_GROUPS (Pipeline, Boards, Pilotage) —
                    rendus via ScrumSidebarGroup.
                 3. Pied : lien « Global JSON » (outil transverse).

                 Le bouton burger mobile est rendu à part (dans le
                 layout du flux ou dans le header) — cette sidebar
                 n'inclut PAS le bouton d'ouverture. Le parent contrôle
                 `mobileOpen` / `onMobileOpenChange` pour rester
                 compatible avec le header existant.

                 Réutilise ScrumSidebarGroup et SCRUM_NAV_GROUPS
                 (source unique de vérité). Aucune URL n'est modifiée
                 par rapport à l'ancien ScrumNav : la sidebar pointe
                 exactement vers les mêmes routes.

                 MONO-FLUX : le préfixe est construit à partir de
                 `flow` (prop) — pas de mapping, pas de Record.

flow:            Client Component → usePathname → rend :
                 - <aside> desktop : sticky, visible ≥ md, avec les
                   trois zones.
                 - <Sheet> mobile : ouverte via mobileOpen, contient
                   la même chose + un bouton fermer.
                 La navigation d'un lien appelle onNavigate (ferme la
                 sheet mobile) puis laisse Next/Link faire la
                 transition.

ecosystem:       Scrum = [
                   "@/app/scrum/components/ScrumSidebar.tsx",
                   "@/app/scrum/components/ScrumSidebarGroup.tsx",
                   "@/app/scrum/lib/navigation.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/navigation.ts",
                  "@/app/scrum/components/ScrumSidebarGroup.tsx",
                  "@/app/scrum/lib/types.ts",
                  "@/components/ui/sheet.tsx",
                  "@/components/ui/button.tsx"]

imports:         ["next/link", "next/navigation", "lucide-react",
                  "@/app/scrum/lib/navigation",
                  "@/app/scrum/lib/types",
                  "@/app/scrum/components/ScrumSidebarGroup",
                  "@/components/ui/sheet",
                  "@/components/ui/button"]

exports:         ["ScrumSidebar", "ScrumSidebarProps"]

useBy:           ["@/app/scrum/[flow]/layout.tsx"]

userStories:     ["*en tant qu'utilisateur je veux naviguer entre les sections Scrum",
                  "*en tant qu'utilisateur je veux une navigation groupée et lisible"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : usePathname + Sheet (Radix/Base UI) + onClick.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileJson, Home } from "lucide-react";

import { SCRUM_NAV_GROUPS } from "@/app/scrum/lib/navigation";
import type { ScrumFlow } from "@/app/scrum/lib/types";
import { ScrumSidebarGroup } from "@/app/scrum/components/ScrumSidebarGroup";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ScrumSidebarProps {
  readonly flow: ScrumFlow;
  /** Contrôle l'ouverture de la sheet mobile. */
  readonly mobileOpen: boolean;
  /** Callback de changement d'état de la sheet mobile. */
  readonly onMobileOpenChange: (open: boolean) => void;
}

/* ------------------------------------------------------------------ */
/*  Sous-composant : contenu partagé desktop / mobile                  */
/* ------------------------------------------------------------------ */

function SidebarContent({
  flow,
  pathname,
  onNavigate,
}: {
  readonly flow: ScrumFlow;
  readonly pathname: string;
  readonly onNavigate?: () => void;
}) {
  const base = `/scrum/${flow}`;
  const isOverview = pathname === base;
  const isGlobalJson = pathname.startsWith(`${base}/global-json`);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-3">
      {/* Vue d'ensemble */}
      <Link
        href={base}
        onClick={onNavigate}
        aria-current={isOverview ? "page" : undefined}
        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors ${
          isOverview
            ? "bg-chart-1/10 text-chart-1"
            : "text-foreground hover:bg-muted"
        }`}
      >
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-md ${
            isOverview
              ? "bg-chart-1/15 text-chart-1"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Home className="size-4" aria-hidden />
        </span>
        Vue d&apos;ensemble
      </Link>

      {/* Groupes scrollables */}
      <nav
        aria-label="Sections Scrum"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain pr-1"
      >
        {SCRUM_NAV_GROUPS.map((group) => (
          <ScrumSidebarGroup
            key={group.id}
            groupId={group.id}
            label={group.label}
            entries={group.entries}
            base={base}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Pied : Global JSON */}
      <Link
        href={`${base}/global-json`}
        onClick={onNavigate}
        aria-current={isGlobalJson ? "page" : undefined}
        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
          isGlobalJson
            ? "bg-chart-2/10 text-chart-2"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-md ${
            isGlobalJson
              ? "bg-chart-2/15 text-chart-2"
              : "bg-muted/60 text-muted-foreground"
          }`}
        >
          <FileJson className="size-4" aria-hidden />
        </span>
        Global JSON
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function ScrumSidebar({
  flow,
  mobileOpen,
  onMobileOpenChange,
}: ScrumSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop : sidebar sticky */}
      <aside
        className="sticky top-16 hidden h-[calc(100svh-4rem)] w-60 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm md:flex md:flex-col"
        aria-label="Navigation Scrum (desktop)"
      >
        <SidebarContent flow={flow} pathname={pathname} />
      </aside>

      {/* Mobile : sheet coulissante */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="w-72 p-0"
          aria-label="Navigation Scrum (mobile)"
        >
          <SheetHeader className="border-b border-border/60 p-4">
            <SheetTitle className="text-left text-base">
              Navigation Scrum
            </SheetTitle>
          </SheetHeader>
          <SidebarContent
            flow={flow}
            pathname={pathname}
            onNavigate={() => onMobileOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}