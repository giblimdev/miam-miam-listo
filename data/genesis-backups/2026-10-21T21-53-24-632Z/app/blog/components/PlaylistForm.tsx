/*
path :           app/blog/components/PlaylistForm.tsx
tag :            ["blog", "component", "playlist", "form", "client", "cover"]
projectId:       new-genesis
type:            component
generic:         false

role:            Formulaire de création/édition d'une playlist. Client
                 Component : champs name, description, visibilité, et
                 couverture via <CoverImagePicker> (upload immédiat, même
                 composant que ArticleForm). Au submit, appelle
                 createPlaylistAction ou updatePlaylistAction puis toast +
                 router.refresh + onSuccess. Mode contrôlé par la prop
                 `mode`. Gère un état `isPending` via useTransition.

flow:            Props { mode, initial?, onSuccess, onCancel } →
                 useState ×4 → submit → FormData → create/update →
                 succès : toast + onSuccess() → erreur : toast.

ecosystem:       BlogUI = [
                   ... (voir tableau de référence)
                 ]

relatedFiles:    ["@/app/blog/lib/actions/playlist.ts",
                  "@/app/blog/lib/types.ts",
                  "@/app/blog/components/CoverImagePicker.tsx"]

imports:         ["react", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/playlist",
                  "@/app/blog/lib/types",
                  "@/app/blog/components/CoverImagePicker",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/ui/native-select",
                  "@/components/ui/textarea"]

exports:         ["PlaylistForm", "PlaylistFormProps"]

useBy:           ["@/app/blog/components/PlaylistManager.tsx"]

userStories:     ["*en tant qu'auteur je veux créer une playlist"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState, useTransition, toast, interactions.

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import {
  createPlaylistAction,
  updatePlaylistAction,
} from "@/app/blog/lib/actions/playlist";
import type { Playlist, PlaylistVisibility } from "@/app/blog/lib/types";
import { CoverImagePicker } from "@/app/blog/components/CoverImagePicker";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

export interface PlaylistFormProps {
  readonly mode: "create" | "edit";
  readonly initial?: Playlist;
  readonly onSuccess: () => void;
  readonly onCancel: () => void;
}

export function PlaylistForm({
  mode,
  initial,
  onSuccess,
  onCancel,
}: PlaylistFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [visibility, setVisibility] = useState<PlaylistVisibility>(
    initial?.visibility ?? "public",
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Le nom est requis.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", trimmed);
      formData.set("description", description.trim());
      formData.set("coverImage", coverImage.trim());
      formData.set("visibility", visibility);

      const result =
        mode === "create"
          ? await createPlaylistAction(formData)
          : initial
            ? await updatePlaylistAction(initial.id, formData)
            : { ok: false as const, error: "Playlist introuvable." };

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        mode === "create" ? "Playlist créée." : "Playlist mise à jour.",
      );
      onSuccess();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="playlist-name">Nom</FieldLabel>
        <Input
          id="playlist-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={100}
          placeholder="Ex. Démarrer avec Next.js"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="playlist-description">
          Description (optionnel)
        </FieldLabel>
        <Textarea
          id="playlist-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Quel parcours propose cette playlist ?"
          className="resize-none"
        />
        <p className="text-right text-[11px] tabular-nums text-muted-foreground">
          {description.length}/500
        </p>
      </Field>

      <Field>
        <FieldLabel>Couverture (optionnel)</FieldLabel>
        <CoverImagePicker
          value={coverImage}
          onChange={setCoverImage}
          disabled={isPending}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="playlist-visibility">Visibilité</FieldLabel>
        <NativeSelect
          id="playlist-visibility"
          value={visibility}
          onChange={(event) =>
            setVisibility(event.target.value as PlaylistVisibility)
          }
        >
          <NativeSelectOption value="public">Public</NativeSelectOption>
          <NativeSelectOption value="unlisted">Non listé</NativeSelectOption>
          <NativeSelectOption value="private">Privé</NativeSelectOption>
        </NativeSelect>
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          {mode === "create" ? "Créer" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}