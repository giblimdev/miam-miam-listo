/*
path :           app/blog/components/CommentForm.tsx
tag :            ["blog", "component", "comment", "form", "client"]
projectId:       new-genesis
type :           component
generic:         false

role:            Formulaire d'ajout de commentaire (racine ou réponse).
                 Client Component : Textarea contrôlée + bouton
                 Envoyer + useTransition + toast. Appelle
                 createCommentAction(articleId, parentId, content).
                 Le parentId = articleId pour un commentaire racine,
                 ou un commentId pour une réponse (mode inline).

flow:            Props { articleId, parentId, isAuthenticated,
                 onSuccess? } → useState(content) → submit →
                 createCommentAction → succès : reset + onSuccess?.() +
                 router.refresh() → erreur : toast.

ecosystem:       BlogUI = [
                   ... (identique à ArticleCard)
                 ]

relatedFiles:    ["@/app/blog/lib/actions/comment.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/comment",
                  "@/components/ui/button",
                  "@/components/ui/textarea"]

exports:         ["CommentForm", "CommentFormProps"]

useBy:           ["@/app/blog/components/CommentTree.tsx",
                  "@/app/blog/[slug]/page.tsx"]

userStories:     ["us2100001", "us2100002"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, useTransition, router.refresh, toast.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { createCommentAction } from "@/app/blog/lib/actions/comment";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface CommentFormProps {
  readonly articleId: string;
  readonly parentId: string;
  readonly isAuthenticated: boolean;
  readonly onSuccess?: () => void;
}

export function CommentForm({
  articleId,
  parentId,
  isAuthenticated,
  onSuccess,
}: CommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        Connectez-vous pour participer à la discussion.
      </p>
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length === 0) return;

    startTransition(async () => {
      const result = await createCommentAction(articleId, parentId, trimmed);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setContent("");
      toast.success("Commentaire publié.");
      onSuccess?.();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Écrire un commentaire…"
        rows={3}
        maxLength={5000}
        aria-label="Commentaire"
        className="resize-none"
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending || content.trim().length === 0}
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Send className="size-4" aria-hidden />
          )}
          Envoyer
        </Button>
      </div>
    </form>
  );
}