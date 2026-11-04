/*
path :           components/layout/header/UserMenu.tsx
tag :            ["layout", "header", "user-menu", "client", "auth"]
projectId:       new-genesis
type :           component
generic:         false

role:            Wrapper client du menu utilisateur. Ce composant ne
                 contient AUCUN hook Better Auth : il charge
                 dynamiquement UserMenuInner en ssr:false. C'est la
                 parade au conflit React 19 + Next 16 + Better Auth qui
                 rend les hooks React null dans le bundle client et lève
                 « Cannot read properties of null (reading 'useRef') »
                 à l'appel de useSession().

                 Le composant affiche un Skeleton pendant le chargement
                 du chunk client. Une fois UserMenuInner monté côté
                 navigateur, celui-ci gère l'état anonyme/connecté
                 (bouton Se connecter ou avatar + DropdownMenu).

flow:            Client Component → rend <UserMenuInner /> via
                 next/dynamic({ ssr: false, loading: Skeleton }) →
                 UserMenuInner s'exécute uniquement côté navigateur et
                 appelle useSession() sans conflit SSR.

ecosystem:       Layout = [
                   "@/components/layout/header/UserMenu.tsx",
                   "@/components/layout/header/UserMenuInner.tsx",
                   "@/components/layout/header/Header.tsx",
                   "@/utils/initials.ts",
                 ]

relatedFiles:    ["@/components/layout/header/UserMenuInner.tsx",
                  "@/components/layout/header/Header.tsx",
                  "@/components/ui/skeleton.tsx"]

imports:         ["next/dynamic",
                  "@/components/ui/skeleton"]

exports:         ["default UserMenu"]

useBy:           ["@/components/layout/header/Header.tsx"]

userStories:     ["*en tant qu'utilisateur je veux accéder à mon menu de compte"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : dynamic(ssr: false) n'est utilisable que côté client.

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Import dynamique sans SSR                                          */
/* ------------------------------------------------------------------ */

/**
 * UserMenuInner contient useSession() et tous les hooks Better Auth.
 * On le charge SANS SSR (ssr: false) pour que le hook ne soit jamais
 * exécuté pendant le rendu serveur, là où React est résolu comme null
 * dans le bundle Next 16 + React 19. Pendant le chargement du chunk,
 * on affiche un Skeleton de la taille de l'avatar.
 */
const UserMenuInner = dynamic(() => import("./UserMenuInner"), {
  ssr: false,
  loading: () => <Skeleton className="h-9 w-9 rounded-full" />,
});

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export default function UserMenu() {
  return <UserMenuInner />;
}
