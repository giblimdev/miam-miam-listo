/*
path :           app/layout.tsx
tag :            ["layout", "root", "fonts", "theme", "providers", "notification-slot", "platform-role", "suspense", "io"]
projectId:       new-genesis
type :           layout
generic:         false

role:            Layout racine : html/body, polices, ThemeProvider,
                 TooltipProvider, Toaster, Header, Footer.

                 La lecture de la session (getSession + prisma.user.platformRole)
                 est ISOLÉE dans un composant enfant `<HeaderWithRole>`
                 monté sous `<Suspense>`. `io()` est appelé AVANT
                 `getSession()` ET avant Prisma : Prisma 7 lit `new Date()`
                 de manière synchrone (bug connu, issue #28588), donc même
                 derrière un `await`, il bloque le prérendu si `io()` n'a
                 pas suspendu avant.

flow:            RootLayout (sync) → html/body → ThemeProvider →
                 TooltipProvider →
                 <Suspense fallback={<HeaderFallback />}>
                   <HeaderWithRole />
                 </Suspense> →
                 {children} + Footer + Toaster.

                 HeaderWithRole → await io() → getSession() → si null :
                 platformRole null → sinon : <Suspense fallback={<Header
                 platformRole={null} />}><UserRoleReader userId /></Suspense>.
                 UserRoleReader → await io() → prisma.user.findUnique
                 ({ platformRole }) → platformRole → <Header
                 platformRole={platformRole} notificationSlot={...} />.

ecosystem:       Layout = [
                   "@/app/globals.css",
                   "@/app/layout.tsx",
                   "@/components/layout/footer/Footer.tsx",
                   "@/components/layout/header/Header.tsx",
                   "@/components/layout/header/Logo.tsx",
                   "@/components/layout/header/MainNav.tsx",
                   "@/components/layout/header/NavActiveLink.tsx",
                   "@/components/layout/header/UserMenu.tsx",
                   "@/components/layout/header/nav/frontWorkSpace.ts",
                   "@/components/layout/header/navTypes.ts",
                   "@/components/ui/sonner.tsx",
                   "@/components/ui/tooltip.tsx",
                   "@/app/blog/components/NotificationBell.tsx",
                   "@/config/navigation.ts",
                   "@/config/roles.ts",
                 ]

relatedFiles:    ["@/app/globals.css",
                  "@/components/layout/footer/Footer.tsx",
                  "@/components/layout/header/Header.tsx",
                  "@/app/blog/components/NotificationBell.tsx",
                  "@/lib/auth/session.ts",
                  "@/lib/prisma.ts",
                  "@/config/roles.ts"]

imports:         ["next", "next/font/google", "next-themes", "react",
                  "next/cache",
                  "./globals.css",
                  "@/components/ui/tooltip",
                  "@/components/ui/sonner",
                  "@/components/layout/header/Header",
                  "@/components/layout/footer/Footer",
                  "@/app/blog/components/NotificationBell",
                  "@/lib/auth/session",
                  "@/lib/prisma",
                  "@/config/roles"]

exports:         ["metadata", "default RootLayout"]

useBy:           []

userStories:     ["*en tant que développeur je veux un layout racine avec polices thémables et rôle plateforme",
                  "us5100001"]
status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import { io } from "next/cache";

import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/layout/header/Header";
import Footer from "@/components/layout/footer/Footer";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { isPlatformRole, type PlatformRole } from "@/config/roles";

/* ------------------------------------------------------------------ */
/*  Polices                                                            */
/* ------------------------------------------------------------------ */

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

/* ------------------------------------------------------------------ */
/*  Métadonnées                                                        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: {
    default: "Genesis — Concevoir et développer votre projet numérique",
    template: "%s · Genesis",
  },
  description:
    "Genesis est l'atelier de conception et de développement pour toute l'équipe projet.",
  applicationName: "Genesis",
};

/* ------------------------------------------------------------------ */
/*  Fallbacks                                                          */
/* ------------------------------------------------------------------ */

function BellFallback() {
  return <div className="size-9" aria-hidden />;
}

function HeaderFallback() {
  return <Header platformRole={null} />;
}

/* ------------------------------------------------------------------ */
/*  Lecture du rôle plateforme Prisma (isolée)                         */
/* ------------------------------------------------------------------ */

async function UserRoleReader({ userId }: { readonly userId: string }) {
  /* io() force un point de suspension AVANT Prisma.
     Prisma 7 lit new Date() de manière synchrone dans son
     NowGenerator — sans ce point de suspension, Next.js
     bloque le prérendu. */
  await io();

  const rawRole = (
    await prisma.user.findUnique({
      where: { id: userId },
      select: { platformRole: true },
    })
  )?.platformRole;

  /* Garde-fou : si la valeur en base est corrompue (ex. "superadmin",
     "SuperAdmin"), on retombe sur "user". isPlatformRole valide
     contre PLATFORM_ROLES (source unique). */
  const platformRole: PlatformRole = isPlatformRole(rawRole) ? rawRole : "user";

  return (
    <Header
      platformRole={platformRole}
      notificationSlot={<Suspense fallback={<BellFallback />}></Suspense>}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Header avec rôle plateforme (Server Component async, sous Suspense)*/
/* ------------------------------------------------------------------ */

async function HeaderWithRole() {
  /* ⚠️ CRITIQUE : io() AVANT getSession().
     getSession() déclenche une lecture de cookies/headers qui, combinée
     à Prisma 7 (NowGenerator synchrone), bloque le prérendu si io() n'a
     pas suspendu avant. Voir https://nextjs.org/docs/messages/blocking-prerender-current-time */
  await io();

  const session = await getSession();

  /* Anonyme : Header sans rôle, pas de cloche */
  if (!session?.user) {
    return <Header platformRole={null} />;
  }

  /* Connecté : le rôle plateforme est lu dans un Suspense séparé,
     pour que Prisma ne bloque pas le prérendu de HeaderWithRole. */
  return (
    <Suspense fallback={<Header platformRole={null} />}>
      <UserRoleReader userId={session.user.id} />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <Suspense fallback={<HeaderFallback />}>
              <HeaderWithRole />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
