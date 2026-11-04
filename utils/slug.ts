/*
path :           utils/slug.ts
projectId:       new-genesis
type:            helper
generic:         true

role:            Résolution d'un slug libre dans un scope donné. Teste
                 `base`, puis `base-2`, `base-3`, … jusqu'à 999, puis
                 repli sur un suffixe temporel. Ne connaît RIEN de Prisma :
                 l'appelant fournit un callback `isTaken(candidate)` qui
                 encapsule la requête d'occupation propre au modèle.

flow:            findFreeSlug(base, isTaken) → boucle 2..999 → si
                 isTaken(candidate) === false : retourne candidate → sinon
                 retourne `${base}-${Date.now()}`.

ecosystem:       Utils = [
                   "@/utils/slug.ts",
                   "@/utils/slugify.ts",
                 ]
relatedFiles:    ["@/utils/slugify.ts",
                  "@/app/actions/project/createProject.ts",
                  "@/app/actions/project/updateProject.ts",
                  "@/app/actions/feature/createFeature.ts",
                  "@/app/actions/feature/updateFeature.ts",
                  "@/app/actions/persona/createPersona.ts",
                  "@/app/actions/persona/updatePersona.ts",
                  "@/app/actions/user-story/createUserStory.ts",
                  "@/app/actions/user-story/updateUserStory.ts",
                  "@/app/actions/sprint/createSprint.ts",
                  "@/app/actions/sprint/updateSprint.ts"]
imports:         []
exports:         ["findFreeSlug", "SlugChecker"]
useBy:           ["@/app/actions/project/createProject.ts",
                  "@/app/actions/project/updateProject.ts",
                  "@/app/actions/feature/createFeature.ts",
                  "@/app/actions/feature/updateFeature.ts",
                  "@/app/actions/persona/createPersona.ts",
                  "@/app/actions/persona/updatePersona.ts",
                  "@/app/actions/user-story/createUserStory.ts",
                  "@/app/actions/user-story/updateUserStory.ts",
                  "@/app/actions/sprint/createSprint.ts",
                  "@/app/actions/sprint/updateSprint.ts"]

userStories:     ["*en tant que développeur je veux un helper de slug unique partagé"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

/* ------------------------------------------------------------------ */
/*  Type                                                               */
/* ------------------------------------------------------------------ */

/**
 * Callback fourni par l'appelant. Doit retourner `true` si le slug
 * candidat est déjà pris dans le scope (projet, global…), `false` sinon.
 */
export type SlugChecker = (candidate: string) => Promise<boolean>;

/* ------------------------------------------------------------------ */
/*  Résolution                                                         */
/* ------------------------------------------------------------------ */

/**
 * Retourne un slug libre en testant `base`, puis `base-2`, `base-3`, …
 * jusqu'à 999. Au-delà, ajoute un suffixe temporel.
 *
 * Aucune dépendance à Prisma : l'appelant décide ce qu'« occupé » veut
 * dire (avec ou sans `projectId`, avec ou sans `deletedAt: null`, avec
 * ou sans exclusion d'un id en édition…).
 *
 * @example
 *   const slug = await findFreeSlug("auth-login", async (c) => {
 *     const found = await prisma.feature.findFirst({
 *       where: { projectId, slug: c },
 *       select: { id: true },
 *     });
 *     return found !== null;
 *   });
 */
export async function findFreeSlug(
  base: string,
  isTaken: SlugChecker,
): Promise<string> {
  let candidate = base;
  for (let i = 2; i <= 999; i++) {
    if (!(await isTaken(candidate))) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}
