/*
path :           app/sitemap.ts
projectId:       <à fournir>
type:            config
generic:         false

role:            Génère dynamiquement /sitemap.xml. N'expose QUE les routes
                 publiques — les sections /back-studio, /auth et /user sont
                 volontairement exclues (elles sont déjà bloquées dans
                 robots.ts et derrière authentification).

flow:            Export default → map sur PUBLIC_ROUTES → Next.js résout la
                 route /sitemap.xml au build. Les routes dynamiques (articles
                 de blog publiés, projets publics) pourront être ajoutées
                 plus tard via une requête Prisma.

ecosystem:       SEO = [
                   "@/app/robots.ts",
                   "@/app/sitemap.ts",
                   "@/app/manifest.ts",
                 ]
relatedFiles:    ["@/lib/env.ts", "@/app/robots.ts", "@/lib/prisma.ts"]
imports:         ["next", "@/lib/env"]
exports:         ["default sitemap"]
useBy:           []

userStories:     ["*en tant que développeur je veux un sitemap pour le SEO"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

const SITE_URL = env.NEXT_PUBLIC_APP_URL;

/* ------------------------------------------------------------------ */
/*  Routes publiques statiques                                         */
/* ------------------------------------------------------------------ */

type StaticRoute = {
  readonly path: string;
  readonly changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  readonly priority: number;
};

const PUBLIC_ROUTES: readonly StaticRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
];

/* ------------------------------------------------------------------ */
/*  Sitemap                                                            */
/* ------------------------------------------------------------------ */

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}