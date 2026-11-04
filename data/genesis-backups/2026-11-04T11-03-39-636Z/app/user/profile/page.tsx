/*
path :           app/user/profile/page.tsx
tag :            ["user", "profile", "page", "protected", "io"]
projectId:       new-genesis
type:            page
generic:         false

role:            Page de profil utilisateur. Affiche et permet d'éditer
                 nom, bio, téléphone et avatar. Sync page + Suspense ;
                 la lecture session + Prisma est isolée dans un
                 composant async sous Suspense. Requiert une session ;
                 un visiteur anonyme voit un CTA « Se connecter ».
                 Un utilisateur soft-deleted (deletedAt non null) voit
                 un message « Compte désactivé ».

                 ⚠️ `await io()` AVANT getSession() ET AVANT Prisma :
                 Prisma 7 lit new Date() de manière synchrone dans son
                 NowGenerator (bug connu, issue #28588). Sans point de
                 suspension préalable sous <Suspense>, Next.js lève
                 « Blocking Route » au prérendu.

flow:            Sync page → <Suspense fallback=<ProfileSkeleton />>
                 → ProfileSection async → await io() → getSession()
                 → si null : CTA login → Promise.all([user.findUnique,
                 profile.findUnique]) → si user null : erreur → si
                 user.deletedAt : « Compte désactivé » → <ProfileForm
                 initial={...} />.

ecosystem:       UserProfile = [
                   "@/app/user/profile/actions.ts",
                   "@/app/user/profile/page.tsx",
                   "@/app/user/profile/ProfileForm.tsx",
                   "@/lib/validations/profile.ts",
                 ]

relatedFiles:    ["@/app/user/profile/ProfileForm.tsx",
                  "@/app/user/profile/actions.ts",
                  "@/lib/prisma.ts",
                  "@/lib/auth/session.ts",
                  "@/components/ui/button.tsx",
                  "@/components/ui/skeleton.tsx"]

imports:         ["next", "react", "next/link", "next/cache", "lucide-react",
                  "@/lib/prisma",
                  "@/lib/auth/session",
                  "@/app/user/profile/ProfileForm",
                  "@/components/ui/button",
                  "@/components/ui/skeleton"]

exports:         ["default UserProfilePage", "metadata"]

useBy:           ["@/components/layout/header/UserMenu.tsx"]

userStories:     ["*en tant qu'utilisateur je veux voir et modifier mon profil"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import { Suspense } from "react";
import Link from "next/link";
import { io } from "next/cache";
import type { Metadata } from "next";
import { ArrowRight, ShieldAlert, UserCircle2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { ProfileForm } from "@/app/user/profile/ProfileForm";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Mon profil",
  description:
    "Gérez vos informations personnelles : nom affiché, bio, téléphone et avatar.",
};

/* ------------------------------------------------------------------ */
/*  Page (sync)                                                        */
/* ------------------------------------------------------------------ */

export default function UserProfilePage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-1">
          Mon compte
        </p>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <UserCircle2 className="size-5 text-chart-1" aria-hidden />
          Mon profil
        </h1>
        <p className="text-sm text-muted-foreground">
          Modifiez votre nom, votre bio, votre téléphone et votre avatar.
        </p>
      </header>

      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileSection />
      </Suspense>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section async                                                      */
/* ------------------------------------------------------------------ */

async function ProfileSection() {
  /* ⚠️ io() AVANT Prisma : Prisma 7 lit new Date() de façon synchrone
     dans son NowGenerator (bug connu). Sans point de suspension
     préalable sous <Suspense>, Next.js lève « Blocking Route ». */
  await io();

  const session = await getSession();
  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour accéder à votre profil.
        </p>
        <Link
          href="/core/auth/login"
          className={`${buttonVariants()} mt-4 gap-2`}
        >
          Se connecter
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
    }),
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { bio: true, phone: true },
    }),
  ]);

  if (!user) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
        <p className="text-sm text-destructive">
          Utilisateur introuvable.
        </p>
      </div>
    );
  }

  if (user.deletedAt) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
        <ShieldAlert
          className="size-8 text-destructive"
          aria-hidden
        />
        <p className="text-sm font-semibold text-destructive">
          Compte désactivé
        </p>
        <p className="text-xs text-muted-foreground">
          Ce compte a été désactivé. Contactez un administrateur si vous
          pensez qu&apos;il s&apos;agit d&apos;une erreur.
        </p>
      </div>
    );
  }

  return (
    <ProfileForm
      initial={{
        name: user.name,
        email: user.email,
        image: user.image,
        bio: profile?.bio ?? null,
        phone: profile?.phone ?? null,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 sm:flex-row sm:items-center">
        <Skeleton className="mx-auto size-20 rounded-full sm:mx-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="mx-auto h-5 w-40 sm:mx-0" />
          <Skeleton className="mx-auto h-4 w-56 sm:mx-0" />
          <Skeleton className="mx-auto h-4 w-48 sm:mx-0" />
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}