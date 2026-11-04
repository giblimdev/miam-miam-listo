/*
path :           app/blog/components/NewDiscussionForm.tsx
tag :            ["blog", "component", "group", "discussion", "form", "client"]
projectId:       new-genesis
type :           component
generic:         false

role:            Formulaire d'ouverture de discussion dans un groupe.
                 Client Component : Input titre + Textarea contenu +
                 submit → createDiscussionAction(groupId, formData) →
                 succès : reset + refresh.

flow:            Props { groupId } → useState(title, content) → submit →
                 FormData → createDiscussionAction → succès : reset +
                 router.refresh → erreur : toast.

ecosystem:       BlogUI = [
                   ... (identique à ArticleCard)
                 ]

relatedFiles:    ["@/app/blog/lib/actions/group.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/group",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/ui/textarea"]

exports:         ["NewDiscussionForm", "NewDiscussionFormProps"]

useBy:           ["@/app/blog/community/[groupSlug]/page.tsx"]

userStories:     ["us3100003"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, useTransition, router.refresh, toast.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";

import { createDiscussionAction } from "@/app/blog/lib/actions/group";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface NewDiscussionFormProps {
  readonly groupId: string;
}

export function NewDiscussionForm({ groupId }: NewDiscussionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) return;

    const formData = new FormData();
    formData.set("title", trimmedTitle);
    formData.set("content", trimmedContent);

    startTransition(async () => {
      const result = await createDiscussionAction(groupId, formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Discussion ouverte.");
      setTitle("");
      setContent("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field>
        <FieldLabel htmlFor="disc-title">Titre</FieldLabel>
        <Input
          id="disc-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="disc-content">Contenu</FieldLabel>
        <Textarea
          id="disc-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
          className="resize-none"
        />
      </Field>
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending || !title.trim() || !content.trim()}
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <MessageSquarePlus className="size-4" aria-hidden />
          )}
          Ouvrir la discussion
        </Button>
      </div>
    </form>
  );
}