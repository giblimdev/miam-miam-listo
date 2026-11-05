/*
path :           app/super-admin/data/DataCatalogManager.tsx
tag :            ["super-admin", "catalog", "manager", "client", "ui", "tabs", "persistence", "images", "compact"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Composant client de gestion des catalogues de types.

                 ⚠️ CARTE UNIFIÉE COMPACTE : les 3 catégories utilisent
                 une carte compacte (image 4:3 en haut) :
                 - merchant / product : grille 2/3/4/5 colonnes.
                 - food              : grille 2/3/4/6/8 colonnes et
                   image 4:3 (pas carrée) pour éviter des vignettes
                   énormes. Ratio plus court, texte plus petit.

                 Avant, food était en `aspect-square` jusqu'à 6
                 colonnes → chaque vignette prenait ~1/2 de la largeur
                 sur mobile et ~1/6 sur desktop, ce qui donnait des
                 images trop grandes. On réduit le ratio à 4:3 et on
                 densifie la grille.

                 ⚠️ AUCUNE ICÔNE LUCIDE : SVG inline pour recherche et
                 suppression.

flow:            Reçoit merchant + product + food (CatalogItem[]) →
                 Tabs (flex-col, TabsList border-b en haut) →
                 chaque onglet : TabToolbar + grille de CatalogCard
                 OU EmptyState + Dialog d'ajout. Toggle → Server
                 Action. Ajout → Server Action. Suppression → Server
                 Action.

ecosystem:       SuperAdminCatalog = [
                   "@/app/super-admin/data/catalog/actions.ts",
                   "@/app/super-admin/data/catalog/service.ts",
                   "@/app/super-admin/data/catalog/storage.ts",
                   "@/app/super-admin/data/catalog/types.ts",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
                   "@/app/super-admin/interface/page.tsx",
                 ]

relatedFiles:    ["@/app/super-admin/data/catalog/actions.ts",
                  "@/app/super-admin/data/catalog/types.ts",
                  "@/app/super-admin/interface/page.tsx",
                  "@/hooks/useActionResult.ts"]

imports:         ["react",
                  "@/app/super-admin/data/catalog/actions",
                  "@/app/super-admin/data/catalog/types",
                  "@/components/ui/button",
                  "@/components/ui/input",
                  "@/components/ui/switch",
                  "@/components/ui/tabs",
                  "@/components/ui/dialog",
                  "@/components/ui/empty-state",
                  "@/hooks/useActionResult"]

exports:         ["DataCatalogManager", "DataCatalogManagerProps"]

useBy:           ["/app/super-admin/interface/page.tsx"]

userStories:     ["*en tant que super-admin je veux gérer les catalogues de types"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, Dialog, Switch, useActionResult.

import { useMemo, useState } from "react";

import {
  createCatalogItemAction,
  deleteCatalogItemAction,
  toggleCatalogVisibilityAction,
} from "@/app/super-admin/data/catalog/actions";
import type {
  CatalogCategory,
  CatalogItem,
} from "@/app/super-admin/data/catalog/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useActionResult } from "@/hooks/useActionResult";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface DataCatalogManagerProps {
  readonly merchant: readonly CatalogItem[];
  readonly product: readonly CatalogItem[];
  readonly food: readonly CatalogItem[];
}

/* ------------------------------------------------------------------ */
/*  SVG inline                                                         */
/* ------------------------------------------------------------------ */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0 text-muted-foreground"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Badge de statut                                                    */
/* ------------------------------------------------------------------ */

function StatusBadge({ visible }: { readonly visible: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        visible
          ? "bg-chart-4/15 text-chart-4"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${
          visible ? "bg-chart-4" : "bg-muted-foreground/50"
        }`}
      />
      {visible ? "Visible" : "Masqué"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Carte compacte (image 4:3 + overlay accent)                        */
/* ------------------------------------------------------------------ */

interface CatalogCardProps {
  readonly item: CatalogItem;
  readonly category: CatalogCategory;
  /** "compact" → grille dense pour food. "default" → merchant/product. */
  readonly density?: "default" | "compact";
}

function CatalogCard({
  item,
  category,
  density = "default",
}: CatalogCardProps) {
  const { run, isPending } = useActionResult();
  const accent = item.accent ?? "chart-2";
  const compact = density === "compact";

  function handleToggle(visible: boolean) {
    run(() => toggleCatalogVisibilityAction(category, item.slug, visible), {
      successMessage: visible ? "Rendu visible." : "Rendu masqué.",
      refresh: true,
    });
  }

  function handleDelete() {
    run(() => deleteCatalogItemAction(category, item.slug), {
      successMessage: "Type supprimé.",
      refresh: true,
    });
  }

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ "--accent": `var(--${accent})` } as React.CSSProperties}
    >
      {/* Image — ratio 4:3 (pas carré) pour des vignettes compactes */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageSrc ?? "/placeholder.webp"}
          alt={item.label}
          className={`size-full object-cover transition-all duration-300 group-hover:scale-105 ${
            item.visibility ? "" : "opacity-40 grayscale"
          }`}
          loading="lazy"
        />

        {/* Bande accent en haut */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 opacity-80"
          style={{
            background: `linear-gradient(90deg, var(--${accent}), transparent)`,
          }}
        />

        {/* Badge statut superposé */}
        <div className="absolute right-1.5 top-1.5">
          <StatusBadge visible={item.visibility} />
        </div>
      </div>

      {/* Contenu + actions */}
      <div
        className={`flex flex-1 flex-col gap-1.5 ${
          compact ? "p-2" : "p-2.5"
        }`}
      >
        <p
          className={`line-clamp-1 font-semibold text-foreground ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {item.label}
        </p>

        <footer className="mt-auto flex items-center justify-between gap-1.5 pt-0.5">
          <label className="flex cursor-pointer items-center gap-1 text-[10px] text-muted-foreground">
            <Switch
              checked={item.visibility}
              onCheckedChange={handleToggle}
              disabled={isPending}
              aria-label={`Basculer la visibilité de ${item.label}`}
            />
            {!compact && <span>Visibilité</span>}
          </label>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            aria-label={`Supprimer ${item.label}`}
            className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <DeleteIcon />
          </button>
        </footer>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Barre d'outils                                                     */
/* ------------------------------------------------------------------ */

function TabToolbar({
  query,
  onQueryChange,
  placeholder,
  total,
  visibleCount,
  onCreate,
  createLabel,
}: {
  readonly query: string;
  readonly onQueryChange: (v: string) => void;
  readonly placeholder: string;
  readonly total: number;
  readonly visibleCount: number;
  readonly onCreate?: () => void;
  readonly createLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex flex-1 items-center gap-2 rounded-md bg-muted/30 px-2.5 py-1.5 focus-within:bg-muted/50">
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-6 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {visibleCount} / {total} visibles
        </span>
        {onCreate && createLabel && (
          <Button type="button" size="sm" onClick={onCreate}>
            <span aria-hidden className="text-base leading-none">+</span>
            {createLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Onglet générique                                                   */
/* ------------------------------------------------------------------ */

interface TabProps {
  readonly category: CatalogCategory;
  readonly items: readonly CatalogItem[];
  readonly searchPlaceholder: string;
  readonly createLabel?: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  /** "compact" → grille dense (food). "default" → merchant/product. */
  readonly density?: "default" | "compact";
}

function CatalogTab({
  category,
  items,
  searchPlaceholder,
  createLabel,
  emptyTitle,
  emptyDescription,
  density = "default",
}: TabProps) {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState("");
  const { run, isPending } = useActionResult();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  const visibleCount = items.filter((i) => i.visibility).length;

  const gridClass =
    density === "compact"
      ? "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
      : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

  function handleAdd() {
    const trimmed = label.trim();
    if (!trimmed) return;
    run(() => createCatalogItemAction(category, trimmed), {
      successMessage: "Type créé.",
      onSuccess: () => {
        setLabel("");
        setCreateOpen(false);
      },
      refresh: true,
    });
  }

  return (
    <div className="space-y-4">
      <TabToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder={searchPlaceholder}
        total={items.length}
        visibleCount={visibleCount}
        onCreate={createLabel ? () => setCreateOpen(true) : undefined}
        createLabel={createLabel}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? emptyTitle : "Aucun résultat"}
          description={
            items.length === 0
              ? emptyDescription
              : `Aucun type ne correspond à « ${query} ».`
          }
        />
      ) : (
        <div className={gridClass}>
          {filtered.map((item) => (
            <CatalogCard
              key={item.slug}
              item={item}
              category={category}
              density={density}
            />
          ))}
        </div>
      )}

      {createLabel && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{createLabel}</DialogTitle>
              <DialogDescription>
                Le libellé sera slugifié pour créer l&apos;identifiant.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Libellé"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isPending || !label.trim()}
              >
                Créer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Composant principal                                                */
/* ------------------------------------------------------------------ */

export function DataCatalogManager({
  merchant,
  product,
  food,
}: DataCatalogManagerProps) {
  return (
    <Tabs defaultValue="merchant" className="flex flex-col gap-0">
      <div className="-mx-1 overflow-x-auto border-b border-border/60 pb-px">
        <TabsList
          variant="line"
          className="ml-1 h-auto gap-1 rounded-none bg-transparent p-0"
        >
          <TabsTrigger value="merchant" className="rounded-none px-3 py-2.5">
            Commerçants
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {merchant.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="product" className="rounded-none px-3 py-2.5">
            Produits
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {product.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="food" className="rounded-none px-3 py-2.5">
            Cuisines
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {food.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="merchant" className="pt-4">
        <CatalogTab
          category="merchant"
          items={merchant}
          searchPlaceholder="Rechercher un type de commerçant…"
          createLabel="Nouveau type"
          emptyTitle="Aucun type de commerçant"
          emptyDescription="Ajoutez un premier type pour qu'il apparaisse dans les formulaires d'onboarding."
        />
      </TabsContent>

      <TabsContent value="product" className="pt-4">
        <CatalogTab
          category="product"
          items={product}
          searchPlaceholder="Rechercher un type de produit…"
          createLabel="Nouveau type"
          emptyTitle="Aucun type de produit"
          emptyDescription="Ajoutez un premier type pour qu'il apparaisse dans les formulaires de création de produit."
        />
      </TabsContent>

      <TabsContent value="food" className="pt-4">
        <CatalogTab
          category="food"
          items={food}
          searchPlaceholder="Rechercher un type de cuisine…"
          emptyTitle="Aucun type de cuisine"
          emptyDescription="Aucun type de cuisine n'est configuré pour le moment."
          density="compact"
        />
      </TabsContent>
    </Tabs>
  );
}