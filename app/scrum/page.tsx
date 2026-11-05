/*
path :           app/scrum/page.tsx
tag :            ["scrum", "hub", "redirect", "mono-flux"]
projectId:       <à fournir>
type:            page d'entrée
generic:         false

role:            Point d'entrée du module /scrum. Avec un seul flux
                 actif ("scrum-business"), cette page n'a plus de raison
                 d'être un hub à 3 cartes : elle REDIRIGE immédiatement
                 vers la vue d'ensemble du flux unique
                 (/scrum/scrum-business). Server Component pur, aucun
                 état, aucun effet, aucun fetch.

                 La page éditoriale historique (hero « De l'idée au
                 sprint », 3 cartes de flux, 8 cartes de sections) a été
                 SUPPRIMÉE. Elle faisait doublon avec la vue d'ensemble
                 du flux (/scrum/[flow]/page.tsx) et avec la sidebar de
                 navigation. Si tu veux conserver le contenu éditorial
                 (les 8 étapes détaillées), il faut le déplacer dans
                 /scrum/[flow]/page.tsx — ce n'est pas le périmètre de
                 ce fichier.

                 ⚠️ Les anciennes URLs /scrum/scrum-app et
                 /scrum/scrum-genesis tombent désormais en notFound()
                 via isScrumFlow (dans le layout). Comportement attendu.

flow:            Server Component sync → redirect("/scrum/scrum-business").
                 Next.js émet une redirection HTTP 307. Aucun rendu.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/dashboard/page.tsx",
                   "@/app/scrum/[flow]/epic/board/page.tsx",
                   "@/app/scrum/[flow]/epic/page.tsx",
                   "@/app/scrum/[flow]/feature/page.tsx",
                   "@/app/scrum/[flow]/global-json/page.tsx",
                   "@/app/scrum/[flow]/idee/page.tsx",
                   "@/app/scrum/[flow]/layout.tsx",
                   "@/app/scrum/[flow]/page.tsx",
                   "@/app/scrum/[flow]/persona/page.tsx",
                   "@/app/scrum/[flow]/progress/page.tsx",
                   "@/app/scrum/[flow]/roadmap/page.tsx",
                   "@/app/scrum/[flow]/sprint/[sprintId]/edit/page.tsx",
                   "@/app/scrum/[flow]/sprint/board/page.tsx",
                   "@/app/scrum/[flow]/sprint/page.tsx",
                   "@/app/scrum/[flow]/task/board/page.tsx",
                   "@/app/scrum/[flow]/task/page.tsx",
                   "@/app/scrum/[flow]/user-story/page.tsx",
                   "@/app/scrum/components/ScrumNav.tsx",
                   "@/app/scrum/components/SprintBoardHub.tsx",
                   "@/app/scrum/layout.tsx",
                   "@/app/scrum/page.tsx",
                 ]

relatedFiles:    ["@/app/scrum/layout.tsx",
                  "@/app/scrum/[flow]/layout.tsx",
                  "@/app/scrum/[flow]/page.tsx"]

imports:         ["next/navigation"]

exports:         ["default ScrumHubPage"]

useBy:           []

userStories:     ["*en tant qu'utilisateur je veux arriver directement sur le flux Scrum unique"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { redirect } from "next/navigation";

/**
 * Redirection vers le flux unique. `/scrum` n'a plus de raison d'être
 * un hub : un seul flux est actif ("scrum-business").
 */
export default function ScrumHubPage() {
  redirect("/scrum/scrum-business");
}