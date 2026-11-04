/*
path :           components/layout/header/Logo.tsx
tag :            ["layout", "header", "logo", "ui"]
projectId:       new-genesis
type:            component
generic:         false

role:            Logo de l'application Genesis : icône Sparkles dans un carré
                 en dégradé (chart-1 → chart-2) + wordmark « Genesis ». Sert
                 de lien vers l'accueil. Server Component statique, aucune
                 interactivité au-delà du survol CSS. Extrait pour être
                 réutilisé par Header (desktop + mobile) et Footer.

flow:            Server Component → rend un <Link> vers "/" contenant
                 l'icône (carré dégradé) et le texte « Genesis ».

ecosystem:       Layout = [
                   "@/app/globals.css",
                   "@/app/layout.tsx",
                   "@/components/layout/footer/Footer.tsx",
                   "@/components/layout/header/Header.tsx",
                   "@/components/layout/header/Logo.tsx",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/UserMenu.tsx",
                   "@/components/layout/header/nav/frontWorkSpace.ts",
                   "@/components/layout/header/navTypes.ts",
                   "@/components/ui/sonner.tsx",
                   "@/components/ui/tooltip.tsx",
                 ]

relatedFiles:    ["@/components/layout/header/Header.tsx",
                  "@/components/layout/footer/Footer.tsx"]

imports:         ["next/link", "lucide-react"]

exports:         ["default Logo"]

useBy:           ["@/components/layout/header/Header.tsx"]

userStories:     ["*en tant qu'utilisateur je veux un logo cliquable qui ramène à l'accueil"]

status:          planned
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Logo() {
  return (
    <Link
      href="/"
      aria-label="Genesis — Accueil"
      className="group inline-flex items-center gap-2 rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
        <Sparkles className="h-4 w-4" aria-hidden />
      </span>
      <span className="text-lg font-bold tracking-tight text-foreground">
        MiamMiamListo
      </span>
    </Link>
  );
}
