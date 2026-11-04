/*
path :           components/auth/LoginCTA.tsx
tag :            ["auth", "login", "cta", "protected", "generic"]
projectId:       new-genesis
type:            component
generic:         true

role:            Bloc CTA « Connectez-vous pour… » utilisé dans les
                 sections qui nécessitent une session (articles admin,
                 favoris, notifications, community/new, setup admin,
                 admin/users). Remplace 7 blocs dupliqués. Le message
                 est paramétrable pour contextualiser l'invitation
                 (« Connectez-vous pour gérer vos articles. »,
                 « Connectez-vous pour créer un groupe. », etc.).

                 Base UI : le CTA est un <Link> stylé via buttonVariants(),
                 PAS un <Button render={<Link/>}> — un lien de navigation
                 doit rester un <a> pour la sémantique et l'accessibilité.

flow:            Props { message, className? } → rend un <div> avec
                 bordure dashed + message centré + <Link href="/auth/login">
                 stylé bouton avec icône ArrowRight.

ecosystem:       Auth = [
                   "@/app/api/auth/[...all]/route.ts",
                   "@/app/auth/layout.tsx",
                   "@/app/auth/login/LoginForm.tsx",
                   "@/app/auth/login/page.tsx",
                   "@/app/auth/register/RegisterForm.tsx",
                   "@/app/auth/register/page.tsx",
                   "@/app/auth/welcome/page.tsx",
                   "@/components/auth/LoginCTA.tsx",
                   "@/components/auth/PasswordInput.tsx",
                   "@/components/auth/PasswordStrength.tsx",
                   "@/lib/auth/auth-client.ts",
                   "@/lib/auth/auth.ts",
                   "@/lib/auth/session.ts",
                   "@/lib/validations/auth.ts",
                 ]

relatedFiles:    ["@/components/ui/button.tsx"]

imports:         ["next/link", "lucide-react",
                  "@/components/ui/button"]

exports:         ["LoginCTA", "LoginCTAProps"]

useBy:           ["@/app/blog/articles/page.tsx",
                  "@/app/blog/user/articles/page.tsx",
                  "@/app/blog/user/favorites/page.tsx",
                  "@/app/blog/notifications/page.tsx",
                  "@/app/blog/community/new/page.tsx",
                  "@/app/blog/setup/page.tsx",
                  "@/app/admin/users/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux être invité à me connecter quand une action le requiert"]

status:          planned
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface LoginCTAProps {
  /** Message contextuel affiché au-dessus du bouton. */
  readonly message: string;
  /** Classes additionnelles sur le conteneur. */
  readonly className?: string;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function LoginCTA({ message, className }: LoginCTAProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center ${
        className ?? ""
      }`}
    >
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link
        href="/auth/login"
        className={`${buttonVariants()} mt-4 gap-2`}
      >
        Se connecter
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}