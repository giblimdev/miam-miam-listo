/*
path :           components/layout/footer/Footer.tsx
tag :            ["layout", "footer", "navigation", "ui", "cached"]
projectId:       new-genesis
type:            component
generic:         false

role:            Pied de page global de l'application. Présente la marque
                 (logo partagé + tagline + réseaux), trois colonnes de liens
                 (Produit, Ressources, Légal) et une ligne de bas de page
                 avec copyright dynamique. Le composant est mis en cache
                 ("use cache" en tête de fichier) : il doit donc être
                 async (exigence Next.js pour les fonctions cachées). Cela
                 permet d'utiliser new Date() lors du prérendu sans bloquer
                 les routes statiques (Cache Components de Next 16).
                 Le logo et le wordmark sont délégués à <Logo />
                 (components/layout/header/Logo.tsx) — source unique de
                 vérité pour la marque, réutilisée par Header et Footer.
                 Les icônes de marque (GitHub, X, LinkedIn) sont rendues
                 en SVG inline car lucide-react ne les exporte plus
                 (trademark).

flow:            Cache boundary (file-level "use cache") → le composant
                 async est rendu une fois puis réutilisé → <footer> avec
                 conteneur max-w-6xl → grille 1 / 2 / 4 colonnes (brand +
                 3 colonnes de liens) → ligne de bas avec année + slogan.

ecosystem:       Layout = [
                   "@/app/globals.css",
                   "@/app/layout.tsx",
                   "@/components/layout/footer/Footer.tsx",
                   "@/components/layout/header/Header.tsx",
                   "@/components/layout/header/Logo.tsx",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/UserMenu.tsx",
                   "@/components/layout/header/nav/frontWorkSpace.ts",
                   "@/components/layout/header/navTypes.ts",
                   "@/components/ui/sonner.tsx",
                   "@/components/ui/tooltip.tsx",
                 ]

relatedFiles:    ["@/app/layout.tsx",
                  "@/components/layout/header/Header.tsx",
                  "@/components/layout/header/Logo.tsx"]

imports:         ["next/link", "lucide-react",
                  "@/components/layout/header/Logo"]

exports:         ["default Footer"]

useBy:           ["@/app/layout.tsx"]

userStories:     ["*en tant qu'utilisateur je veux accéder aux liens principaux et aux mentions depuis toutes les pages"]

status:          planned
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use cache";

import Link from "next/link";
import { Mail } from "lucide-react";

import Logo from "@/components/layout/header/Logo";

/* ------------------------------------------------------------------ */
/*  Icônes de marque — SVG inline                                      */
/*  (lucide-react >= 1.x ne les exporte plus pour trademark)           */
/* ------------------------------------------------------------------ */

function GithubIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.1.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.19a11 11 0 0 1 5.79 0c2.21-1.5 3.18-1.19 3.18-1.19.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.26 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function XIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

type SocialIconComponent = React.ComponentType<{ readonly className?: string }>;

interface FooterLink {
  readonly href: string;
  readonly label: string;
}

interface SocialLink {
  readonly href: string;
  readonly label: string;
  readonly icon: SocialIconComponent;
}

const PRODUCT_LINKS: readonly FooterLink[] = [
  { href: "/core", label: "Conception" },
  { href: "/genesis", label: "Outils" },
  { href: "/blog", label: "Blog" },
];

const RESOURCE_LINKS: readonly FooterLink[] = [
  { href: "/genesis/read-files", label: "SelectFiles" },
  { href: "/genesis/create-files", label: "CreateFiles" },
  { href: "/genesis/copy-to-ia", label: "CopyToIA" },
];

const LEGAL_LINKS: readonly FooterLink[] = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/contact", label: "Contact" },
];

const SOCIAL_LINKS: readonly SocialLink[] = [
  { href: "https://github.com", label: "GitHub", icon: GithubIcon },
  { href: "https://x.com", label: "X (Twitter)", icon: XIcon },
  { href: "https://linkedin.com", label: "LinkedIn", icon: LinkedinIcon },
  { href: "mailto:contact@example.com", label: "Email", icon: Mail },
];

/* ------------------------------------------------------------------ */
/*  Sous-composants                                                    */
/* ------------------------------------------------------------------ */

function FooterColumn({
  title,
  links,
}: {
  readonly title: string;
  readonly links: readonly FooterLink[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export default async function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Marque */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo />

            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              L&apos;atelier qui structure vos projets. Conception,
              planification, développement.
            </p>

            <ul className="mt-4 flex gap-2">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="grid size-9 place-items-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Icon className="size-4" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <FooterColumn title="Produit" links={PRODUCT_LINKS} />
          <FooterColumn title="Ressources" links={RESOURCE_LINKS} />
          <FooterColumn title="Légal" links={LEGAL_LINKS} />
        </div>

        {/* Bas de page */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {year} Genesis. Tous droits réservés.</p>
          <p>Fait avec Next.js, React et Better Auth.</p>
        </div>
      </div>
    </footer>
  );
}
