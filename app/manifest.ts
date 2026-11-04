/*
path :           app/manifest.ts
projectId:       <à fournir>
type:            config
generic:         false

role:            Génère dynamiquement /manifest.webmanifest. Rend l'app
                 installable en PWA. Couleurs alignées sur le design system :
                 violet chart-1 (#7c3aed) comme theme_color, blanc comme
                 background_color.

flow:            Export default → Next.js résout la route au build. Les icônes
                 référencées (icon-192.png, icon-512.png, icon-maskable-512.png)
                 doivent exister dans /public.

ecosystem:       SEO = [
                   "@/app/robots.ts",
                   "@/app/sitemap.ts",
                   "@/app/manifest.ts",
                 ]
relatedFiles:    ["@/app/layout.tsx"]
imports:         ["next"]
exports:         ["default manifest"]
useBy:           []

userStories:     ["*en tant qu'utilisateur je veux installer l'app sur mon écran d'accueil"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Genesis — Atelier de conception et de développement",
    short_name: "Genesis",
    description:
      "L'atelier qui structure vos projets : conception, planification, développement.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#7c3aed",
    lang: "fr",
    categories: ["productivity", "developer"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}