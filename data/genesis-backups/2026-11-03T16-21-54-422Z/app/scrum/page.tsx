/*
path :           app/scrum/page.tsx
tag :            ["help", "scrum", "hub", "crud", "entry", "navigation"]
projectId:       new-genesis
type :           page d'entrée
generic:         false

role:            Page d'entrée du module /Scrum. Présente les 7 étapes du flux
                 Scrum (Idée, Feature, Persona, Epic, User story, Sprint, Task)
                 + l'export Global JSON (8 sections), et permet de basculer entre
                 les trois flux disponibles : scrum-business (activité métier),
                 scrum-app (app métier) et scrum-genesis (l'outil lui-même).
                 Chaque section renvoie vers sa page CRUD dédiée
                 (/core/[flow]/<section>).

flow:            Client Component → useState(flow) pour la sélection du flux → motion
                 stagger sur les cartes → clic sur une carte = <Link> vers
                 /core/{flow}/{sectionId}. Le flux courant est passé en prop aux
                 cartes pour construire l'URL.

ecosystem:       Scrum = [
                   "@/app/scrum/[flow]/epic/page.tsx",
                   "@/app/scrum/[flow]/feature/page.tsx",
                   "@/app/scrum/[flow]/global-json/page.tsx",
                   "@/app/scrum/[flow]/idee/page.tsx",
                   "@/app/scrum/[flow]/layout.tsx",
                   "@/app/scrum/[flow]/page.tsx",
                   "@/app/scrum/[flow]/persona/page.tsx",
                   "@/app/scrum/[flow]/sprint/page.tsx",
                   "@/app/scrum/[flow]/task/page.tsx",
                   "@/app/scrum/[flow]/user-story/page.tsx",
                   "@/app/scrum/layout.tsx",
                   "@/app/scrum/page.tsx",
                   "@/app/scrum/components/FlowSelector.tsx",
                   "@/app/scrum/components/ScrumNav.tsx",
                 ]

relatedFiles:    ["@/app/scrum/layout.tsx",
                  "@/app/scrum/[flow]/layout.tsx",
                  "@/app/scrum/components/FlowSelector.tsx"]

imports:         ["react", "next/link", "motion/react", "lucide-react"]

exports:         ["default HelpPage"]

useBy:           ["@/app/layout.tsx"]

userStories:     ["*en tant que développeur je veux une page d'entrée vers le CRUD Scrum",
                  "*en tant qu'utilisateur je veux choisir entre ScrumBusiness, ScrumApp et Scrum-Genesis"]

status:          wip
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : useState (sélection du flux) + motion + Link interactif.

import { useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import {
  Lightbulb,
  Sparkles,
  Users,
  Layers,
  ListChecks,
  Rocket,
  ListTodo, // ← AJOUT
  FileJson,
  Target,
  ArrowDown,
  ArrowRight,
  Briefcase,
  Package,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ScrumFlow = "scrum-business" | "scrum-app" | "scrum-genesis";

interface ScrumSection {
  readonly id: string;
  readonly num: number;
  readonly title: string;
  readonly subtitle: string;
  readonly icon: LucideIcon;
  readonly accent: string;
  readonly objective: string;
  readonly inputs: string;
  readonly activities: string;
  readonly output: string;
  readonly criteria: string;
}

interface FlowOption {
  readonly id: ScrumFlow;
  readonly label: string;
  readonly tagline: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly accent: string;
}

/* ------------------------------------------------------------------ */
/*  Données                                                            */
/* ------------------------------------------------------------------ */

const FLOWS: readonly FlowOption[] = [
  {
    id: "scrum-business",
    label: "ScrumBusiness",
    tagline: "L'activité métier",
    description:
      "Le scrum de l'activité métier : idées, features, personas, epics, user stories et sprints du domaine business.",
    icon: Briefcase,
    accent: "chart-5",
  },
  {
    id: "scrum-app",
    label: "ScrumApp",
    tagline: "L'app métier",
    description:
      "Le scrum du produit que vous construisez : idées, features, personas, epics, user stories et sprints de votre application.",
    icon: Package,
    accent: "chart-1",
  },
  {
    id: "scrum-genesis",
    label: "Scrum-Genesis",
    tagline: "L'outil lui-même",
    description:
      "Le scrum de Genesis : la conception et l'évolution de l'atelier lui-même, back-studio compris.",
    icon: Wrench,
    accent: "chart-3",
  },
];

const SECTIONS: readonly ScrumSection[] = [
  {
    id: "idee",
    num: 1,
    title: "Idée",
    subtitle: "Formuler le problème",
    icon: Lightbulb,
    accent: "chart-1",
    objective: "Formuler le problème à résoudre, pas la solution.",
    inputs: "Intuition, opportunité, douleur utilisateur.",
    activities: "Énoncé du problème, hypothèses, contexte.",
    output: "Problem Statement et hypothèses.",
    criteria: "Le problème est clair, mesurable et relié à un ou des besoins.",
  },
  {
    id: "feature",
    num: 2,
    title: "Feature",
    subtitle: "Explorer librement",
    icon: Sparkles,
    accent: "chart-2",
    objective: "Explorer librement le problème.",
    inputs: "Problem Statement.",
    activities:
      "Brainstorming, ateliers, scénarios, contraintes, opportunités.",
    output: "Features, présentation, intérêt, persona.",
    criteria:
      "Les idées sont assez nombreuses et variées pour être structurées.",
  },
  {
    id: "persona",
    num: 3,
    title: "Persona",
    subtitle: "Valider les hypothèses",
    icon: Users,
    accent: "chart-3",
    objective: "Transformer les hypothèses en personas validés.",
    inputs: "Hypothèses de personas, features candidates.",
    activities: "Tri des features, identification des besoins, validation.",
    output: "Personas validés et carte des parties prenantes.",
    criteria:
      "Chaque persona est relié à au moins un besoin réel, pas à une feature inventée.",
  },
  {
    id: "epic",
    num: 4,
    title: "Epic",
    subtitle: "Regrouper les features",
    icon: Layers,
    accent: "chart-4",
    objective:
      "Regrouper les features retenues en grands blocs fonctionnels cohérents.",
    inputs: "Features candidates triées, personas validés.",
    activities: "Regroupement par domaine, parcours ou contrainte.",
    output: "Epics nommés, objectifs, périmètre.",
    criteria:
      "Les epics sont compréhensibles, alignés sur les personas et la vision.",
  },
  {
    id: "user-story",
    num: 5,
    title: "User stories",
    subtitle: "Découper les epics",
    icon: ListChecks,
    accent: "chart-5",
    objective: "Découper les epics en incréments développables et testables.",
    inputs: "Epics.",
    activities:
      "Rédaction « En tant que… je veux… afin de… », critères, estimation.",
    output: "Backlog de user stories.",
    criteria: "Chaque user story est testable, estimée et priorisable.",
  },
  {
    id: "sprint",
    num: 6,
    title: "Sprint",
    subtitle: "Décider quoi faire",
    icon: Rocket,
    accent: "chart-1",
    objective: "Décider quoi faire, quand et pourquoi.",
    inputs: "User stories, valeur, effort, risques.",
    activities: "MoSCoW, RICE, Kano, découpage MVP.",
    output: "Roadmap, backlog ordonné, MVP.",
    criteria: "Le prochain incrément est clair et justifié.",
  },
  {
    // ← AJOUT (bloc entier)
    id: "task",
    num: 7,
    title: "Task",
    subtitle: "Exécuter le sprint",
    icon: ListTodo,
    accent: "chart-2",
    objective:
      "Découper chaque User Story en unités de travail concrètes, assignables et mesurables.",
    inputs: "User stories, sprint en cours.",
    activities:
      "Breakdown technique, assignation, suivi du statut (todo / in_progress / done).",
    output: "Backlog de tasks exécutables et avancement réel du sprint.",
    criteria:
      "Chaque task est < 1 jour, testable et rattachée à une User Story.",
  },
  {
    id: "global-json",
    num: 8, // ← MODIFIÉ (7 → 8)
    title: "Global JSON",
    subtitle: "Exporter le flux",
    icon: FileJson,
    accent: "chart-2",
    objective:
      "Visualiser, copier ou télécharger l'intégralité du flux au format JSON.",
    inputs: "Les 7 sections du flux.", // ← MODIFIÉ
    activities: "Agrégation, sérialisation, export.",
    output: "Fichier JSON complet, prêt à versionner.",
    criteria:
      "L'export contient les 7 sections et peut être réimporté sans perte.", // ← MODIFIÉ
  },
];

/* ------------------------------------------------------------------ */
/*  Animations                                                         */
/* ------------------------------------------------------------------ */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ------------------------------------------------------------------ */
/*  Carte de sélection de flux                                         */
/* ------------------------------------------------------------------ */

function FlowCard({
  flow,
  selected,
  onSelect,
}: {
  readonly flow: FlowOption;
  readonly selected: boolean;
  readonly onSelect: (id: ScrumFlow) => void;
}) {
  const Icon = flow.icon;
  const accent = flow.accent;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(flow.id)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      aria-pressed={selected}
      className={`group relative flex h-full flex-col items-start gap-3 overflow-hidden rounded-2xl border-2 p-6 text-left transition-colors ${
        selected
          ? "border-transparent shadow-xl"
          : "border-border/60 bg-card hover:border-border"
      }`}
      style={
        selected
          ? ({
              background: `linear-gradient(135deg, color-mix(in oklab, var(--${accent}) 12%, var(--card)), var(--card))`,
              boxShadow: `0 20px 40px -20px var(--${accent})`,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div
        className="grid size-12 shrink-0 place-items-center rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, var(--${accent}), color-mix(in oklab, var(--${accent}) 60%, black))`,
        }}
      >
        <Icon className="size-6" aria-hidden />
      </div>

      <div className="min-w-0">
        <p
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: `var(--${accent})` }}
        >
          {flow.tagline}
        </p>
        <h3 className="mt-0.5 text-xl font-bold tracking-tight text-foreground">
          {flow.label}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {flow.description}
        </p>
      </div>

      <span
        className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: `var(--${accent})` }}
      >
        {selected ? "Sélectionné" : "Choisir ce flux"}
        <ArrowRight className="size-4" aria-hidden />
      </span>

      {selected && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full opacity-20 blur-3xl"
          style={{ background: `var(--${accent})` }}
        />
      )}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  Carte de section                                                   */
/* ------------------------------------------------------------------ */

function SectionCard({
  section,
  flow,
}: {
  readonly section: ScrumSection;
  readonly flow: ScrumFlow;
}) {
  const Icon = section.icon;
  const accent = section.accent;
  const isGlobalJson = section.id === "global-json";

  return (
    <motion.article
      variants={itemVariants}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-2xl"
      style={
        {
          "--accent": `var(--${accent})`,
        } as React.CSSProperties
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: "var(--accent)" }}
      />

      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-70"
        style={{
          background: `linear-gradient(90deg, var(--${accent}), transparent)`,
        }}
      />

      <header className="relative mb-5 flex items-start gap-4">
        <div
          className="grid size-12 shrink-0 place-items-center rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, var(--${accent}), color-mix(in oklab, var(--${accent}) 60%, black))`,
          }}
        >
          <Icon className="size-6" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <span
            className="text-xs font-bold tabular-nums"
            style={{ color: `var(--${accent})` }}
          >
            {isGlobalJson ? "EXPORT" : `ÉTAPE ${section.num}`}
          </span>
          <h3 className="mt-0.5 text-xl font-bold tracking-tight text-foreground">
            {section.title}
          </h3>
          <p className="text-sm text-muted-foreground">{section.subtitle}</p>
        </div>
      </header>

      <p className="relative mb-5 text-sm leading-relaxed text-foreground/90">
        {section.objective}
      </p>

      <dl className="relative space-y-3 text-sm">
        <DetailRow label="Entrées" value={section.inputs} />
        <DetailRow label="Activités" value={section.activities} />
        <DetailRow label="Sortie" value={section.output} />
      </dl>

      <footer className="relative mt-5 flex items-start gap-2 rounded-xl border border-border/50 bg-muted/40 p-3">
        <Target
          className="mt-0.5 size-4 shrink-0"
          style={{ color: `var(--${accent})` }}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Critère de passage
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">
            {section.criteria}
          </p>
        </div>
      </footer>

      <Link
        href={`/${flow}/${section.id}`}
        className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
        style={{ color: `var(--${accent})` }}
      >
        Ouvrir dans{" "}
        {flow === "scrum-business"
          ? "ScrumBusiness"
          : flow === "scrum-app"
            ? "ScrumApp"
            : "Scrum-Genesis"}
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/*  Ligne de détail                                                    */
/* ------------------------------------------------------------------ */

function DetailRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-foreground/80">{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HelpPage() {
  const [flow, setFlow] = useState<ScrumFlow>("scrum-business");

  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-muted/30">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-chart-1/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-12 size-96 rounded-full bg-chart-3/20 blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-chart-2" aria-hidden />
            Flux Scrum · 8 sections {/* ← MODIFIÉ */}
          </span>

          <h1 className="mt-5 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            De l&apos;idée au sprint
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Chaque étape transforme une matière brute en un incrément
            développable, testable et priorisable. Choisissez un flux, puis
            naviguez dans ses sections.
          </p>

          <div className="mt-8 flex justify-center">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="grid size-10 place-items-center rounded-full border border-border/60 bg-background/60 backdrop-blur"
            >
              <ArrowDown className="size-5 text-muted-foreground" aria-hidden />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Sélection du flux */}
      <section className="px-4 pb-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Choisissez votre flux
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Trois scrum parallèles, un seul outil. Sélectionnez celui que vous
              voulez consulter.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {FLOWS.map((f) => (
              <FlowCard
                key={f.id}
                flow={f}
                selected={flow === f.id}
                onSelect={setFlow}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Grille des 8 sections */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6 flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Les 8 sections {/* ← MODIFIÉ */}
            </h2>
            <p className="text-sm text-muted-foreground">
              Chaque section est cliquable et ouvre la page CRUD du flux
              sélectionné.
            </p>
          </header>

          <motion.div
            key={flow}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {SECTIONS.map((section) => (
              <SectionCard key={section.id} section={section} flow={flow} />
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
