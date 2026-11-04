/*
path :           utils/date.ts
tag :            ["utils", "date", "format", "helper", "generic"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Formatage de dates en français, source unique de vérité
                 pour tout format de date affiché dans l'app (Blog,
                 UserProfile, Admin, Sprint, Persona). Quatre formats :
                 long ("01 octobre 2026" ou "1 octobre 2026"), moyen
                 ("1 oct. 2026"), court ("01/10/2026"), datetime
                 ("01 oct. 2026, 14:30"). Helpers : toInputDate
                 (YYYY-MM-DD), diffInDays, isPast.

flow:            formatDateLong(date, { dayStyle? }) → toLocaleDateString
                 fr-FR avec day/month/year. formatDateMedium → idem avec
                 month: "short". formatDateShort → idem 2-digit. formatDateTime
                 → toLocaleString + heure. toInputDate → ISO slice(0,10).
                 diffInDays(a, b) → Math.round((b-a)/MS_PER_DAY).
                 isPast(date) → date < Date.now().

ecosystem:       Utils = [
                   "@/utils/date.ts",
                   "@/utils/formatDevise.ts",
                   "@/utils/initials.ts",
                   "@/utils/keywords.ts",
                   "@/utils/normalizeToLowercase.ts",
                   "@/utils/path.ts",
                   "@/utils/slug.ts",
                   "@/utils/slugify.ts",
                 ]

relatedFiles:    ["@/app/blog/components/ArticleHeader.tsx",
                  "@/app/blog/components/ArticleCard.tsx",
                  "@/app/blog/components/CommentTree.tsx",
                  "@/app/blog/components/DiscussionThread.tsx",
                  "@/app/blog/components/NotificationList.tsx",
                  "@/app/blog/community/[groupSlug]/page.tsx",
                  "@/app/user/profile/ProfileForm.tsx",
                  "@/app/admin/users/page.tsx"]

imports:         []

exports:         ["formatDateLong", "formatDateMedium", "formatDateShort",
                  "formatDateTime", "toInputDate", "diffInDays", "isPast"]

useBy:           ["@/app/blog/components/ArticleHeader.tsx",
                  "@/app/blog/components/ArticleCard.tsx",
                  "@/app/blog/components/CommentTree.tsx",
                  "@/app/blog/components/DiscussionThread.tsx",
                  "@/app/blog/components/NotificationList.tsx",
                  "@/app/blog/community/[groupSlug]/page.tsx",
                  "@/app/user/profile/ProfileForm.tsx",
                  "@/app/admin/users/page.tsx"]

userStories:     ["*en tant que développeur je veux formater des dates de façon homogène"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

/* ------------------------------------------------------------------ */
/*  Formatage                                                          */
/* ------------------------------------------------------------------ */

/**
 * Format long : "01 octobre 2026" (défaut) ou "1 octobre 2026"
 * (dayStyle: "numeric"). Le paramètre permet de préserver les
 * call-sites qui n'affichent PAS le zéro initial (ArticleHeader,
 * ProfileForm).
 */
export function formatDateLong(
  date: Date | string,
  options?: { readonly dayStyle?: "numeric" | "2-digit" },
): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: options?.dayStyle ?? "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Format moyen : "1 oct. 2026" — cartes, listings, discussions. */
export function formatDateMedium(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format court : "01/10/2026". */
export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Date + heure : "01 oct. 2026, 14:30" — commentaires, posts, notifs. */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

/** Nombre de jours entiers entre deux dates (b − a). */
export function diffInDays(a: Date | string, b: Date | string): number {
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  return Math.round((end - start) / MS_PER_DAY);
}

/** Vrai si la date est strictement antérieure à maintenant. */
export function isPast(date: Date | string): boolean {
  return new Date(date).getTime() < Date.now();
}