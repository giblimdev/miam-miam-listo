/*
path :           app/blog/components/LikeButton.tsx
tag :            ["blog", "component", "like", "button", "client"]
projectId:       new-genesis
type :           component
generic:         false

role:            Bouton toggle de like d'article. Client Component :
                 état optimiste {liked, count} initialisé par les props.
                 Affiche un cœur + compteur. aria-pressed. Désactive
                 le clic pour les non-authentifiés (mais affiche le
                 compteur et un lien login en tooltip). Appelle
                 toggleArticleLikeAction.

flow:            Props { articleId, initialCount, initiallyLiked,
                 isAuthenticated } → useState → onClick → si non auth :
                 toast "Connectez-vous" → sinon startTransition →
                 toggleArticleLikeAction → succès : setState → erreur :
                 rollback + toast.

ecosystem:       BlogUI = [
                   ... (identique à ArticleCard)
                 ]

relatedFiles:    ["@/app/blog/lib/actions/like.ts"]

imports:         ["react", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/like",
                  "@/components/ui/button"]

exports:         ["LikeButton", "LikeButtonProps"]

useBy:           ["@/app/blog/components/ArticleHeader.tsx"]

userStories:     ["us2100003"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (optimiste) + useTransition + toast.

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { toggleArticleLikeAction } from "@/app/blog/lib/actions/like";
import { Button } from "@/components/ui/button";

export interface LikeButtonProps {
  readonly articleId: string;
  readonly initialCount: number;
  readonly initiallyLiked: boolean;
  readonly isAuthenticated: boolean;
}

export function LikeButton({
  articleId,
  initialCount,
  initiallyLiked,
  isAuthenticated,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour liker cet article.");
      return;
    }
    const prev = { liked, count };
    setLiked(!liked);
    setCount(liked ? Math.max(0, count - 1) : count + 1);

    startTransition(async () => {
      const result = await toggleArticleLikeAction(articleId);
      if (!result.ok) {
        setLiked(prev.liked);
        setCount(prev.count);
        toast.error(result.error);
        return;
      }
      setLiked(result.data.liked);
      setCount(result.data.count);
    });
  }

  return (
    <Button
      type="button"
      variant={liked ? "default" : "outline"}
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={liked}
      aria-label={liked ? "Retirer le like" : "Liker l'article"}
      className="gap-2"
    >
      <Heart
        className={`size-4 ${liked ? "fill-current" : ""}`}
        aria-hidden
      />
      {count}
    </Button>
  );
}