/*
path :           app/robots.ts
projectId:       <à fournir>
type:            config
generic:         false

role:            Génère dynamiquement /robots.txt. Autorise l'indexation de
                 la vitrine publique et bloque les routes privées (API,
                 Back-Studio, Auth, espace utilisateur).

flow:            Export default → Next.js résout la route /robots.txt au build.
                 Lit NEXT_PUBLIC_APP_URL depuis @/lib/env pour construire
                 l'URL absolue du sitemap.

ecosystem:       SEO = [
                   "@/app/robots.ts",
                   "@/app/sitemap.ts",
                   "@/app/manifest.ts",
                 ]
relatedFiles:    ["@/lib/env.ts", "@/app/sitemap.ts"]
imports:         ["next", "@/lib/env"]
exports:         ["default robots"]
useBy:           []

userStories:     ["*en tant que développeur je veux contrôler l'indexation du site"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

const SITE_URL = env.NEXT_PUBLIC_APP_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/back-studio/",
          "/auth/",
          "/user/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}