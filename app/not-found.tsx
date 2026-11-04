/*
path :           app/not-found.tsx
projectId:       <à fournir>
type:            page
generic:         false

role:            Page 404 globale. Rendue automatiquement par Next.js quand
                 notFound() est appelé ou qu'aucune route ne matche. Affiche un
                 grand « 404 » en dégradé, deux halos décoratifs flous, un message
                 clair et deux CTA (Accueil + Back-Studio).

flow:            Server Component → rendu statique. Deux halos décoratifs en
                 position absolue + le chiffre 404 en gradient text + deux boutons
                 Link stylés via buttonVariants.

ecosystem:       AppShell = [
                   "@/app/layout.tsx",
                   "@/app/loading.tsx",
                   "@/app/error.tsx",
                   "@/app/not-found.tsx",
                   "@/app/global-error.tsx",
                   "@/app/template.tsx",
                   "@/app/default.tsx",
                 ]
relatedFiles:    ["@/components/ui/button.tsx"]
imports:         ["next/link", "lucide-react",
                  "@/components/ui/button"]
exports:         ["default NotFound"]
useBy:           []

userStories:     ["*en tant qu'utilisateur je veux une page 404 esthétique et utile"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import Link from "next/link";
import { Compass, Home } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-12">
      {/* Halos décoratifs */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-chart-1/10 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-chart-5/10 blur-3xl"
      />

      <div className="relative flex max-w-lg flex-col items-center gap-6 text-center">
        {/* Numéro 404 en dégradé */}
        <span
          aria-hidden
          className="bg-gradient-to-br from-chart-1 via-chart-2 to-chart-5 bg-clip-text font-mono text-[7rem] font-black leading-none tracking-tighter text-transparent sm:text-[9rem]"
        >
          404
        </span>

        {/* Texte */}
        <div className="flex flex-col gap-2">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Page introuvable
          </h1>
          <p className="max-w-md text-balance text-sm leading-relaxed text-muted-foreground">
            La page que tu cherches n&apos;existe pas, a été déplacée ou
            n&apos;est plus accessible.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link href="/" className={buttonVariants({})}>
            <Home className="size-4" aria-hidden />
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/back-studio"
            className={buttonVariants({ variant: "outline" })}
          >
            <Compass className="size-4" aria-hidden />
            Explorer le Back-Studio
          </Link>
        </div>
      </div>
    </main>
  );
}