/*
path :           app/blog/setup/page.tsx
tag :            ["blog", "admin", "bootstrap", "setup", "page", "io"]
projectId:       new-genesis
type:            page
generic:         false

role:            Écran de bootstrap admin. Server Component sync qui
                 monte un Suspense ; le composant async SetupSection
                 vérifie la session, propose de promouvoir l'utilisateur
                 courant si aucun admin n'existe (bootstrapFirstAdmin),
                 affiche la liste des utilisateurs avec un badge
                 admin/utilisateur et un bouton « Promouvoir » (réservé
                 aux admins existants via promoteToAdmin). Le tri est
                 chronologique (createdAt ASC). Le formulaire de promotion
                 est un Client Component local à la page.

                 ⚠️ `await io()` AVANT getBlogSession() et AVANT
                 listAdminUsers() (NowGenerator Prisma 7).
                 ⚠️ Base UI : CTA « Se connecter » = <Link> stylé via
                 buttonVariants(), PAS <Button render={<Link/>}>.

flow:            BlogAdminSetupPage (sync) → Suspense →
                 SetupSection async → await io() → getBlogSession() →
                 si null : CTA login (Link stylé) → listAdminUsers() →
                 si aucun admin : <BootstrapForm /> sinon : <UserList />
                 avec bouton Promouvoir par utilisateur.

ecosystem:       Blog = [
                   "@/app/blog/[slug]/page.tsx",
                   "@/app/blog/admin/articles/[id]/edit/page.tsx",
                   "@/app/blog/admin/articles/new/page.tsx",
                   "@/app/blog/admin/articles/page.tsx",
                   "@/app/blog/admin/setup/page.tsx",
                   "@/app/blog/admin/taxonomy/page.tsx",
                   "@/app/blog/articles/[id]/edit/page.tsx",
                   "@/app/blog/articles/ArticleRow.tsx",
                   "@/app/blog/articles/new/page.tsx",
                   "@/app/blog/articles/page.tsx",
                   "@/app/blog/community/[groupSlug]/[discussionId]/page.tsx",
                   "@/app/blog/community/[groupSlug]/page.tsx",
                   "@/app/blog/community/[groupSlug]/requests/page.tsx",
                   "@/app/blog/community/new/page.tsx",
                   "@/app/blog/community/page.tsx",
                   "@/app/blog/help/page.tsx",
                   "@/app/blog/notifications/page.tsx",
                   "@/app/blog/page.tsx",
                   "@/app/blog/search/page.tsx",
                   "@/app/blog/tag/[slug]/page.tsx",
                   "@/app/blog/theme/[slug]/[category]/[subCategory]/page.tsx",
                   "@/app/blog/theme/[slug]/[category]/page.tsx",
                   "@/app/blog/theme/[slug]/page.tsx",
                   "@/app/blog/user/articles/page.tsx",
                   "@/app/blog/user/favorites/page.tsx",
                 ]

relatedFiles:    ["@/app/blog/lib/admin.ts",
                  "@/app/blog/lib/session.ts"]

imports:         ["react", "next/link", "next/cache", "lucide-react", "sonner",
                  "@/app/blog/lib/admin",
                  "@/app/blog/lib/session",
                  "@/components/ui/button",
                  "@/components/ui/skeleton"]

exports:         ["default BlogAdminSetupPage"]

useBy:           []

userStories:     ["us1100012"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { Suspense } from "react";
import Link from "next/link";
import { io } from "next/cache";
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";

import {
  bootstrapFirstAdmin,
  listAdminUsers,
  promoteToAdmin,
  type AdminUserSummary,
  type BootstrapResult,
} from "@/app/blog/lib/admin";
import { getBlogSession } from "@/app/blog/lib/session";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Bootstrap admin · Blog",
};

export default function BlogAdminSetupPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-chart-1">
          Administration
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bootstrap administrateur
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Le premier utilisateur connecté peut devenir administrateur du
          blog. Les administrateurs existants peuvent promouvoir
          d&apos;autres utilisateurs. Une fois promu, un administrateur ne
          peut pas être rétrogradé depuis cette page — un second admin
          doit être nommé avant toute autre opération de maintenance.
        </p>
      </header>

      <Suspense fallback={<SetupSkeleton />}>
        <SetupSection />
      </Suspense>
    </div>
  );
}

async function SetupSection() {
  /* ⚠️ io() AVANT Prisma. */
  await io();

  const session = await getBlogSession();

  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour accéder au bootstrap administrateur.
        </p>
        <Link
          href="/core/auth/login"
          className={`${buttonVariants()} mt-4 gap-2`}
        >
          Se connecter
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const users = await listAdminUsers();
  const admins = users.filter((u) => u.isAdmin);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <header className="mb-3 flex items-center gap-2">
          <Shield className="size-4 text-chart-1" aria-hidden />
          <h2 className="text-base font-bold tracking-tight text-foreground">
            État actuel
          </h2>
        </header>
        {admins.length === 0 ? (
          <BootstrapForm />
        ) : (
          <p className="text-sm text-muted-foreground">
            <CheckCircle2
              className="mr-1 inline size-4 text-chart-4"
              aria-hidden
            />
            {admins.length} administrateur{admins.length > 1 ? "s" : ""}{" "}
            actif{admins.length > 1 ? "s" : ""}.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <header className="mb-3 flex items-center gap-2">
          <UserIcon className="size-4 text-chart-2" aria-hidden />
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Utilisateurs ({users.length})
          </h2>
        </header>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun utilisateur en base pour l&apos;instant.
          </p>
        ) : (
          <ul className="space-y-2">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                canPromote={admins.length > 0 && !user.isAdmin}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

async function BootstrapFormAction(): Promise<BootstrapResult> {
  "use server";
  return bootstrapFirstAdmin();
}

async function PromoteUserAction(userId: string): Promise<void> {
  "use server";
  await promoteToAdmin(userId);
}

function BootstrapForm() {
  return (
    <form
      action={async () => {
        "use server";
        await BootstrapFormAction();
      }}
    >
      <p className="mb-3 text-sm text-muted-foreground">
        Aucun administrateur n&apos;est encore défini. Cliquez ci-dessous
        pour devenir le premier administrateur du blog.
      </p>
      <Button type="submit" className="gap-2">
        <ShieldCheck className="size-4" aria-hidden />
        Devenir administrateur
      </Button>
    </form>
  );
}

function UserRow({
  user,
  canPromote,
}: {
  readonly user: AdminUserSummary;
  readonly canPromote: boolean;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {user.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      {user.isAdmin ? (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-chart-4/15 px-2.5 py-1 text-[11px] font-semibold text-chart-4">
          <CheckCircle2 className="size-3" aria-hidden />
          Admin
        </span>
      ) : (
        <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
          Utilisateur
        </span>
      )}
      {canPromote && (
        <form
          action={async () => {
            "use server";
            await PromoteUserAction(user.id);
          }}
        >
          <Button type="submit" size="sm" variant="outline">
            Promouvoir
          </Button>
        </form>
      )}
    </li>
  );
}

function SetupSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <Skeleton className="mb-3 h-5 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <Skeleton className="mb-3 h-5 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}