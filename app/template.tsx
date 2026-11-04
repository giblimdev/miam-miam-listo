/*
path :           app/template.tsx
projectId:       <à fournir>
type:            layout
generic:         false

role:            Template racine. Contrairement à layout, un template est
                 REMONTÉ à chaque navigation — il sert à rejouer une animation
                 d'entrée de page ou à réinitialiser un état local. Ici, une
                 transition subtile (fade + translation verticale) est jouée
                 à chaque changement de route pour adoucir la navigation.

flow:            Client Component → motion.div avec initial/animate → wrapping
                 autour de {children}. Aucun état, aucune donnée.

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
imports:         ["react", "motion/react"]
exports:         ["default Template"]
useBy:           []

userStories:     ["*en tant qu'utilisateur je veux des transitions fluides entre pages"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : motion/react utilise des API navigateur
// (IntersectionObserver, requestAnimationFrame, animations).

import { motion } from "motion/react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}