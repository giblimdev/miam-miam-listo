/*
path :           lib/utils/keywords.ts
projectId:       new-genesis
type:            helper
generic:         true

role:            Conversion entre une saisie utilisateur "a, b, c" et un tableau JSON nettoyé
                 (trim, dédoublonnage case-insensitive, suppression des vides). Utilisé par le
                 CRUD Persona et tout champ à tags/mots-clés.
flow:            parseKeywordsInput("react, TS, react") → ["react", "TS"] ;
                 stringifyKeywords([]) → null ;
                 stringifyKeywords(["a","b"]) → '["a","b"]' ;
                 parseKeywordsJson('["a","b"]') → ["a","b"].
ecosystem:       Utils = [
                   "@/lib/utils/slugify.ts",
                   "@/lib/utils/initials.ts",
                   "@/lib/utils/date.ts",
                   "@/lib/utils/path.ts",
                   "@/lib/utils/keywords.ts",
                   "@/lib/utils/format.ts",
                   "@/lib/utils/id.ts",
                   "@/lib/utils/normalizeToLowercase.ts",
                 ]
relatedFiles:    ["@/lib/validations/persona.ts",
                  "@/components/persona/PersonaForm.tsx"]
imports:         []
exports:         ["parseKeywordsInput", "stringifyKeywords", "parseKeywordsJson"]
useBy:           ["@/lib/validations/persona.ts",
                  "@/components/persona/PersonaForm.tsx"]

userStories:     ["*en tant que développeur je veux normaliser une liste de mots-clés"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

/** "react, typescript, ux" → ["react", "typescript", "ux"] (trim + dédoublonnage). */
export function parseKeywordsInput(input: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of input.split(",")) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

/** ["react","ts"] → '["react","ts"]' ; [] → null (pour la DB). */
export function stringifyKeywords(list: string[]): string | null {
  if (list.length === 0) return null;
  return JSON.stringify(list);
}

/** Inverse : '["react","ts"]' → ["react","ts"] ; null / invalide → []. */
export function parseKeywordsJson(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}
