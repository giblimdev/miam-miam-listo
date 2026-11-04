/*
path :           app/blog/components/FavoriteButton.tsx
tag :            ["blog", "component", "favorite", "button", "client"]
projectId:       new-genesis
type :           component
generic:         false

role:            Bouton toggle de favori (non classé). Client Component :
                 état optimiste initialisé par les props. Bookmark icon
                 + aria-pressed. Appelle toggleFavoriteAction.

flow:            Props { articleId, initiallyFavorited, isAuthenticated }
                 → useState → onClick → si non auth : toast → sinon
                 optimistic toggle → toggleFavoriteAction → succès :
                 setState → erreur : rollback + toast.

ecosystem:       BlogUI = [
                   ... (identique à ArticleCard)
                 ]

relatedFiles:    ["@/app/blog/lib/actions/favorite.ts"]

imports:         ["react", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/favorite",
                  "@/components/ui/button"]

exports:         ["FavoriteButton", "FavoriteButtonProps"]

useBy:           ["@/app/blog/components/ArticleHeader.tsx"]

userStories:     ["us2100005"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (optimiste) + useTransition + toast.

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

import { toggleFavoriteAction } from "@/app/blog/lib/actions/favorite";
import { Button } from "@/components/ui/button";

export interface FavoriteButtonProps {
  readonly articleId: string;
  readonly initiallyFavorited: boolean;
  readonly isAuthenticated: boolean;
}

export function FavoriteButton({
  articleId,
  initiallyFavorited,
  isAuthenticated,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour sauvegarder cet article.");
      return;
    }
    const prev = favorited;
    setFavorited(!favorited);
    startTransition(async () => {
      const result = await toggleFavoriteAction(articleId);
      if (!result.ok) {
        setFavorited(prev);
        toast.error(result.error);
        return;
      }
      setFavorited(result.data.favorited);
    });
  }

  return (
    <Button
      type="button"
      variant={favorited ? "secondary" : "outline"}
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={favorited}
      aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
      className="gap-2"
    >
      <Bookmark
        className={`size-4 ${favorited ? "fill-current" : ""}`}
        aria-hidden
      />
      {favorited ? "Sauvegardé" : "Sauvegarder"}
    </Button>
  );
}