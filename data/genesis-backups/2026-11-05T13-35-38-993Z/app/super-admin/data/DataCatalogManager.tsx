/*
path :           app/super-admin/data/DataCatalogManager.tsx
tag :            ["super-admin", "data", "manager", "client", "ui", "tabs", "rsc", "responsive"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Composant client de gestion des trois catalogues de
                 données statiques : types de commerçant, types de
                 produit, types de cuisine.

                 UX/UI REFONDUE :
                 - Tabs avec compteurs visibles (merchant/product/food).
                 - Barre d'outils dédiée par onglet : recherche pleine
                   largeur sur mobile, compteur visibles/total aligné
                   à droite, bouton Ajouter en évidence.
                 - Grille responsive :
                   * merchant/product : 2 cols mobile, 3 sm, 4 lg, 5 xl
                   * food             : 2 cols mobile, 3 sm, 4 lg, 6 xl
                 - Cartes merchant/product : grande pastille colorée
                   (square 14), libellé, badge de statut (Visible/Masqué),
                   footer Switch + bouton Supprimer (icône Trash via
                   caractère ×).
                 - Cartes food : image ratio carré, libellé, badge
                   statut, footer Switch + Supprimer.
                 - EmptyState aligné sur le design system (composant
                   EmptyState existant) pour les cas « aucun résultat »
                   et « catalogue vide ».
                 - Aucune icône Lucide dans les DONNÉES ; les rares
                   icônes d'UI (recherche, plus, supprimer) sont de
                   simples caractères ou SVG inline pour rester
                   cohérent avec la consigne « pas d'icône Lucide ».

                 ⚠️ GESTION EN MÉMOIRE : toggle, ajout, suppression
                 sont locaux (useState). Pas de persistance. Pour une
                 persistance réelle : Prisma + Zod + Server Actions.

flow:            Reçoit merchantTypes + productTypes + foodTypes →
                 useState ×3 → Tabs (3 onglets avec compteurs) →
                 chaque onglet rend :
                 - <TabToolbar /> (recherche + compteur + bouton)
                 - grille de cartes OU <EmptyState />
                 - Dialog d'ajout (merchant/product)
                 - AlertDialog de suppression
                 Pastille colorée pour merchant/product, image pour
                 food.

ecosystem:       SuperAdminData = [
                   "@/app/super-admin/data/foodTypeData.ts",
                   "@/app/super-admin/data/mercantType.ts",
                   "@/app/super-admin/data/productType.ts",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
                   "@/app/super-admin/interface/page.tsx",
                 ]

relatedFiles:    ["@/app/super-admin/data/foodTypeData.ts",
                  "@/app/super-admin/data/mercantType.ts",
                  "@/app/super-admin/data/productType.ts",
                  "@/app/super-admin/interface/page.tsx",
                  "@/components/ui/empty-state.tsx"]

imports:         ["react",
                  "@/app/super-admin/data/mercantType",
                  "@/app/super-admin/data/productType",
                  "@/app/super-admin/data/foodTypeData",
                  "@/components/ui/button",
                  "@/components/ui/input",
                  "@/components/ui/switch",
                  "@/components/ui/tabs",
                  "@/components/ui/dialog",
                  "@/components/ui/alert-dialog",
                  "@/components/ui/empty-state"]

exports:         ["DataCatalogManager", "DataCatalogManagerProps"]

useBy:           ["/app/super-admin/interface/page.tsx"]

userStories:     ["*en tant que super-admin je veux gérer les catalogues de types"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, Dialog, Switch, AlertDialog.

import { useEffect, useMemo, useState } from "react";

import type { MerchantType } from "@/app/super-admin/data/mercantType";
import type { ProductType } from "@/app/super-admin/data/productType";
import type { FoodImage } from "@/app/super-admin/data/foodTypeData";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface DataCatalogManagerProps {
  readonly merchantTypes: readonly MerchantType[];
  readonly productTypes: readonly ProductType[];
  readonly foodTypes: readonly FoodImage[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueId(label: string, existingIds: ReadonlySet<string>): string {
  const base = slugify(label) || "item";
  if (!existingIds.has(base)) return base;
  for (let i = 2; i <= 999; i++) {
    const candidate = `${base}-${i}`;
    if (!existingIds.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/* ------------------------------------------------------------------ */
/*  Badge de statut                                                    */
/* ------------------------------------------------------------------ */

function StatusBadge({ visible }: { readonly visible: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
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
/*  Bouton supprimer (× rendu propre, sans Lucide)                     */
/* ------------------------------------------------------------------ */

function DeleteButton({
  label,
  onClick,
}: {
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Supprimer ${label}`}
      className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
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
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Carte pastille + label (merchant / product)                        */
/* ------------------------------------------------------------------ */

interface PillCardProps {
  readonly label: string;
  readonly accent: string;
  readonly visible: boolean;
  readonly onToggle: (visible: boolean) => void;
  readonly onDelete: () => void;
}

function PillCard({
  label,
  accent,
  visible,
  onToggle,
  onDelete,
}: PillCardProps) {
  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ "--accent": `var(--${accent})` } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-80"
        style={{
          background: `linear-gradient(90deg, var(--${accent}), transparent)`,
        }}
      />

      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="size-12 shrink-0 rounded-xl shadow-sm"
          style={{
            background: `linear-gradient(135deg, var(--${accent}), color-mix(in oklab, var(--${accent}) 60%, black))`,
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold leading-snug text-foreground">
            {label}
          </p>
          <div className="mt-1.5">
            <StatusBadge visible={visible} />
          </div>
        </div>
      </div>

      <footer className="mt-4 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <Switch
            checked={visible}
            onCheckedChange={onToggle}
            aria-label={`Basculer la visibilité de ${label}`}
          />
          Visibilité
        </label>
        <DeleteButton label={label} onClick={onDelete} />
      </footer>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Carte image + label (food)                                         */
/* ------------------------------------------------------------------ */

interface ImageCardProps {
  readonly src: string;
  readonly label: string;
  readonly visible: boolean;
  readonly onToggle: (visible: boolean) => void;
  readonly onDelete: () => void;
}

function ImageCard({
  src,
  label,
  visible,
  onToggle,
  onDelete,
}: ImageCardProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label}
          className={`size-full object-cover transition-all duration-300 group-hover:scale-105 ${
            visible ? "" : "opacity-40 grayscale"
          }`}
          loading="lazy"
        />
        <div className="absolute right-2 top-2">
          <StatusBadge visible={visible} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-1 text-sm font-semibold text-foreground">
          {label}
        </p>

        <footer className="mt-auto flex items-center justify-between gap-2 pt-1">
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
            <Switch
              checked={visible}
              onCheckedChange={onToggle}
              aria-label={`Basculer la visibilité de ${label}`}
            />
            Visibilité
          </label>
          <DeleteButton label={label} onClick={onDelete} />
        </footer>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Barre d'outils d'onglet                                            */
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
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
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
        <span className="whitespace-nowrap rounded-full bg-muted/40 px-2.5 py-1 text-[11px] font-medium tabular-nums text-muted-foreground">
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
/*  Composant principal                                                */
/* ------------------------------------------------------------------ */

export function DataCatalogManager({
  merchantTypes,
  productTypes,
  foodTypes,
}: DataCatalogManagerProps) {
  const [merchants, setMerchants] = useState<MerchantType[]>([...merchantTypes]);
  const [products, setProducts] = useState<ProductType[]>([...productTypes]);
  const [foods, setFoods] = useState<FoodImage[]>([...foodTypes]);

  useEffect(() => {
    setMerchants([...merchantTypes]);
  }, [merchantTypes]);
  useEffect(() => {
    setProducts([...productTypes]);
  }, [productTypes]);
  useEffect(() => {
    setFoods([...foodTypes]);
  }, [foodTypes]);

  return (
    <Tabs defaultValue="merchant" className="w-full">
      <div className="overflow-x-auto pb-px">
        <TabsList>
          <TabsTrigger value="merchant">
            Commerçants
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {merchants.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="product">
            Produits
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {products.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="food">
            Cuisines
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {foods.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="merchant" className="pt-4">
        <MerchantTab items={merchants} setItems={setMerchants} />
      </TabsContent>

      <TabsContent value="product" className="pt-4">
        <ProductTab items={products} setItems={setProducts} />
      </TabsContent>

      <TabsContent value="food" className="pt-4">
        <FoodTab items={foods} setItems={setFoods} />
      </TabsContent>
    </Tabs>
  );
}

/* ------------------------------------------------------------------ */
/*  Onglet merchant                                                    */
/* ------------------------------------------------------------------ */

function MerchantTab({
  items,
  setItems,
}: {
  readonly items: readonly MerchantType[];
  readonly setItems: React.Dispatch<React.SetStateAction<MerchantType[]>>;
}) {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [deleting, setDeleting] = useState<MerchantType | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  const visibleCount = items.filter((i) => i.visibility).length;

  function handleAdd() {
    const trimmed = label.trim();
    if (!trimmed) return;
    const ids = new Set(items.map((i) => i.id));
    const next: MerchantType = {
      id: uniqueId(trimmed, ids),
      label: trimmed,
      accent: "chart-1",
      visibility: true,
    };
    setItems((prev) => [...prev, next]);
    setLabel("");
    setCreateOpen(false);
  }

  function handleToggle(id: string, visible: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, visibility: visible } : i)),
    );
  }

  function handleDelete() {
    if (!deleting) return;
    setItems((prev) => prev.filter((i) => i.id !== deleting.id));
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
      <TabToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Rechercher un type de commerçant…"
        total={items.length}
        visibleCount={visibleCount}
        onCreate={() => setCreateOpen(true)}
        createLabel="Nouveau type"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={
            items.length === 0
              ? "Aucun type de commerçant"
              : "Aucun résultat"
          }
          description={
            items.length === 0
              ? "Ajoutez un premier type pour qu'il apparaisse dans les formulaires d'onboarding."
              : `Aucun type ne correspond à « ${query} ».`
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <PillCard
              key={item.id}
              label={item.label}
              accent={item.accent}
              visible={item.visibility}
              onToggle={(v) => handleToggle(item.id, v)}
              onDelete={() => setDeleting(item)}
            />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau type de commerçant</DialogTitle>
            <DialogDescription>
              Le libellé sera slugifié pour créer l&apos;identifiant.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Pizzeria"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={!label.trim()}>
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce type ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleting?.label} » sera retiré de la liste.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Onglet product                                                     */
/* ------------------------------------------------------------------ */

function ProductTab({
  items,
  setItems,
}: {
  readonly items: readonly ProductType[];
  readonly setItems: React.Dispatch<React.SetStateAction<ProductType[]>>;
}) {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [deleting, setDeleting] = useState<ProductType | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  const visibleCount = items.filter((i) => i.visibility).length;

  function handleAdd() {
    const trimmed = label.trim();
    if (!trimmed) return;
    const ids = new Set(items.map((i) => i.id));
    const next: ProductType = {
      id: uniqueId(trimmed, ids),
      label: trimmed,
      accent: "chart-2",
      visibility: true,
    };
    setItems((prev) => [...prev, next]);
    setLabel("");
    setCreateOpen(false);
  }

  function handleToggle(id: string, visible: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, visibility: visible } : i)),
    );
  }

  function handleDelete() {
    if (!deleting) return;
    setItems((prev) => prev.filter((i) => i.id !== deleting.id));
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
      <TabToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Rechercher un type de produit…"
        total={items.length}
        visibleCount={visibleCount}
        onCreate={() => setCreateOpen(true)}
        createLabel="Nouveau type"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={
            items.length === 0 ? "Aucun type de produit" : "Aucun résultat"
          }
          description={
            items.length === 0
              ? "Ajoutez un premier type pour qu'il apparaisse dans les formulaires de création de produit."
              : `Aucun type ne correspond à « ${query} ».`
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <PillCard
              key={item.id}
              label={item.label}
              accent={item.accent}
              visible={item.visibility}
              onToggle={(v) => handleToggle(item.id, v)}
              onDelete={() => setDeleting(item)}
            />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau type de produit</DialogTitle>
            <DialogDescription>
              Le libellé sera slugifié pour créer l&apos;identifiant.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Pizza"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={!label.trim()}>
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce type ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleting?.label} » sera retiré de la liste.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Onglet food                                                        */
/* ------------------------------------------------------------------ */

function FoodTab({
  items,
  setItems,
}: {
  readonly items: readonly FoodImage[];
  readonly setItems: React.Dispatch<React.SetStateAction<FoodImage[]>>;
}) {
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<FoodImage | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.text.toLowerCase().includes(q));
  }, [items, query]);

  const visibleCount = items.filter((i) => i.visibility).length;

  function handleToggle(src: string, visible: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.src === src ? { ...i, visibility: visible } : i)),
    );
  }

  function handleDelete() {
    if (!deleting) return;
    setItems((prev) => prev.filter((i) => i.src !== deleting.src));
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
      <TabToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Rechercher un type de cuisine…"
        total={items.length}
        visibleCount={visibleCount}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={
            items.length === 0 ? "Aucun type de cuisine" : "Aucun résultat"
          }
          description={
            items.length === 0
              ? "Aucun type de cuisine n'est configuré pour le moment."
              : `Aucun type ne correspond à « ${query} ».`
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {filtered.map((item) => (
            <ImageCard
              key={item.src}
              src={item.src}
              label={item.text}
              visible={item.visibility}
              onToggle={(v) => handleToggle(item.src, v)}
              onDelete={() => setDeleting(item)}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce type ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleting?.text} » sera retiré de la liste.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}