/*
path :           next.config.ts
tag :            ["next", "config", "server-external", "prisma", "neon", "turbopack", "webpack", "better-auth"]
projectId:       new-genesis
type :           config
generic:         false

role:            Configuration Next.js 16. Conserve l'intégralité de la
                 config existante (experimental.agentFeedback,
                 experimental.serverActions.bodySizeLimit,
                 cacheComponents, partialPrefetching, reactCompiler,
                 turbopack.rules pour Tailwind) et AJOUTE deux réglages
                 pour corriger les erreurs runtime liées à Prisma/Neon
                 et à Better Auth :
                 1. serverExternalPackages : empêche Turbopack de bundler
                    les drivers de base de données (@prisma/adapter-neon,
                    @prisma/client, @neondatabase/serverless) et
                    better-auth. Sans ça, Turbopack échoue avec
                    « Module not found: Can't resolve '@prisma/adapter-neon' ».
                 2. webpack.resolve.alias : force la résolution de
                    better-auth/react vers sa version CommonJS
                    (index.cjs). Sans cet alias, le hook useSession()
                    importe des références React null au runtime et lève
                    « Cannot read properties of null (reading 'useRef') »
                    (bug d'interop ESM/CJS connu avec React 19).

flow:            Module de configuration → lu par `next dev` et
                 `next build`. Turbopack applique les règles CSS
                 (Tailwind) et marque les serverExternalPackages comme
                 externes. Webpack applique l'alias better-auth/react
                 lors du build. Le reste de la config (cacheComponents,
                 partialPrefetching, reactCompiler) est appliqué tel
                 quel.

ecosystem:       NextConfig = [
                   "@/next.config.ts",
                 ]

relatedFiles:    ["@/lib/prisma.ts",
                  "@/lib/auth/auth-client.ts",
                  "@/package.json"]

imports:         ["next", "node:path"]

exports:         ["default nextConfig"]

useBy:           []

userStories:     ["*en tant que développeur je veux que Next.js charge l'adapter Neon et Better Auth au runtime"]

status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /**
   * Packages serveur à NE PAS bundler par Turbopack.
   * Obligatoire pour les drivers de base de données : sans cette
   * liste, Turbopack tente de bundler @prisma/adapter-neon et échoue
   * avec « Module not found: Can't resolve '@prisma/adapter-neon' ».
   */
  serverExternalPackages: [
    "@prisma/adapter-neon",
    "@prisma/client",
    "@neondatabase/serverless",
    "better-auth",
  ],

  experimental: {
    agentFeedback: true,
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  webpack: (config) => {
    /**
     * Force la version CommonJS de better-auth/react.
     * Sans cet alias, React 19 + Next 16 + Turbopack chargent la
     * version ESM (index.mjs), qui résout mal les hooks React
     * (useRef, useSyncExternalStore) et lève
     * « Cannot read properties of null (reading 'useRef') »
     * à l'appel de useSession() dans UserMenu.tsx.
     */
    config.resolve.alias = {
      ...config.resolve.alias,
      "better-auth/react$": path.resolve(
        __dirname,
        "node_modules/better-auth/dist/client/react/index.cjs",
      ),
    };
    return config;
  },
};

export default nextConfig;
