/*
path :           lib/prisma.ts
tag :            ["prisma", "db", "server-only", "singleton", "neon"]
projectId:       new-genesis
type:            config
generic:         true

role:            Singleton Prisma 7 avec adaptateur Neon (PostgreSQL
                 serverless). Évite de recréer un client à chaque
                 rechargement en dev en mémorisant l'instance sur
                 globalThis. La connexion vient de DATABASE_URL (URL
                 poolée, avec « -pooler » dans le hostname) validée par
                 @/lib/env. Importable UNIQUEMENT côté serveur.

                 L'adapter @prisma/adapter-neon est requis pour Prisma 7
                 sur Neon (serverless). Il utilise la connexion poolée
                 pour éviter de saturer les connexions Postgres quand
                 Vercel scale les fonctions. Les migrations, elles,
                 passent par DATABASE_URL_UNPOOLED via prisma7.config.ts.

flow:            createClient() → new PrismaNeon({ connectionString:
                 env.DATABASE_URL }) → new PrismaClient({ adapter }) →
                 export prisma (globalForPrisma.prisma ?? createClient()).

ecosystem:       Lib = [
                   "@/lib/env.ts",
                   "@/lib/prisma.ts",
                   "@/lib/utils.ts",
                 ]

relatedFiles:    ["@/lib/env.ts",
                  "@/lib/auth/auth.ts"]

imports:         ["server-only",
                  "@prisma/adapter-neon",
                  "@/lib/generated/prisma/client",
                  "@/lib/env"]

exports:         ["prisma", "default"]

useBy:           ["@/lib/auth/auth.ts",
                  "@/lib/auth/session.ts",
                  "@/lib/auth/rbac.ts"]

userStories:     ["*en tant que développeur je veux un client Prisma unique connecté à Neon"]

status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import "server-only";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { env } from "@/lib/env";

function createClient() {
  const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
