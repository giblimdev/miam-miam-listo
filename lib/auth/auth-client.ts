/*
path :           lib/auth/auth-client.ts
tag :            ["auth", "client", "better-auth"]
projectId:       new-genesis
type:            config
generic:         true

role:            Client Better Auth pour le navigateur. Expose signIn, signUp,
                 signOut, useSession et la constante authClient. Même origine
                 que l'app : pas de baseURL nécessaire.

flow:            createAuthClient() (better-auth/react) → authClient → ré-export
                 des helpers signIn / signUp / signOut / useSession.

ecosystem:       Auth = [
                   "@/app/api/auth/[...all]/route.ts", 
                   "@/app/auth/layout.tsx",
                   "@/app/auth/login/LoginForm.tsx",
                   "@/app/auth/login/page.tsx",
                   "@/app/auth/register/RegisterForm.tsx",
                   "@/app/auth/register/page.tsx",
                   "@/app/auth/welcome/page.tsx",
                   "@/components/auth/PasswordInput.tsx",
                   "@/components/auth/PasswordStrength.tsx",
                   "@/lib/auth/auth-client.ts",
                   "@/lib/auth/auth.ts",
                   "@/lib/auth/session.ts",
                   "@/lib/validations/auth.ts",
                 ]

relatedFiles:    ["@/lib/auth/auth.ts",
                  "@/lib/auth/session.ts"]

imports:         ["better-auth/react"]

exports:         ["authClient", "signIn", "signUp", "signOut", "useSession"]

useBy:           ["@/app/auth/login/LoginForm.tsx",
                  "@/app/auth/register/RegisterForm.tsx",
                  "@/components/layout/header/UserMenu.tsx"]

userStories:     ["*en tant qu'utilisateur je veux me connecter, m'inscrire et me déconnecter côté client"]

status:          planned
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : hooks React (useSession) + client HTTP navigateur.

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
