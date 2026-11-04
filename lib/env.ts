/*
path :           lib/env.ts
projectId:       new-genesis
type:            config
generic:         true

role:            Validation et typage des variables d'environnement au
                 démarrage. Empêche le build ou le démarrage serveur si
                 une variable critique manque ou est mal formée. Source
                 unique de vérité pour tous les accès à process.env côté
                 serveur.

                 Base de données : deux variables distinctes pour Neon.
                 - DATABASE_URL          : connexion POOLÉE (runtime,
                   utilisée par l'adapter @prisma/adapter-neon dans
                   lib/prisma.ts). Hostname avec « -pooler ».
                 - DATABASE_URL_UNPOOLED : connexion DIRECTE (migrations
                   Prisma CLI, lue par prisma7.config.ts). Hostname sans
                   « -pooler ». Requise pour que `prisma migrate` puisse
                   exécuter les prepared statements, que le pooler
                   PgBouncer ne supporte pas.

flow:            Au premier import, envSchema.safeParse() valide
                 process.env → si échec : console.error des fieldErrors
                 + throw. Si succès : export de l'objet env typé. Toute
                 lecture côté app doit passer par env.* et non
                 process.env.*.

ecosystem:       Lib = [
                   "@/lib/env.ts",
                   "@/lib/prisma.ts",
                 ]

relatedFiles:    ["@/lib/auth/auth.ts",
                  "@/lib/prisma.ts",
                  "@/lib/email/send.ts"]

imports:         ["server-only", "zod"]

exports:         ["env", "Env"]

useBy:           ["@/lib/auth/auth.ts",
                  "@/lib/prisma.ts",
                  "@/lib/email/send.ts"]

userStories:     ["*en tant que développeur je veux valider les env vars au démarrage"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Schéma                                                             */
/* ------------------------------------------------------------------ */

const envSchema = z.object({
  /* --- Base de données (Neon) --- */
  DATABASE_URL: z.string().min(1, "DATABASE_URL manquante."),
  DATABASE_URL_UNPOOLED: z.string().min(1, "DATABASE_URL_UNPOOLED manquante."),

  /* --- Authentification (Better Auth) --- */
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET doit faire au moins 32 caractères."),
  BETTER_AUTH_URL: z.url("BETTER_AUTH_URL doit être une URL valide."),

  /* --- OAuth — GitHub (optionnel) --- */
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  /* --- OAuth — Google (optionnel) --- */
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  /* --- OAuth — Discord (optionnel) --- */
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),

  /* --- OAuth — Twitter / X (optionnel) --- */
  TWITTER_CLIENT_ID: z.string().optional(),
  TWITTER_CLIENT_SECRET: z.string().optional(),

  /* --- Email (Resend) --- */
  RESEND_API_KEY: z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || v.startsWith("re_"),
      "RESEND_API_KEY doit commencer par « re_ ».",
    ),
  EMAIL_FROM: z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || v.includes("@"),
      "EMAIL_FROM doit être une adresse email valide.",
    ),

  /* --- Application (client + serveur) --- */
  NEXT_PUBLIC_APP_URL: z.url("NEXT_PUBLIC_APP_URL doit être une URL valide."),

  /* --- Environnement Node --- */
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,

  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,

  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,

  TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
  TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,

  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,

  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  console.error(
    "❌ Variables d'environnement invalides :",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables.");
}

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */

export const env = parsed.data;

export type Env = typeof env;
