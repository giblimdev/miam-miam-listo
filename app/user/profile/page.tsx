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
                 et un formulaire d'édition (délégué à ProfileForm qui
                 attend une prop `initial`). Le rôle plateforme est
                 affiché en lecture seule (badge), il ne peut pas être
                 modifié par l'utilisateur lui-même (seul un super-admin
                 peut le faire depuis /super-admin/users). Le rôle est lu
                 depuis User.platformRole (enum Prisma) et converti en
                 PlatformRole via toPlatformRole().

flow:            Sync page → <Suspense fallback=<ProfileSkeleton />> →
                 <ProfileSection /> async → requireSession() +
                 prisma.user.findUnique({ select: { name, email, image,
                 platformRole, createdAt, profile: { bio, phone } } })
                 → <ProfileForm initial={{ name, email, image, bio,
                 phone, platformRole, createdAt }} />.

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

import { requireSession } from "@/lib/auth/rbca";
import { prisma } from "@/lib/prisma";
import { type PlatformRole } from "@/config/roles";
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
      name: true,
      email: true,
      image: true,
      platformRole: true,
      createdAt: true,
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
    <ProfileForm
      initial={{
        name: user.name,
        email: user.email,
        image: user.image,
        bio: user.profile?.bio ?? null,
        phone: user.profile?.phone ?? null,
        platformRole,
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
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="space-y-4 rounded-2xl border border-border/60 p-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
