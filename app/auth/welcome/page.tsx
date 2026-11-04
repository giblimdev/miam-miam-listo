/*
path :           app/auth/welcome/page.tsx
projectId : new-genesis
type:            page
generic:         false

role:            Page d'accueil affichée juste après une connexion réussie.
                 Séquence animée (~5,5 s) qui met en scène la marque Genesis :
                 anneau conique rotatif, logo Sparkles, wordmark lettre par
                 lettre, tagline, 3 cartes de modules, barre de progression.
                 À la fin : exit animé puis redirection automatique vers /.
                 Un bouton « Passer » (top-right) et un Link vers / (bottom)
                 permettent de court-circuiter l'animation à tout moment.

flow:            Client Component → useReducedMotion (accessibilité) →
                 useEffect programme exitTimer (5,5 s) et redirectTimer (6 s)
                 → état `exiting` déclenche la variante "exit" de motion →
                 router.push("/") en fin de séquence. Bouton Passer → même
                 chemin accéléré.

ecosystem:       Auth = [
                   "@/app/auth/login/page.tsx",
                   "@/app/auth/register/page.tsx",
                   "@/app/auth/welcome/page.tsx",
                 ]
relatedFiles:    ["@/app/auth/login/page.tsx",
                  "@/components/ui/button.tsx"]
imports:         ["react", "next/link", "next/navigation",
                  "motion/react", "lucide-react",
                  "@/components/ui/button"]
exports:         ["default WelcomePage"]
useBy:           []

userStories:     ["*en tant qu'utilisateur je veux une page de bienvenue animée après connexion",
                  "*en tant qu'utilisateur je veux être redirigé vers l'accueil à la fin"]
status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : motion/react (animations navigateur), useRouter,
// useState, useEffect, setTimeout.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "motion/react";
import {
  ArrowRight,
  Layers,
  ListChecks,
  Sparkles,
  Users2,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const WORD = "Genesis";
const LETTERS = WORD.split("");

/** Durée totale de la séquence avant exit (ms). */
const EXIT_AT_MS = 5500;

/** Délai supplémentaire entre exit et redirection (ms). */
const REDIRECT_AT_MS = 6000;

const HIGHLIGHTS = [
  { icon: Layers, label: "Features", accent: "chart-1" as const },
  { icon: Users2, label: "Personas", accent: "chart-2" as const },
  { icon: ListChecks, label: "User Stories", accent: "chart-3" as const },
] as const;

/* ------------------------------------------------------------------ */
/*  Variants motion                                                    */
/* ------------------------------------------------------------------ */

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.55 },
  },
  exit: {
    opacity: 0,
    scale: 1.03,
    filter: "blur(6px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const letterVariants: Variants = {
  hidden: { opacity: 0, y: 42, filter: "blur(14px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ------------------------------------------------------------------ */
/*  Accent → classes (cartes)                                          */
/* ------------------------------------------------------------------ */

const ACCENT_BG: Record<string, string> = {
  "chart-1": "bg-chart-1/10 text-chart-1 ring-chart-1/20",
  "chart-2": "bg-chart-2/10 text-chart-2 ring-chart-2/20",
  "chart-3": "bg-chart-3/10 text-chart-3 ring-chart-3/20",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function WelcomePage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [exiting, setExiting] = useState(false);

  /* ---------- Séquence automatique ---------- */

  useEffect(() => {
    if (shouldReduceMotion) return;

    const exitTimer = window.setTimeout(() => setExiting(true), EXIT_AT_MS);
    const redirectTimer = window.setTimeout(
      () => router.push("/"),
      REDIRECT_AT_MS,
    );

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [router, shouldReduceMotion]);

  /* ---------- Passer (raccourci) ---------- */

  function handleSkip() {
    setExiting(true);
    window.setTimeout(() => router.push("/"), 200);
  }

  /* ---------- Version statique si reduced-motion ---------- */

  if (shouldReduceMotion) {
    return (
      <main className="grid min-h-[80vh] place-items-center px-6 py-16">
        <div className="flex max-w-md flex-col items-center gap-6 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-chart-1 via-chart-2 to-chart-3 text-white shadow-lg shadow-chart-1/30">
            <Sparkles className="size-6" aria-hidden />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Genesis</h1>
            <p className="text-sm text-muted-foreground">
              Bienvenue. Prêt à structurer tes projets ?
            </p>
          </div>
          <Link href="/" className={buttonVariants({})}>
            Continuer
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </main>
    );
  }

  /* ---------- Rendu animé ---------- */

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-background">
      {/* ============================================================ */}
      {/*  Fond : dégradés radiaux + orbes flottants + grille          */}
      {/* ============================================================ */}

      {/* Dégradé de fond subtil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--chart-1)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,var(--chart-5)_0%,transparent_50%)] opacity-[0.08]"
      />

      {/* Grille en pointillés */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:32px_32px]"
      />

      {/* Orbe violet */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/4 size-[28rem] rounded-full bg-chart-1/25 blur-3xl"
        animate={{ x: [0, 60, -20, 0], y: [0, -40, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orbe cyan */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-1/4 size-[24rem] rounded-full bg-chart-2/20 blur-3xl"
        animate={{ x: [0, -50, 30, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orbe rose */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/3 -bottom-40 size-[22rem] rounded-full bg-chart-5/15 blur-3xl"
        animate={{ x: [0, 40, -30, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ============================================================ */}
      {/*  Bloc central animé                                          */}
      {/* ============================================================ */}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={exiting ? "exit" : "visible"}
        className="relative z-10 flex max-w-3xl flex-col items-center gap-10 px-6 text-center"
      >
        {/* ---------- Logo + anneau rotatif ---------- */}

        <motion.div
          variants={fadeUpVariants}
          className="relative grid size-28 place-items-center"
        >
          {/* Halo doux */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-chart-1/15 blur-2xl"
          />

          {/* Anneau conique rotatif */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, var(--chart-1) 25%, var(--chart-2) 50%, var(--chart-5) 75%, transparent 100%)",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />

          {/* Pastille intérieure + Sparkles */}
          <motion.span
            className="relative grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-chart-1 via-chart-2 to-chart-3 text-white shadow-2xl shadow-chart-1/40"
            initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.15,
            }}
          >
            <motion.span
              animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.12, 1] }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 0.6,
              }}
              className="grid place-items-center"
            >
              <Sparkles className="size-9" aria-hidden />
            </motion.span>
          </motion.span>
        </motion.div>

        {/* ---------- Wordmark lettre par lettre ---------- */}

        <h1
          aria-label={WORD}
          className="flex items-baseline justify-center gap-[0.02em] text-6xl font-black tracking-tight sm:text-7xl md:text-8xl"
        >
          {LETTERS.map((char, i) => (
            <motion.span
              key={`${char}-${i}`}
              variants={letterVariants}
              aria-hidden
              className="inline-block bg-gradient-to-br from-chart-1 via-chart-2 to-chart-5 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(124,58,237,0.25)]"
            >
              {char}
            </motion.span>
          ))}
        </h1>

        {/* ---------- Tagline ---------- */}

        <motion.p
          variants={fadeUpVariants}
          className="max-w-lg text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          L&apos;atelier qui structure tes projets.{" "}
          <span className="text-foreground/80">
            Conception, planification, développement.
          </span>
        </motion.p>

        {/* ---------- Cartes modules ---------- */}

        <motion.ul
          variants={fadeUpVariants}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {HIGHLIGHTS.map(({ icon: Icon, label, accent }) => (
            <motion.li
              key={label}
              variants={cardVariants}
              className="flex items-center gap-2.5 rounded-full border border-border/60 bg-card/60 px-4 py-2 shadow-sm backdrop-blur"
            >
              <span
                className={`grid size-7 place-items-center rounded-full ring-1 ${ACCENT_BG[accent]}`}
              >
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
            </motion.li>
          ))}
        </motion.ul>

        {/* ---------- Barre de progression ---------- */}

        <motion.div
          variants={fadeUpVariants}
          className="flex w-full max-w-md flex-col items-center gap-3"
        >
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-chart-1 via-chart-2 to-chart-5"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 3,
                delay: 2.4,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Préparation de l&apos;atelier…
          </p>
        </motion.div>
      </motion.div>

      {/* ============================================================ */}
      {/*  Bouton Passer (top-right)                                   */}
      {/* ============================================================ */}

      <motion.button
        type="button"
        onClick={handleSkip}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="absolute right-4 top-4 z-20 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:bg-muted hover:text-foreground sm:right-6 sm:top-6"
      >
        Passer
      </motion.button>

      {/* ============================================================ */}
      {/*  Lien de secours vers / (bottom)                             */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:bg-muted hover:text-foreground"
        >
          Aller à l&apos;accueil
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </motion.div>
    </main>
  );
}