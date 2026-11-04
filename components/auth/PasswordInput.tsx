/*
path :           components/auth/PasswordInput.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Champ mot de passe : icône cadenas, bouton afficher/masquer accessible,
                 alerte verrouillage majuscules. Compatible react-hook-form via forwardRef ;
                 les props (id, aria-*, value, onChange, onBlur…) sont transmises à l'input.
flow:            Client Component → useState(visible, capsLock) → rend un <Input> type
                 "password" ou "text" → le bouton toggle inverse visible → les événements
                 clavier onKeyDown/onKeyUp détectent CapsLock via getModifierState →
                 onBlur réinitialise capsLock. Le forwardRef permet à react-hook-form de
                 brancher son ref sur l'input.
ecosystem:       Auth = [
                   "@/app/auth/login/LoginForm.tsx",
                   "@/app/auth/login/page.tsx",
                   "@/app/auth/register/RegisterForm.tsx",
                   "@/app/auth/register/page.tsx",
                   "@/components/auth/PasswordInput.tsx",
                   "@/components/auth/PasswordStrength.tsx",
                   "@/lib/auth/auth-client.ts",
                   "@/lib/auth/session.ts",
                   "@/lib/validations/auth.ts",
                 ]
relatedFiles:    ["@/app/auth/login/LoginForm.tsx",
                  "@/app/auth/register/RegisterForm.tsx",
                  "@/components/ui/input.tsx"]
imports:         ["react", "lucide-react",
                  "@/components/ui/input",
                  "props reçues : Omit<React.InputHTMLAttributes<HTMLInputElement>, \"type\">"]
exports:         ["PasswordInput", "PasswordInputProps"]
useBy:           ["@/app/auth/login/LoginForm.tsx",
                  "@/app/auth/register/RegisterForm.tsx"]

userStories:     ["*en tant qu'utilisateur je veux voir/masquer mon mot de passe saisi"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState + gestionnaires d'événements clavier + bouton toggle.

import * as React from "react";
import { Eye, EyeOff, Lock, TriangleAlert } from "lucide-react";

import { Input } from "@/components/ui/input";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(({ className = "", onKeyDown, onKeyUp, onBlur, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);
  const [capsLock, setCapsLock] = React.useState(false);

  const trackCaps = (e: React.KeyboardEvent<HTMLInputElement>) =>
    setCapsLock(e.getModifierState("CapsLock"));

  return (
    <div>
      <div className="relative">
        <Lock
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={`h-11 pl-10 pr-11 ${className}`}
          onKeyDown={(e) => {
            trackCaps(e);
            onKeyDown?.(e);
          }}
          onKeyUp={(e) => {
            trackCaps(e);
            onKeyUp?.(e);
          }}
          onBlur={(e) => {
            setCapsLock(false);
            onBlur?.(e);
          }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={
            visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </button>
      </div>
      {capsLock && (
        <p
          role="status"
          className="mt-1.5 flex items-center gap-1.5 text-xs text-chart-3"
        >
          <TriangleAlert className="size-3.5" aria-hidden />
          Verrouillage des majuscules activé
        </p>
      )}
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";
