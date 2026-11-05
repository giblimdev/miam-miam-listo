/*
path :           components/layout/header/Logo.tsx
tag :            ["layout", "header", "logo", "ui"]
projectId:       miam-miam-listo
type:            component
generic:         false

role:            Logo de l'application. Affiche en priorité le logo
                 officiel "ListaMiam" (public/mainLogo.png) via <Image />.
                 Si l'image est absente (erreur 404, chemin invalide),
                 le composant bascule automatiquement sur le fallback
                 visuel historique : icône Sparkles dans un carré en
                 dégradé + wordmark texte. Sert de lien vers l'accueil.
                 Server Component statique, aucune interactivité au-delà
                 du survol CSS. Extrait pour être réutilisé par Header
                 (desktop + mobile) et Footer.

                 AJOUT `shrink-0` : le Link racine ne doit jamais être
                 compressé dans un conteneur flex (header mobile). Sans
                 cette contrainte, le logo peut pousser le burger hors
                 écran sur très petits viewports.

                 Note Next/Image (warning « has either width or height
                 modified, but not the other ») : <Image> est déclaré
                 avec width={160} height={32} pour le préchargement et
                 le calcul du layout, mais la taille finale est pilotée
                 par CSS (`h-8` + `w-auto`). Next.js exige alors que les
                 DEUX dimensions soient déclarées `auto` en style inline
                 — sinon il compare width/height déclarés aux styles et
                 lève le warning. On déclare donc `width: "auto"` ET
                 `height: "auto"` ; la hauteur réelle reste fixée par
                 `h-8` (32px), la largeur est déduite du ratio par le
                 navigateur.

flow:            Server Component → rend un <Link> vers "/" contenant
                 soit l'image <Image src="/mainLogo.png" />, soit le
                 fallback (icône + texte).

ecosystem:       Layout = [
                   "@/app/blog/components/NotificationBell.tsx",
                   "@/app/globals.css",
                   "@/app/layout.tsx",
                   "@/components/layout/footer/Footer.tsx",
                   "@/components/layout/header/Header.tsx",
                   "@/components/layout/header/Logo.tsx",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/NavActiveLink.tsx",
                   "@/components/layout/header/UserMenu.tsx",
                   "@/components/layout/header/UserMenuInner.tsx",
                   "@/components/layout/header/nav/frontWorkSpace.ts",
                   "@/components/layout/header/navTypes.ts",
                   "@/components/ui/sheet.tsx",
                   "@/components/ui/sonner.tsx",
                   "@/components/ui/tooltip.tsx",
                   "@/config/navigation.ts",
                   "@/config/roles.ts",
                 ]

relatedFiles:    ["@/components/layout/header/Header.tsx",
                  "@/components/layout/footer/Footer.tsx",
                  "public/mainLogo.png"]

imports:         ["next/link", "next/image", "lucide-react"]

exports:         ["default Logo"]

useBy:           ["@/components/layout/header/Header.tsx",
                  "@/components/layout/footer/Footer.tsx"]

userStories:     ["*en tant qu'utilisateur je veux un logo cliquable qui ramène à l'accueil"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";

export default function Logo() {
  // Permet de basculer facilement sur le fallback si l'image
  // n'est pas encore prête ou si on veut la retirer.
  const useImage = true;

  return (
    <Link
      href="/"
      aria-label="Retour à l'accueil"
      className="group inline-flex shrink-0 items-center gap-2 rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {useImage ? (
        <Image
          src="/mainLogo.png"
          alt="ListaMiam"
          width={160}
          height={32}
          className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          style={{ width: "auto", height: "auto" }}
          priority
        />
      ) : (
        /* Fallback : icône + texte */
        <>
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            ListaMiam
          </span>
        </>
      )}
    </Link>
  );
}