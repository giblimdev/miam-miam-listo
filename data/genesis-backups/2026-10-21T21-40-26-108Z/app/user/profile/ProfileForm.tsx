/*
path :           app/user/profile/ProfileForm.tsx
tag :            ["user", "profile", "form", "client", "update", "avatar"]
projectId:       new-genesis
type:            component
generic:         false

role:            Formulaire d'édition du profil utilisateur. Client
                 Component : useState pour les 4 champs éditables
                 (name, bio, phone, image), useTransition pour la
                 mutation, router.refresh après succès, toast pour le
                 feedback. L'avatar utilise <AvatarPicker /> — composant
                 MUTUALISÉ avec /core/auth/register (même UX : file
                 picker, preview, overlay, initiales fallback, retrait).
                 L'image est donc produite en data URL base64 via
                 FileReader, exactement comme à l'inscription.

                 Le bouton « Réinitialiser » apparaît uniquement quand
                 dirty (au moins un champ diffère de la valeur initiale).
                 Le bouton Enregistrer est désactivé si non-dirty, si
                 name < 2 caractères, ou si isPending.

flow:            Props { initial } → useState ×4 → dirty = comparaison
                 avec initial → submit → FormData (name, bio, phone,
                 image) → updateProfileAction → succès : toast +
                 router.refresh() → erreur : toast.

ecosystem:       UserProfile = [
                   "@/app/user/profile/actions.ts",
                   "@/app/user/profile/page.tsx",
                   "@/app/user/profile/ProfileForm.tsx",
                   "@/lib/validations/profile.ts",
                 ]

relatedFiles:    ["@/app/user/profile/actions.ts",
                  "@/components/user/AvatarPicker.tsx",
                  "@/components/ui/avatar.tsx",
                  "@/utils/initials.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/user/profile/actions",
                  "@/components/user/AvatarPicker",
                  "@/components/ui/avatar",
                  "@/components/ui/button",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/ui/textarea",
                  "@/utils/initials"]

exports:         ["ProfileForm", "ProfileFormProps"]

useBy:           ["@/app/user/profile/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux modifier mon profil",
                  "*en tant qu'utilisateur je veux choisir et prévisualiser mon avatar"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState, useTransition, router.refresh, toast.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Loader2,
  Mail,
  Save,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import { updateProfileAction } from "@/app/user/profile/actions";
import { AvatarPicker } from "@/components/user/AvatarPicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initialsOf } from "@/utils/initials";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ProfileFormProps {
  readonly initial: {
    readonly name: string;
    readonly email: string;
    readonly image: string | null;
    readonly bio: string | null;
    readonly phone: string | null;
    readonly role: string;
    readonly createdAt: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function ProfileForm({ initial }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [bio, setBio] = useState(initial.bio ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [image, setImage] = useState(initial.image ?? "");
  const [isPending, startTransition] = useTransition();

  const dirty =
    name !== initial.name ||
    bio !== (initial.bio ?? "") ||
    phone !== (initial.phone ?? "") ||
    image !== (initial.image ?? "");

  const roleLabel =
    initial.role === "admin" ? "Administrateur" : "Utilisateur";
  const memberSince = new Date(initial.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!dirty) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("bio", bio.trim());
      formData.set("phone", phone.trim());
      formData.set("image", image.trim());

      const result = await updateProfileAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Profil mis à jour.");
      router.refresh();
    });
  }

  function handleReset() {
    setName(initial.name);
    setBio(initial.bio ?? "");
    setPhone(initial.phone ?? "");
    setImage(initial.image ?? "");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ----------------------------------------------------------- */}
      {/*  Identité (lecture seule)                                   */}
      {/* ----------------------------------------------------------- */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 sm:flex-row sm:items-center">
        <Avatar className="mx-auto size-20 shrink-0 sm:mx-0">
          {image && <AvatarImage src={image} alt="" />}
          <AvatarFallback className="bg-gradient-to-br from-chart-1 to-chart-2 text-xl font-bold text-white">
            {initialsOf(name || initial.email)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
          <h2 className="truncate text-lg font-bold text-foreground">
            {name || "Sans nom"}
          </h2>
          <p className="flex items-center justify-center gap-1.5 truncate text-sm text-muted-foreground sm:justify-start">
            <Mail className="size-3.5 shrink-0" aria-hidden />
            {initial.email}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
            <span className="inline-flex items-center gap-1 rounded-full bg-chart-1/15 px-2 py-0.5 text-[11px] font-semibold text-chart-1">
              <Shield className="size-3" aria-hidden />
              {roleLabel}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="size-3 shrink-0" aria-hidden />
              Membre depuis le {memberSince}
            </span>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- */}
      {/*  Informations personnelles (éditables)                      */}
      {/* ----------------------------------------------------------- */}
      <section className="space-y-5 rounded-2xl border border-border/60 bg-card p-5">
        <header>
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Informations personnelles
          </h2>
          <p className="text-xs text-muted-foreground">
            Ces informations sont visibles à côté de vos articles et
            commentaires.
          </p>
        </header>

        {/* Avatar — composant mutualisé avec RegisterForm */}
        <Field>
          <FieldLabel>Photo de profil</FieldLabel>
          <AvatarPicker
            value={image}
            onChange={setImage}
            name={name}
            disabled={isPending}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-name">Nom affiché</FieldLabel>
          <Input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={60}
            placeholder="Votre nom ou pseudo"
            autoComplete="name"
            aria-invalid={name.trim().length < 2 ? true : undefined}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-bio">Bio (optionnel)</FieldLabel>
          <Textarea
            id="profile-bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Quelques mots sur vous…"
            className="resize-none"
          />
          <p className="text-right text-[11px] tabular-nums text-muted-foreground">
            {bio.length}/500
          </p>
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-phone">
            Téléphone (optionnel)
          </FieldLabel>
          <Input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={30}
            placeholder="+33 6 12 34 56 78"
            autoComplete="tel"
          />
        </Field>
      </section>

      {/* ----------------------------------------------------------- */}
      {/*  Actions                                                    */}
      {/* ----------------------------------------------------------- */}
      <div className="flex flex-wrap justify-end gap-2">
        {dirty && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={isPending}
          >
            Réinitialiser
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending || !dirty || name.trim().length < 2}
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}