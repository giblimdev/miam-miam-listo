/*
path :           app/super-admin/data/DataCatalogManager.tsx
tag :            ["super-admin", "data", "manager", "client", "ui", "tabs"]
projectId:       <à fournir>
type:            component
generic:         false

role:            Composant client de gestion des trois catalogues de
                 données statiques : types de commerçant, types de
                 produit, types de cuisine. Présente trois onglets
                 (Tabs) avec, pour chacun :
                 - une barre de recherche (filtre client sur le
                   libellé) ;
                 - une grille responsive de cartes (icône/image,
                   libellé, switch de visibilité, bouton supprimer) ;
                 - un bouton « Ajouter » qui ouvre une petite
                   modale (Input libellé) ;
                 - un compteur (visibles / total).

                 ⚠️ GESTION EN MÉMOIRE : le composant travaille sur
                 une COPIE locale des données (useState initialisé
                 depuis les props). Les modifications (toggle, ajout,
                 suppression) ne sont PAS persistées au rechargement.
                 Pour une persistance réelle, il faudra un modèle
                 Prisma + validation Zod + Server Actions — chantier
                 séparé, hors périmètre de ce composant.

                 Pattern de state :
                 - Chaque catalogue a son propre state local
                   (merchants, products, foods).
                 - Un useEffect synchronise le state local si les
                   props changent (cas d'un router.refresh() après
                   une mutation hypothétique future).
                 - L'ajout génère un id slugifié à partir du libellé,
                   avec suffixe -2, -3… si collision.
                 - La suppression demande confirmation (AlertDialog).

flow:            Reçoit merchantTypes + productTypes + foodTypes →
                 useState ×3 → Tabs (3 onglets) → chaque onglet rend
                 <CatalogTab /> : recherche, grille, bouton Ajouter,
                 Dialog d'ajout, AlertDialog de suppression. Toggle →
                 setVisibility (local). Ajout → Dialog + Input →
                 nouvelle entrée locale. Suppression → AlertDialog →
                 retrait local.

ecosystem:       SuperAdminData = [
                   "@/app/super-admin/data/foodTypeData.ts",
                   "@/app/super-admin/data/mercantType.ts",
                   "@/app/super-admin/data/productType.ts",
                   "@/app/super-admin/data/page.tsx",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
                 ]

relatedFiles:    ["@/app/super-admin/data/foodTypeData.ts",
                  "@/app/super-admin/data/mercantType.ts",
                  "@/app/super-admin/data/productType.ts",
                  "@/app/super-admin/data/page.tsx"]

imports:         ["react", "lucide-react",
                  "@/app/super-admin/data/mercantType",
                  "@/app/super-admin/data/productType",
                  "@/app/super-admin/data/foodTypeData",
                  "@/components/ui/button",
                  "@/components/ui/input",
                  "@/components/ui/switch",
                  "@/components/ui/tabs",
                  "@/components/ui/dialog",
                  "@/components/ui/alert-dialog"]

exports:         ["DataCatalogManager", "DataCatalogManagerProps"]

useBy:           ["/app/super-admin/data/page.tsx"]

userStories:     ["*en tant que super-admin je veux gérer les catalogues de types"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, filtres, Dialog, Switch, AlertDialog.

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";

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

/**
 * Slugifie un libellé en identifiant kebab-case.
 * Accents supprimés, minuscules, caractères non alphanumériques → "-".
 */
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Génère un id unique à partir d'un libellé, en suffixant -2, -3…
 * si collision avec les ids existants.
 */
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
/*  Sous-composant : carte d'une entrée (icône texte)                  */
/* ------------------------------------------------------------------ */

interface IconCardProps {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly accent: string;
  readonly visible: boolean;
  readonly onToggle: (visible: boolean) => void;
  readonly onDelete: () => void;
}

function IconCard({
  label,
  icon: Icon,
  accent,
  visible,
  onToggle,
  onDelete,
}: IconCardProps) {
  return (
    <article
      className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border/60 bg-card p-3 shadow-sm transition-all hover:shadow-md"
      style={{ "--accent": `var(--${accent})` } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-80"
        style={{
          background: `linear-gradient(90deg, var(--${accent}), transparent)`,
        }}
      />

      <div className="flex items-start gap-2">
        <div
          className="grid size-9 shrink-0 place-items-center rounded-lg text-white shadow-sm"
          style={{
            background: `linear-gradient(135deg, var(--${accent}), color-mix(in oklab, var(--${accent}) 60%, black))`,
          }}
        >
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold leading-snug text-foreground">
            {label}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {visible ? "Visible" : "Masqué"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Switch
          checked={visible}
          onCheckedChange={onToggle}
          aria-label={`Basculer la visibilité de ${label}`}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label={`Supprimer ${label}`}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Sous-composant : carte d'une entrée (image + texte)                */
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
    <article className="group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-border/60 bg-card p-2 shadow-sm transition-all hover:shadow-md">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label}
          className="size-full object-cover"
          loading="lazy"
        />
      </div>

      <p className="line-clamp-1 px-1 text-sm font-semibold text-foreground">
        {label}
      </p>

      <div className="flex items-center justify-between gap-1 px-1 pb-1">
        <Switch
          checked={visible}
          onCheckedChange={onToggle}
          aria-label={`Basculer la visibilité de ${label}`}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label={`Supprimer ${label}`}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      </div>
    </article>
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
  /* States locaux (copies mutables des props). */
  const [merchants, setMerchants] = useState<MerchantType[]>([
    ...merchantTypes,
  ]);
  const [products, setProducts] = useState<ProductType[]>([...productTypes]);
  const [foods, setFoods] = useState<FoodImage[]>([...foodTypes]);

  /* Resync si les props changent (router.refresh après mutation future). */
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
      <TabsList>
        <TabsTrigger value="merchant">Commerçants</TabsTrigger>
        <TabsTrigger value="product">Produits</TabsTrigger>
        <TabsTrigger value="food">Cuisines</TabsTrigger>
      </TabsList>

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
/*  Onglet : types de commerçant                                       */
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
      icon: StoreIconFallback,
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
      <TabHeader
        query={query}
        setQuery={setQuery}
        placeholder="Rechercher un type de commerçant…"
        total={items.length}
        visible={visibleCount}
        onCreate={() => setCreateOpen(true)}
        createLabel="Nouveau type"
      />

      {filtered.length === 0 ? (
        <EmptyMessage message="Aucun type de commerçant ne correspond." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <IconCard
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
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
/*  Onglet : types de produit                                          */
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
      icon: PackageIconFallback,
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
      <TabHeader
        query={query}
        setQuery={setQuery}
        placeholder="Rechercher un type de produit…"
        total={items.length}
        visible={visibleCount}
        onCreate={() => setCreateOpen(true)}
        createLabel="Nouveau type"
      />

      {filtered.length === 0 ? (
        <EmptyMessage message="Aucun type de produit ne correspond." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <IconCard
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
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
/*  Onglet : types de cuisine                                          */
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
      <TabHeader
        query={query}
        setQuery={setQuery}
        placeholder="Rechercher un type de cuisine…"
        total={items.length}
        visible={visibleCount}
        onCreate={undefined}
        createLabel=""
      />

      {filtered.length === 0 ? (
        <EmptyMessage message="Aucun type de cuisine ne correspond." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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

/* ------------------------------------------------------------------ */
/*  Sous-composant : en-tête d'onglet                                  */
/* ------------------------------------------------------------------ */

function TabHeader({
  query,
  setQuery,
  placeholder,
  total,
  visible,
  onCreate,
  createLabel,
}: {
  readonly query: string;
  readonly setQuery: (v: string) => void;
  readonly placeholder: string;
  readonly total: number;
  readonly visible: number;
  readonly onCreate: (() => void) | undefined;
  readonly createLabel: string;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/10 px-3 py-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 sm:max-w-sm sm:flex-1">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-6 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <span className="text-xs tabular-nums text-muted-foreground">
          {visible} / {total} visibles
        </span>
        {onCreate && (
          <Button type="button" size="sm" onClick={onCreate}>
            <Plus className="size-3.5" aria-hidden />
            {createLabel}
          </Button>
        )}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Sous-composant : message vide                                      */
/* ------------------------------------------------------------------ */

function EmptyMessage({ message }: { readonly message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Fallbacks d'icônes (pour les ajouts)                               */
/* ------------------------------------------------------------------ */

// Ces icônes sont utilisées uniquement pour les entrées créées
// dynamiquement en mémoire — elles seront remplacées par un vrai
// choix d'icône quand la persistance sera branchée.
import { Package as PackageIconFallback, Store as StoreIconFallback } from "lucide-react";