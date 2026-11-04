/*
path :           components/auth/PasswordStrength.tsx
projectId:       <à fournir>
type:            component
generic:         true

role:            Indicateur visuel de force du mot de passe : barre de progression colorée
                 (4 segments) + liste des règles avec check/circle. Met à jour en direct
                 pendant la saisie. Ne rend rien si la valeur est vide.
flow:            Client Component → reçoit value en prop → getPasswordStrength(value)
                 retourne { score, label } → rend 4 segments colorés + la liste des règles
                 PASSWORD_RULES avec icône Check (ok) ou Circle (non ok). aria-live="polite"
                 sur le conteneur pour annoncer les changements aux lecteurs d'écran.
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
relatedFiles:    ["@/lib/validations/auth.ts",
                  "@/app/auth/register/RegisterForm.tsx"]
imports:         ["react", "lucide-react",
                  "@/lib/validations/auth",
                  "props reçues : { value: string; className?: string }"]
exports:         ["default PasswordStrength", "PasswordStrengthProps"]
useBy:           ["@/app/auth/register/RegisterForm.tsx"]

userStories:     ["*en tant qu'utilisateur je veux voir la force de mon mot de passe en direct"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : composant rendu côté client, dépend de getPasswordStrength (regex).

import { Check, Circle } from "lucide-react";

import {
  PASSWORD_RULES,
  getPasswordStrength,
  type PasswordStrength as PasswordStrengthResult,
} from "@/lib/validations/auth";

/* ------------------------------------------------------------------ */
/*  Palette des scores                                                 */
/* ------------------------------------------------------------------ */

/**
 * Mapping score → couleur de la barre.
 *  0 : vide        → muted
 *  1 : faible      → chart-5 (rose)
 *  2 : moyen       → chart-3 (amber)
 *  3 : bon         → chart-2 (cyan)
 *  4 : fort        → chart-4 (emerald)
 */
const STRENGTH_COLORS: Record<PasswordStrengthResult["score"], string> = {
  0: "bg-muted",
  1: "bg-chart-5",
  2: "bg-chart-3",
  3: "bg-chart-2",
  4: "bg-chart-4",
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface PasswordStrengthProps {
  /** Valeur courante du mot de passe */
  readonly value: string;
  /** Classes additionnelles */
  readonly className?: string;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export default function PasswordStrength({
  value,
  className = "",
}: PasswordStrengthProps) {
  /* Aucun affichage si le champ est vide */
  if (!value) return null;

  const { score, label } = getPasswordStrength(value);

  return (
    <div className={`space-y-2 pt-1 ${className}`} aria-live="polite">
      {/* Barre + libellé */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= score ? STRENGTH_COLORS[score] : "bg-muted"
              }`}
              aria-hidden
            />
          ))}
        </div>
        <span className="w-16 text-right text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>

      {/* Liste des règles */}
      <ul className="grid gap-1 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li
              key={rule.id}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                ok ? "text-chart-4" : "text-muted-foreground"
              }`}
            >
              {ok ? (
                <Check className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <Circle className="size-3.5 shrink-0" aria-hidden />
              )}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
