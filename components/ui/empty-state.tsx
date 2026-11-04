/*
path :           components/ui/empty-state.tsx
tag :            ["ui", "empty-state", "feedback", "generic"]
projectId:       new-genesis
type:            component
generic:         true

role:            Bloc réutilisable pour afficher un état vide (« Aucun
                 article », « Aucune discussion »…). Remplace 13 blocs
                 <div class="rounded-2xl border border-dashed ..."> dupliqués
                 à travers le module Blog. Rendu responsive (padding
                 adaptatif mobile/desktop), icône optionnelle, CTA
                 optionnel (lien vers une page d'action). Server Component
                 pur.

                 ⚠️ Ne gère PAS `role="status"` par défaut (pas un état
                 de loading). Pour un état « chargement » utiliser
                 <Skeleton /> ou <Spinner />.

flow:            Props { icon?, title?, description, cta?, className? } →
                 rend un <div> avec bordure dashed, padding fluide
                 (p-8 mobile / p-12 desktop), centrage, icône si fournie,
                 titre si fourni, description (paragraphe muted), et CTA
                 optionnel <Link> stylé.

ecosystem:       UI = [
                   "@/components/ui/empty-state.tsx",
                 ]

relatedFiles:    ["@/components/ui/button.tsx",
                  "@/components/ui/skeleton.tsx"]

imports:         ["next/link", "lucide-react"]

exports:         ["EmptyState", "EmptyStateProps"]

useBy:           ["@/app/blog/articles/page.tsx",
                  "@/app/blog/user/articles/page.tsx",
                  "@/app/blog/community/page.tsx",
                  "@/app/blog/community/[groupSlug]/page.tsx",
                  "@/app/blog/community/[groupSlug]/requests/page.tsx",
                  "@/app/blog/search/page.tsx",
                  "@/app/blog/tag/[slug]/page.tsx",
                  "@/app/blog/theme/[slug]/page.tsx",
                  "@/app/blog/theme/[slug]/[category]/page.tsx",
                  "@/app/blog/theme/[slug]/[category]/[subCategory]/page.tsx",
                  "@/app/blog/playlists/page.tsx",
                  "@/app/blog/playlist/[slug]/page.tsx"]

userStories:     ["*en tant que développeur je veux un composant d'état vide réutilisable"]

status:          planned
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface EmptyStateCta {
  readonly href: string;
  readonly label: string;
  readonly icon?: React.ReactNode;
}

export interface EmptyStateProps {
  /** Icône optionnelle, rendue centrée au-dessus du titre. */
  readonly icon?: React.ReactNode;
  /** Titre optionnel (gras, foreground). */
  readonly title?: string;
  /** Description (obligatoire) — texte muted. */
  readonly description: string;
  /** CTA optionnel (lien stylé bouton). */
  readonly cta?: EmptyStateCta;
  /** Classes additionnelles sur le conteneur. */
  readonly className?: string;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  cta,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center sm:p-12 ${
        className ?? ""
      }`}
    >
      {icon && (
        <div className="mx-auto mb-3 grid size-10 place-items-center text-muted-foreground">
          {icon}
        </div>
      )}
      {title && (
        <h2 className="mb-1 text-base font-semibold text-foreground">
          {title}
        </h2>
      )}
      <p className="text-sm text-muted-foreground">{description}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          {cta.icon}
          {cta.label}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}