/*
path :           lib/auth/session.ts
tag :            ["auth", "session", "server-only"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Wrapper serveur autour de auth.api.getSession. Mémoïsé via
                 React.cache pour éviter les appels multiples dans un même
                 rendu (pages + composants + actions). Importable UNIQUEMENT
                 côté serveur.

flow:            getSession() → auth.api.getSession({ headers: await headers() })
                 → résultat mis en cache pour le rendu courant.

ecosystem:       Auth = [
                   "@/app/core/api/auth/[...all]/route.ts",
                   "@/app/core/auth/layout.tsx",
                   "@/app/core/auth/login/LoginForm.tsx",
                   "@/app/core/auth/login/page.tsx",
                   "@/app/core/auth/register/RegisterForm.tsx",
                   "@/app/core/auth/register/page.tsx",
                   "@/app/core/auth/welcome/page.tsx",
                   "@/components/auth/PasswordInput.tsx",
                   "@/components/auth/PasswordStrength.tsx",
                   "@/lib/auth/auth-client.ts",
                   "@/lib/auth/auth.ts",
                   "@/lib/auth/session.ts",
                   "@/lib/validations/auth.ts",
                 ]

relatedFiles:    ["@/lib/auth/auth.ts"]

imports:         ["server-only", "react", "next/headers", "@/lib/auth/auth"]

exports:         ["getSession"]

useBy:           ["@/app/core/auth/login/page.tsx",
                  "@/app/core/auth/register/page.tsx"]

userStories:     ["*en tant que développeur je veux lire la session côté serveur sans requêtes redondantes"]

status:          planned
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);