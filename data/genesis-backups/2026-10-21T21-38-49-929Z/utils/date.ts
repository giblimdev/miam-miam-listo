/*
path :           utils/date.ts
projectId:       new-genesis
type:            helper
generic:         true

role:            Formatage de dates en français : long (jj mois aaaa), court (jj/mm/aaaa),
                 conversion Date → YYYY-MM-DD pour <input type="date">, et helpers de
                 comparaison / calcul de durée. Utilisé par Sprint, Story, Backlog.
flow:            formatDateLong(date) → "01 octobre 2026" ; formatDateShort(date) →
                 "01/10/2026" ; toInputDate(date) → "2026-10-01" ; diffInDays(a, b) →
                 nombre de jours entre deux dates ; isPast(date) → booléen.
ecosystem:       Utils = [
                   "@/utils/slugify.ts",
                   "@/utils/initials.ts",
                   "@/utils/date.ts",
                   "@/utils/path.ts",
                   "@/utils/keywords.ts",
                   "@/utils/formatDevise.ts",
                   "@/utils/idGenerator.ts",
                   "@/utils/normalizeToLowercase.ts",
                 ]
relatedFiles:    ["@/components/sprint/SprintCard.tsx",
                  "@/components/sprint/SprintForm.tsx"]
imports:         []
exports:         ["formatDateLong", "formatDateShort", "toInputDate", "diffInDays", "isPast"]
useBy:           ["@/components/sprint/SprintCard.tsx",
                  "@/components/sprint/SprintForm.tsx"]

userStories:     ["*en tant que développeur je veux formater et comparer des dates"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

/* ------------------------------------------------------------------ */
/*  Formatage                                                          */
/* ------------------------------------------------------------------ */

/** 2026-10-01 → "01 octobre 2026" */
export function formatDateLong(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** 2026-10-01 → "01/10/2026" */
export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Date → "YYYY-MM-DD" pour <input type="date">. */
export function toInputDate(date: Date | string): string {
  return new Date(date).toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  Comparaison / calcul                                               */
/* ------------------------------------------------------------------ */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Nombre de jours entiers entre deux dates (b − a).
 * Positif si b est après a, négatif sinon, 0 si même jour.
 */
export function diffInDays(a: Date | string, b: Date | string): number {
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  return Math.round((end - start) / MS_PER_DAY);
}

/** Vrai si la date est strictement antérieure à maintenant. */
export function isPast(date: Date | string): boolean {
  return new Date(date).getTime() < Date.now();
}
