/*
path :           app/user/profile/page.tsx
tag :            ["user", "profile", "page", "platform-role"]
projectId:       new-genesis
type :           page
generic:         false

role:            Page de profil utilisateur. Sync page + Suspense ; la
                 lecture du profil et du rôle plateforme est isolée dans
                 un composant async. Affiche les informations du profil
                 (nom, email, bio, téléphone, rôle plateforme en badge)
                 et un formulaire d'édition (délégué à ProfileForm). Le
                 rôle plateforme est affiché en lecture seule (badge),
                 il ne peut pas être modifié par l'utilisateur lui-même
                 (seul un super-admin peut le faire depuis
                 /super-admin/users). Le rôle est lu depuis
                 User.platformRole (enum Prisma).

flow:            Sync page → <Suspense fallback=<ProfileSkeleton />> →
                 <ProfileSection params /> async → requireSession() +
                 prisma.user.findUnique({ select: { platformRole: true }})
                 → <ProfileForm user={user} />. Le formulaire
                 ProfileForm (existant) reçoit le user et affiche le
                 rôle plateforme en lecture seule.

ecosystem:       UserProfile = [
                   "@/app/user/profile/actions.ts",
                   "@/app/user/profile/page.tsx",
                   "@/app/user/profile/ProfileForm.tsx",
                   "@/lib/validations/profile.ts",
                 ]

relatedFiles:    ["@/app/user/profile/ProfileForm.tsx",
                  "@/lib/auth/rbac.ts",
                  "@/lib/prisma.ts",
                  "@/config/roles.ts"]

imports:         ["next", "react", "next/navigation",
                  "@/lib/auth/rbac",
                  "@/lib/prisma",
                  "@/config/roles.ts",
                  "@/app/user/profile/ProfileForm",
                  "@/components/ui/skeleton"]

exports:         ["default UserProfilePage", "metadata"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux voir et modifier mon profil"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { requireSession } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import {
  PLATFORM_ROLE_LABELS,
  type PlatformRole,
} from "@/config/roles";
import { ProfileForm } from "@/app/user/profile/ProfileForm";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Mon profil",
  description: "Gérez vos informations personnelles.",
};

/* ------------------------------------------------------------------ */
/*  Helper : conversion string Prisma → PlatformRole                   */
/* ------------------------------------------------------------------ */

function toPlatformRole(raw: string): PlatformRole {
  return raw === "user" || raw === "admin" || raw === "superAdmin"
    ? raw
    : "user";
}

/* ------------------------------------------------------------------ */
/*  Page (sync)                                                        */
/* ------------------------------------------------------------------ */

export default function UserProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Mon profil
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos informations personnelles et votre avatar.
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
  let sessionUser;
  try {
    sessionUser = await requireSession();
  } catch {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      platformRole: true,
      profile: {
        select: {
          bio: true,
          phone: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const platformRole = toPlatformRole(user.platformRole);

  return (
    <div className="space-y-6">
      {/* Badge rôle plateforme (lecture seule) */}
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Rôle plateforme
        </span>
        <span className="inline-flex items-center rounded-full bg-chart-2/15 px-2.5 py-0.5 text-xs font-medium text-chart-2">
          {PLATFORM_ROLE_LABELS[platformRole]}
        </span>
        <span className="text-xs text-muted-foreground">
          (modifiable uniquement par un super-administrateur)
        </span>
      </div>

      {/* Formulaire de profil */}
      <ProfileForm
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          bio: user.profile?.bio ?? null,
          phone: user.profile?.phone ?? null,
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}