/*
path :           lib/utils/path.ts
projectId:       new-genesis
type:            helper
generic:         true

role:            Détection d'état actif d'un lien de navigation à partir du pathname. Utilisé
                 par DesktopNav et tout composant de navigation (sous-menus, onglets, breadcrumbs).
flow:            isHrefActive("/user/project/foo", "/user/project") → true ;
                 isHrefActive("/user", "/user") → true ;
                 isHrefActive("/user", "/") → false ;
                 isHrefActive("/", "/") → true.
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
relatedFiles:    ["@/components/layout/header/DesktopNav.tsx"] !!! n'existe pas ?
imports:         []
exports:         ["isHrefActive"]
useBy:           []

userStories:     ["*en tant que développeur je veux détecter le lien actif d'une nav"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

/**
 * Vrai si le pathname correspond au href.
 *
 * Règles :
 *   - href vide → false
 *   - href "/" → correspondance exacte uniquement
 *   - autres → correspondance exacte OU préfixe suivi de "/"
 *     (évite que "/user" matche "/username")
 */
export function isHrefActive(pathname: string, href?: string): boolean {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
