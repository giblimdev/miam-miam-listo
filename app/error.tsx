/*
path :           app/error.tsx
projectId:       <à fournir>
type:            component
generic:         false

role:            Error boundary racine de l'application. Capture toute erreur non
                 gérée survenue dans un segment enfant du root layout (hors layout
                 lui-même). Affiche un écran d'erreur cohérent avec la marque,
                 journalise l'erreur en console, et propose deux actions :
                 « Réessayer » (reset) et « Retour à l'accueil ».

flow:            Client Component → useEffect log l'erreur → rend une pastille
                 destructive, un titre, la description, le digest (si présent),
                 puis deux boutons (reset + Link home). Le reset est passé par
                 Next.js et relance le rendu du segment.

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
imports:         ["react", "next/link", "lucide-react",
                  "@/components/ui/button"]
exports:         ["default Error"]
useBy:           []

userStories:     ["*en tant qu'utilisateur je veux un écran d'erreur clair et actionnable"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : les error boundaries Next.js doivent être des
// Client Components (React Error Boundary + useEffect + bouton reset).

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      {/* Pastille erreur */}
      <span className="relative grid size-20 place-items-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-3xl bg-destructive/10 ring-8 ring-destructive/5"
        />
        <AlertTriangle
          className="relative size-8 text-destructive"
          aria-hidden
        />
      </span>

      {/* Texte */}
      <div className="flex flex-col gap-2">
        <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Une erreur est survenue
        </h1>
        <p className="max-w-md text-balance text-sm leading-relaxed text-muted-foreground">
          Quelque chose s&apos;est mal passé lors du rendu de cette page.
          Tu peux réessayer ou revenir à l&apos;accueil.
        </p>
      </div>

      {/* Digest optionnel */}
      {error.digest && (
        <code className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
          {error.digest}
        </code>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={reset} className={buttonVariants({})}>
          <RefreshCw className="size-4" aria-hidden />
          Réessayer
        </button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          <Home className="size-4" aria-hidden />
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}