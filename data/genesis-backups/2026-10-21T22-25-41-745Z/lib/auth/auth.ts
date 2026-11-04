/*
path :           lib/auth/auth.ts
projectId:       new-genesis
type:            config
generic:         true

role:            Configuration Better Auth côté serveur : adapter Prisma, email +
                 mot de passe, OAuth GitHub et Google (optionnels selon env). Expose
                 la constante `auth` et le type `Session` dérivé.

flow:            Importé par app/api/auth/[...all]/route.ts et lib/auth/session.ts.
                 Ne jamais importer côté client (protégé par "server-only").
                 Le plugin nextCookies() doit rester en DERNIER dans la liste.

ecosystem:       Auth = [
                   "@/app/core/api/auth/[...all]/route.ts",
                   "@/app/core/auth/login/LoginForm.tsx",
                   "@/app/core/auth/login/page.tsx",
                   "@/app/core/auth/register/RegisterForm.tsx",
                   "@/app/core/auth/register/page.tsx",
                   "@/components/auth/PasswordInput.tsx",
                   "@/components/auth/PasswordStrength.tsx",
                   "@/lib/auth/auth-client.ts",
                   "@/lib/auth/auth.ts",
                   "@/lib/auth/session.ts",
                   "@/lib/validations/auth.ts",
                 ]
relatedFiles:    ["@/app/core/api/auth/[...all]/route.ts",
                  "@/lib/auth/session.ts",
                  "@/lib/prisma.ts",
                  "@/lib/env.ts"]
imports:         ["server-only",
                  "better-auth",
                  "@better-auth/prisma-adapter",
                  "better-auth/next-js",
                  "@/lib/prisma",
                  "@/lib/env"]
exports:         ["auth", "Session"]
useBy:           ["@/app/api/auth/[...all]/route.ts",
                  "@/lib/auth/session.ts"]

userStories:     ["*en tant qu'utilisateur je veux que l'authentification soit configurée côté serveur"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.BETTER_AUTH_URL],

  database: prismaAdapter(prisma, { provider: "sqlite" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    requireEmailVerification: false,
  },

  socialProviders: {
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // renouvelée si > 1 jour
  },

  plugins: [nextCookies()], // doit rester en dernier
});

export type Session = typeof auth.$Infer.Session;
