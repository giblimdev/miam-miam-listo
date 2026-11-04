/*
path :           app/blog/components/NewPostForm.tsx
tag :            ["blog", "component", "discussion", "post", "form", "client"]
projectId:       new-genesis
type :           component
generic:         false

role:            Formulaire de réponse dans une discussion (ou réponse
                 à un post). Client : Textarea + Envoyer → 
                 createPostAction(groupId, discussionId, parentId,
                 content) → succès : reset + router.refresh +
                 onSuccess?.().

flow:            Props { groupId, discussionId, parentId, onSuccess? }
                 → useState(content) → submit → createPostAction →
                 succès : reset + refresh → erreur : toast.

ecosystem:       BlogUI = [
                   ... (identique à ArticleCard)
                 ]

relatedFiles:    ["@/app/blog/lib/actions/group.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/group",
                  "@/components/ui/button",
                  "@/components/ui/textarea"]

exports:         ["NewPostForm", "NewPostFormProps"]

useBy:           ["@/app/blog/community/[groupSlug]/[discussionId]/page.tsx",
                  "@/app/blog/components/DiscussionThread.tsx"]

userStories:     ["us3100004"]
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

import { createPostAction } from "@/app/blog/lib/actions/group";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface NewPostFormProps {
  readonly groupId: string;
  readonly discussionId: string;
  readonly parentId: string;
  readonly onSuccess?: () => void;
}

export function NewPostForm({
  groupId,
  discussionId,
  parentId,
  onSuccess,
}: NewPostFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await createPostAction(
        groupId,
        discussionId,
        parentId,
        trimmed,
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setContent("");
      toast.success("Réponse publiée.");
      onSuccess?.();
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Écrire une réponse…"
        rows={3}
        maxLength={5000}
        aria-label="Réponse"
        className="resize-none"
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending || !content.trim()}
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