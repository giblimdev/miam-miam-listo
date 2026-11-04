/*
path :           app/default.tsx
projectId:       <à fournir>
type:            layout
generic:         false

role:            Fallback de route par défaut. Utilisé par Next.js comme
                 contenu de secours pour un slot parallèle non matché lors
                 d'une navigation. L'application n'utilise pas de routes
                 parallèles (@slot) pour l'instant — ce fichier existe comme
                 point d'ancrage, rend null et ne produit aucun effet visuel.

flow:            Server Component → retourne null. Aucune donnée, aucun état.

ecosystem:       AppShell = [
                   "@/app/layout.tsx",
                   "@/app/loading.tsx",
                   "@/app/error.tsx",
                   "@/app/not-found.tsx",
                   "@/app/global-error.tsx",
                   "@/app/template.tsx",
                   "@/app/default.tsx",
                 ]
relatedFiles:    ["@/app/layout.tsx"]
imports:         []
exports:         ["default Default"]
useBy:           []

userStories:     ["*en tant que développeur je veux un fallback de route par défaut"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

export default function Default() {
  return null;
}