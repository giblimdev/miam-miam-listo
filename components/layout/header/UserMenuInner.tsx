/*
path :           components/layout/header/UserMenuInner.tsx
tag :            ["layout", "header", "user-menu", "client", "auth", "inner"]
projectId:       new-genesis
type :           component
generic:         false

role:            Menu utilisateur interne. Contient TOUS les hooks
                 Better Auth (useSession) et React (useRouter). Chargé
                 dynamiquement en ssr:false par UserMenu.tsx pour éviter
                 le conflit React null dans Next 16 App Router.

                 Affiche :
                 - pendant le chargement : un Skeleton rond.
                 - si anonyme : un bouton « Se connecter » gradient vers
                   /auth/login.
                 - si connecté : un avatar cliquable ouvrant un
                   DropdownMenu (Profil, Mes équipes, Mes projets,
                   Mes articles, Favoris, Déconnexion).

flow:            Client Component → useRouter + useSession → si
                 isPending : Skeleton → si !session.user : bouton
                 Se connecter → sinon : DropdownMenu avec avatar et
                 items. handleLogout → signOut() → toast → router.replace
                 (« /auth/login ») → router.refresh().

ecosystem:       Layout = [
                   "@/components/layout/header/UserMenu.tsx",
                   "@/components/layout/header/UserMenuInner.tsx",
                   "@/components/layout/header/Header.tsx",
                   "@/utils/initials.ts",
                 ]

relatedFiles:    ["@/components/layout/header/Header.tsx",
                  "@/utils/initials.ts",
                  "@/lib/auth/auth-client.ts",
                  "@/components/ui/dropdown-menu.tsx",
                  "@/components/ui/avatar.tsx",
                  "@/components/ui/button.tsx",
                  "@/components/ui/skeleton.tsx"]

imports:         ["next/link", "next/navigation", "lucide-react", "sonner",
                  "@/components/ui/dropdown-menu",
                  "@/components/ui/avatar",
                  "@/components/ui/button",
                  "@/components/ui/skeleton",
                  "@/lib/auth/auth-client",
                  "@/utils/initials"]

exports:         ["default UserMenuInner"]

useBy:           ["@/components/layout/header/UserMenu.tsx"]

userStories:     ["*en tant qu'utilisateur je veux accéder à mon menu de compte"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useSession, useRouter, DropdownMenu, toast.

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Heart,
  LogOut,
  User as UserIcon,
  UserCircle2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut, useSession } from "@/lib/auth/auth-client";
import { initialsOf } from "@/utils/initials";

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export default function UserMenuInner() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  /* --- État : chargement --- */
  if (isPending) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  /* --- État : anonyme --- */
  if (!session?.user) {
    return (
      <Link
        href="/auth/login"
        className={`${buttonVariants({ size: "sm" })} gap-2 bg-gradient-to-r from-chart-1 to-chart-2 text-white shadow-md shadow-chart-1/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-chart-1/40 focus-visible:ring-2 focus-visible:ring-chart-1/40`}
      >
        <UserIcon className="h-4 w-4" aria-hidden />
        Se connecter
      </Link>
    );
  }

  /* --- État : connecté --- */
  const user = session.user;
  const initials = initialsOf(user.name);

  async function handleLogout() {
    try {
      await signOut();
      toast.success("À bientôt !");
      router.replace("/auth/login");
      router.refresh();
    } catch {
      toast.error("Impossible de se déconnecter. Réessayez.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border/60 transition-all duration-200 hover:ring-2 hover:ring-chart-1/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Menu utilisateur"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-0.5 rounded-full bg-gradient-to-br from-chart-1 via-chart-2 to-chart-5 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        />

        <Avatar className="relative h-8 w-8 ring-2 ring-background">
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback className="bg-gradient-to-br from-chart-1 to-chart-2 text-[11px] font-bold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-xl border-border/60 p-1.5 shadow-lg shadow-chart-1/10"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1.5 px-2 py-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {user.image && <AvatarImage src={user.image} alt="" />}
                <AvatarFallback className="bg-gradient-to-br from-chart-1 to-chart-2 text-xs font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold text-foreground">
                  {user.name}
                </span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-foreground transition-colors focus:bg-chart-1/10 focus:text-chart-1 data-highlighted:bg-chart-1/10 data-highlighted:text-chart-1"
            render={
              <Link href="/user/profile" className="flex items-center gap-2.5">
                <UserCircle2 className="h-4 w-4 text-chart-1" aria-hidden />
                <span>Profil</span>
              </Link>
            }
          />

          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-foreground transition-colors focus:bg-chart-2/10 focus:text-chart-2 data-highlighted:bg-chart-2/10 data-highlighted:text-chart-2"
            render={
              <Link href="/user/teams" className="flex items-center gap-2.5">
                <Users className="h-4 w-4 text-chart-2" aria-hidden />
                <span>Mes équipes</span>
              </Link>
            }
          />

          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-foreground transition-colors focus:bg-chart-3/10 focus:text-chart-3 data-highlighted:bg-chart-3/10 data-highlighted:text-chart-3"
            render={
              <Link href="/user/projects" className="flex items-center gap-2.5">
                <FolderKanban className="h-4 w-4 text-chart-3" aria-hidden />
                <span>Mes projets</span>
              </Link>
            }
          />
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-foreground transition-colors focus:bg-chart-2/10 focus:text-chart-2 data-highlighted:bg-chart-2/10 data-highlighted:text-chart-2"
            render={
              <Link
                href="/blog/user/articles"
                className="flex items-center gap-2.5"
              >
                <Users className="h-4 w-4 text-chart-2" aria-hidden />
                <span>Mes articles</span>
              </Link>
            }
          />

          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-foreground transition-colors focus:bg-chart-5/10 focus:text-chart-5 data-highlighted:bg-chart-5/10 data-highlighted:text-chart-5"
            render={
              <Link
                href="/blog/user/favorites"
                className="flex items-center gap-2.5"
              >
                <Heart className="h-4 w-4 text-chart-5" aria-hidden />
                <span>Favoris</span>
              </Link>
            }
          />
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={handleLogout}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-destructive transition-colors focus:bg-destructive/10 focus:text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span>Se déconnecter</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
