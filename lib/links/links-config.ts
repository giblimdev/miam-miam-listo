/*
path :           lib/links/links-config.ts
tag :            ["links", "config", "data", "external", "resources", "apps"]
projectId:       eval-biz
type:            config
generic:         true

role:            Source de vérité statique des liens externes affichés
                 sur la page /links. Aucune I/O, aucun état : simple
                 tableau typé exposé tel quel. Chaque entrée porte un
                 identifiant stable (id), un libellé, une URL, une
                 description courte, une catégorie (qui sert au tri
                 d'affichage) et un accent Tailwind (chart-1..5) pour
                 colorer la carte. Les catégories sont dérivées
                 dynamiquement pour éviter une double source de vérité.

                 Rubrique "Apps" : déploiements Vercel du projet
                 (haciendaesmeralda, miam-miam-tau, fast-book-in,
                 fm-online-ten). Libellés humanisés depuis le slug,
                 descriptions neutres (aucune fonctionnalité inventée).

                 ✘ Pas de Prisma, ✘ pas de Zod, ✘ pas de Server Action :
                 ce module est volontairement sans dépendance runtime
                 (importable côté serveur ET client) pour rester trivial
                 à maintenir. Si un jour les liens doivent être édités
                 en admin, il faudra créer un modèle Prisma + validation
                 + action + formulaire, et remplacer CETTE constante par
                 un fetch de service — la page /links n'aura qu'à changer
                 sa source, pas sa structure.

flow:            Module TypeScript pur → export des types
                 ExternalLinkCategory et ExternalLink, de la constante
                 EXTERNAL_LINKS (readonly) et du helper dérivé
                 listLinkCategories() qui retourne les catégories
                 uniques dans l'ordre d'apparition.

ecosystem:       Links = [
                   "@/app/links/page.tsx",
                   "@/lib/links/links-config.ts",
                 ]

relatedFiles:    ["@/components/ui/empty-state.tsx",
                  "@/components/ui/skeleton.tsx"]

imports:         []

exports:         ["ExternalLinkCategory", "ExternalLink",
                  "EXTERNAL_LINKS", "listLinkCategories"]

useBy:           ["@/app/links/page.tsx"]

userStories:     ["*en tant que développeur je veux une source de vérité statique pour les liens externes",
                  "*en tant qu'admin je veux accéder aux déploiements Vercel du projet"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Catégories d'affichage. Utilisé comme discriminant pour le tri
 * visuel (chaque catégorie = une section ou un groupement).
 *
 * "Apps" regroupe les déploiements Vercel du projet. Ajoutée en tête
 * de l'union pour qu'elle apparaisse en premier dans le rendu (l'ordre
 * des sections est dérivé de l'ordre d'apparition dans EXTERNAL_LINKS,
 * cf. listLinkCategories).
 */
export type ExternalLinkCategory =
  | "Apps"
  | "Documentation"
  | "Outils"
  | "Apprentissage"
  | "Communauté"
  | "Design";

export interface ExternalLink {
  /** Identifiant stable (clé React, référence). */
  readonly id: string;
  /** Libellé affiché sur la carte. */
  readonly label: string;
  /** URL cible (externe, ouverte dans un nouvel onglet). */
  readonly href: string;
  /** Description courte (1 à 2 phrases). */
  readonly description: string;
  /** Catégorie de regroupement visuel. */
  readonly category: ExternalLinkCategory;
  /** Couleur d'accent Tailwind (ex. "chart-1"). */
  readonly accent: string;
}

/* ------------------------------------------------------------------ */
/*  Données                                                            */
/* ------------------------------------------------------------------ */

/**
 * Liste curée des liens externes utiles au projet. Ordre d'apparition
 * = ordre d'affichage dans chaque catégorie (le tri par catégorie
 * est fait côté page). Pour ajouter un lien : ajouter une entrée ici,
 * c'est tout.
 *
 * ⚠️ Les descriptions des entrées "Apps" sont neutres (déploiement
 * Vercel). Remplace-les par la vraie fonctionnalité de chaque app
 * quand elle sera connue.
 */
export const EXTERNAL_LINKS: readonly ExternalLink[] = [
  /* --------------------------- APPS --------------------------- */
  {
    id: "hacienda-esmeralda",
    label: "Hacienda Esmeralda",
    href: "https://haciendaesmeralda.vercel.app/",
    description: "Application déployée sur Vercel.",
    category: "Apps",
    accent: "chart-2",
  },
  {
    id: "miam-miam",
    label: "Miam Miam",
    href: "https://miam-miam-tau.vercel.app/",
    description: "Application déployée sur Vercel.",
    category: "Apps",
    accent: "chart-2",
  },
  {
    id: "fast-book-in",
    label: "Fast Book In",
    href: "https://fast-book-in.vercel.app/",
    description: "Application déployée sur Vercel.",
    category: "Apps",
    accent: "chart-2",
  },
  {
    id: "fm-online",
    label: "FM Online",
    href: "https://fm-online-ten.vercel.app/",
    description: "Application déployée sur Vercel.",
    category: "Apps",
    accent: "chart-2",
  },

  /* ------------------------ DOCUMENTATION ---------------------- */
  {
    id: "nextjs-docs",
    label: "Next.js Documentation",
    href: "https://nextjs.org/docs",
    description:
      "Documentation officielle de Next.js : App Router, Cache Components, Server Actions, Data Fetching.",
    category: "Documentation",
    accent: "chart-1",
  },
  {
    id: "react-docs",
    label: "React Documentation",
    href: "https://react.dev",
    description:
      "Documentation officielle de React 19 : hooks, Server Components, transitions.",
    category: "Documentation",
    accent: "chart-1",
  },
  {
    id: "prisma-docs",
    label: "Prisma Documentation",
    href: "https://www.prisma.io/docs",
    description:
      "Guide Prisma 7 : schéma, migrations, client typé, adaptateurs.",
    category: "Documentation",
    accent: "chart-1",
  },
  {
    id: "better-auth-docs",
    label: "Better Auth",
    href: "https://www.better-auth.com/docs",
    description:
      "Authentification moderne pour TypeScript : sessions, OAuth, Prisma adapter.",
    category: "Documentation",
    accent: "chart-1",
  },
  {
    id: "tailwind-docs",
    label: "Tailwind CSS v4",
    href: "https://tailwindcss.com/docs",
    description:
      "Utilitaires CSS, design tokens @theme, variantes responsive mobile-first.",
    category: "Documentation",
    accent: "chart-1",
  },
  {
    id: "zod-docs",
    label: "Zod",
    href: "https://zod.dev",
    description:
      "Validation TypeScript-first : schémas, discriminatedUnion, refinements.",
    category: "Documentation",
    accent: "chart-1",
  },

  /* --------------------------- OUTILS ------------------------- */
  {
    id: "vercel",
    label: "Vercel",
    href: "https://vercel.com",
    description:
      "Plateforme de déploiement Next.js, preview deployments, edge functions.",
    category: "Outils",
    accent: "chart-2",
  },
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com",
    description: "Hébergement de code, pull requests, actions CI/CD.",
    category: "Outils",
    accent: "chart-2",
  },
  {
    id: "shadcn",
    label: "shadcn/ui",
    href: "https://ui.shadcn.com",
    description:
      "Composants UI accessibles basés sur Base UI — design system du projet.",
    category: "Outils",
    accent: "chart-2",
  },
  {
    id: "lucide",
    label: "Lucide Icons",
    href: "https://lucide.dev/icons",
    description:
      "Bibliothèque d'icônes SVG cohérente utilisée dans toute l'application.",
    category: "Outils",
    accent: "chart-2",
  },

  /* ----------------------- APPRENTISSAGE ---------------------- */
  {
    id: "mdn",
    label: "MDN Web Docs",
    href: "https://developer.mozilla.org",
    description:
      "Référence ultime HTML, CSS, JavaScript, APIs navigateur et accessibilité.",
    category: "Apprentissage",
    accent: "chart-3",
  },
  {
    id: "web-dev",
    label: "web.dev",
    href: "https://web.dev",
    description:
      "Guides Google sur la performance, l'accessibilité et les bonnes pratiques web.",
    category: "Apprentissage",
    accent: "chart-3",
  },
  {
    id: "patterns",
    label: "Patterns.dev",
    href: "https://www.patterns.dev",
    description:
      "Patterns de conception modernes pour React et le web (rendering, data fetching).",
    category: "Apprentissage",
    accent: "chart-3",
  },

  /* ------------------------- COMMUNAUTÉ ----------------------- */
  {
    id: "github-discussions",
    label: "GitHub Discussions",
    href: "https://github.com/orgs/vercel/discussions",
    description:
      "Discussions de la communauté Vercel / Next.js : retours d'expérience, help.",
    category: "Communauté",
    accent: "chart-4",
  },
  {
    id: "reactiflux",
    label: "Reactiflux",
    href: "https://www.reactiflux.com",
    description:
      "Communauté Discord React : entraide, veille, discussions techniques.",
    category: "Communauté",
    accent: "chart-4",
  },

  /* ---------------------------- DESIGN ------------------------ */
  {
    id: "figma",
    label: "Figma",
    href: "https://www.figma.com",
    description:
      "Outil de design collaboratif : maquettes, prototypes, design system.",
    category: "Design",
    accent: "chart-5",
  },
  {
    id: "coolors",
    label: "Coolors",
    href: "https://coolors.co",
    description:
      "Générateur de palettes de couleurs pour les accents chart-1..chart-5.",
    category: "Design",
    accent: "chart-5",
  },
  {
    id: "realtime-colors",
    label: "Realtime Colors",
    href: "https://realtimecolors.com",
    description:
      "Prévisualise une palette sur une UI réaliste (texte, fond, accents).",
    category: "Design",
    accent: "chart-5",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers dérivés                                                    */
/* ------------------------------------------------------------------ */

/**
 * Retourne les catégories uniques dans l'ordre d'apparition dans
 * EXTERNAL_LINKS. Évite une double source de vérité (pas de constante
 * séparée à maintenir).
 *
 * Grâce à l'ordre des entrées ci-dessus, "Apps" apparaît en premier,
 * puis "Documentation", "Outils", "Apprentissage", "Communauté",
 * "Design".
 */
export function listLinkCategories(): readonly ExternalLinkCategory[] {
  const seen = new Set<ExternalLinkCategory>();
  const result: ExternalLinkCategory[] = [];
  for (const link of EXTERNAL_LINKS) {
    if (!seen.has(link.category)) {
      seen.add(link.category);
      result.push(link.category);
    }
  }
  return result;
}
