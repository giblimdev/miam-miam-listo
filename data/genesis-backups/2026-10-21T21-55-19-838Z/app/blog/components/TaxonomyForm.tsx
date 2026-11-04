/*
path :           app/blog/components/TaxonomyForm.tsx
tag :            ["blog", "component", "admin", "taxonomy", "form", "tree"]
projectId:       new-genesis
type:            component
generic:         false

role:            Orchestrateur du CRUD taxonomie 3 niveaux. Affiche
                 l'arbre thèmes → catégories → sous-catégories en
                 accordéon (un thème ouvert à la fois), avec pour
                 chaque niveau : nom, slug, description, couleur/icône
                 (thème), boutons Éditer / Supprimer / Ajouter un
                 enfant. Une Dialog unifiée sert à créer et éditer un
                 thème, une catégorie ou une sous-catégorie. L'arbre
                 est passé en props (readonly) et rafraîchi par
                 router.refresh() après chaque mutation réussie
                 (Server Actions déjà revalidées). La suppression d'un
                 thème avec catégories / d'une catégorie avec
                 sous-catégories est refusée côté serveur : l'erreur
                 remontée est affichée dans la dialog. Client Component :
                 useState, useTransition, toast.

flow:            Props { themes: readonly Theme[] } → useState(openThemeId,
                 editing: {kind, themeId?, categoryId?, entity?} | null,
                 deleting: same shape | null) → rend l'arbre en accordéon
                 → bouton Éditer → dialog édition → submit → action
                 (createThemeAction / updateThemeAction / …) → si ok :
                 toast + router.refresh() + ferme la dialog → si erreur :
                 setError + toast. Bouton Supprimer → AlertDialog →
                 deleteThemeAction / deleteCategoryAction /
                 deleteSubCategoryAction → si ok : toast + refresh → si
                 erreur : toast erreur (règle métier : suppression
                 refusée si enfants présents).

ecosystem:       BlogUI = [
                   "@/app/blog/components/ArticleBody.tsx",
                   "@/app/blog/components/ArticleCard.tsx",
                   "@/app/blog/components/ArticleForm.tsx",
                   "@/app/blog/components/ArticleHeader.tsx",
                   "@/app/blog/components/CommentForm.tsx",
                   "@/app/blog/components/CommentTree.tsx",
                   "@/app/blog/components/ContentBlockRenderer.tsx",
                   "@/app/blog/components/CoverImagePicker.tsx",
                   "@/app/blog/components/DiscussionThread.tsx",
                   "@/app/blog/components/FavoriteButton.tsx",
                   "@/app/blog/components/GroupCard.tsx",
                   "@/app/blog/components/LikeButton.tsx",
                   "@/app/blog/components/NotificationBell.tsx",
                   "@/app/blog/components/NotificationList.tsx",
                   "@/app/blog/components/PostTree.tsx",
                   "@/app/blog/components/QuickCreateCategoryDialog.tsx",
                   "@/app/blog/components/QuickCreateTagDialog.tsx",
                   "@/app/blog/components/SearchFilters.tsx",
                   "@/app/blog/components/TableOfContents.tsx",
                   "@/app/blog/components/TagForm.tsx",
                   "@/app/blog/components/TagSection.tsx",
                   "@/app/blog/components/TaxonomyForm.tsx",
                   "@/app/blog/components/TaxonomyNav.tsx",
                   "@/app/blog/components/articleDraft.ts",
                   "@/app/blog/components/block-editor/BlockEditor.tsx",
                   "@/app/blog/components/block-editor/BlockList.tsx",
                   "@/app/blog/components/block-editor/BlockToolbar.tsx",
                   "@/app/blog/components/block-editor/BlockTypeMenu.tsx",
                   "@/app/blog/components/block-editor/forms/AudioBlockForm.tsx",
                   "@/app/blog/components/block-editor/forms/CodeBlockForm.tsx",
                   "@/app/blog/components/block-editor/forms/DocumentBlockForm.tsx",
                   "@/app/blog/components/block-editor/forms/EmbedBlockForm.tsx",
                   "@/app/blog/components/block-editor/forms/ImageBlockForm.tsx",
                   "@/app/blog/components/block-editor/forms/ParagraphBlockForm.tsx",
                   "@/app/blog/components/block-editor/forms/SectionBlockForm.tsx",
                   "@/app/blog/components/block-editor/forms/VideoBlockForm.tsx",
                 ]

relatedFiles:    ["@/app/blog/lib/actions/taxonomy.ts",
                  "@/app/blog/lib/types.ts"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/taxonomy",
                  "@/app/blog/lib/types",
                  "@/components/ui/button",
                  "@/components/ui/dialog",
                  "@/components/ui/accordion",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/ui/textarea",
                  "@/components/ui/alert-dialog"]

exports:         ["TaxonomyForm", "TaxonomyFormProps"]

useBy:           ["@/app/blog/admin/taxonomy/page.tsx"]

userStories:     ["us1100001", "us1100002", "us1100003"]
status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, useTransition, router.refresh, dialogs.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  FolderTree,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  createCategoryAction,
  createSubCategoryAction,
  createThemeAction,
  deleteCategoryAction,
  deleteSubCategoryAction,
  deleteThemeAction,
  updateCategoryAction,
  updateSubCategoryAction,
  updateThemeAction,
} from "@/app/blog/lib/actions/taxonomy";
import type { Category, SubCategory, Theme } from "@/app/blog/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type EntityKind = "theme" | "category" | "subcategory";

interface EditTarget {
  readonly kind: EntityKind;
  readonly themeId?: string;
  readonly categoryId?: string;
  readonly entity?: Theme | Category | SubCategory;
}

export interface TaxonomyFormProps {
  readonly themes: readonly Theme[];
}

/* ------------------------------------------------------------------ */
/*  Composant principal                                               */
/* ------------------------------------------------------------------ */

export function TaxonomyForm({ themes }: TaxonomyFormProps) {
  const router = useRouter();
  const [openThemeId, setOpenThemeId] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [deleting, setDeleting] = useState<EditTarget | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate(
    kind: EntityKind,
    parent: { themeId?: string; categoryId?: string } = {},
  ) {
    setEditing({ kind, ...parent });
  }

  function openEdit(target: EditTarget) {
    setEditing(target);
  }

  function handleDelete() {
    if (!deleting) return;
    startTransition(async () => {
      let result;
      if (deleting.kind === "theme" && deleting.themeId) {
        result = await deleteThemeAction(deleting.themeId);
      } else if (
        deleting.kind === "category" &&
        deleting.themeId &&
        deleting.categoryId
      ) {
        result = await deleteCategoryAction(
          deleting.themeId,
          deleting.categoryId,
        );
      } else if (
        deleting.kind === "subcategory" &&
        deleting.themeId &&
        deleting.categoryId &&
        deleting.entity
      ) {
        result = await deleteSubCategoryAction(
          deleting.themeId,
          deleting.categoryId,
          deleting.entity.id,
        );
      } else {
        return;
      }
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Supprimé.");
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Taxonomie
          </h2>
          <p className="text-sm text-muted-foreground">
            {themes.length} thème{themes.length > 1 ? "s" : ""} · hiérarchie
            3 niveaux
          </p>
        </div>
        <Button
          type="button"
          onClick={() => openCreate("theme")}
          className="gap-2"
        >
          <Plus className="size-4" aria-hidden />
          Nouveau thème
        </Button>
      </header>

      {themes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
          <Layers className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <p className="mt-2 text-sm text-muted-foreground">
            Aucun thème pour l&apos;instant.
          </p>
        </div>
      ) : (
        <Accordion
          multiple={false}
          defaultValue={[]}
          value={openThemeId ? [openThemeId] : []}
          onValueChange={(values: string[]) =>
            setOpenThemeId(values[0] ?? null)
          }
        >
          {themes.map((theme) => (
            <AccordionItem
              key={theme.id}
              value={theme.id}
              className="rounded-xl border border-border/60 bg-card not-last:mb-2"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex flex-1 items-center gap-3 text-left">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, var(--${theme.color}), color-mix(in oklab, var(--${theme.color}) 60%, black))`,
                    }}
                    aria-hidden
                  >
                    <Layers className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">
                      {theme.name}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      /{theme.slug} · {theme.categories.length} catégorie
                      {theme.categories.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 px-4 pb-4">
                <div className="flex flex-wrap gap-2 pb-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openEdit({
                        kind: "theme",
                        themeId: theme.id,
                        entity: theme,
                      })
                    }
                    className="gap-1.5"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Éditer le thème
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openCreate("category", { themeId: theme.id })
                    }
                    className="gap-1.5"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Ajouter une catégorie
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDeleting({ kind: "theme", themeId: theme.id })
                    }
                    className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Supprimer
                  </Button>
                </div>

                {theme.categories.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-3 text-center text-xs text-muted-foreground">
                    Aucune catégorie dans ce thème.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {theme.categories.map((cat) => (
                      <li
                        key={cat.id}
                        className="rounded-lg border border-border/60 bg-muted/10 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <FolderTree
                            className="size-4 shrink-0 text-chart-2"
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {cat.name}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              /{cat.slug} · {cat.subCategories.length}{" "}
                              sous-catégorie
                              {cat.subCategories.length > 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              type="button"
                              size="icon-xs"
                              variant="ghost"
                              onClick={() =>
                                openEdit({
                                  kind: "category",
                                  themeId: theme.id,
                                  categoryId: cat.id,
                                  entity: cat,
                                })
                              }
                              aria-label={`Éditer ${cat.name}`}
                            >
                              <Pencil aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              size="icon-xs"
                              variant="ghost"
                              onClick={() =>
                                openCreate("subcategory", {
                                  themeId: theme.id,
                                  categoryId: cat.id,
                                })
                              }
                              aria-label={`Ajouter une sous-catégorie à ${cat.name}`}
                            >
                              <Plus aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              size="icon-xs"
                              variant="ghost"
                              onClick={() =>
                                setDeleting({
                                  kind: "category",
                                  themeId: theme.id,
                                  categoryId: cat.id,
                                })
                              }
                              aria-label={`Supprimer ${cat.name}`}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 aria-hidden />
                            </Button>
                          </div>
                        </div>

                        {cat.subCategories.length > 0 && (
                          <ul className="mt-2 space-y-1 pl-6">
                            {cat.subCategories.map((sub) => (
                              <li
                                key={sub.id}
                                className="flex items-center gap-2 rounded-md bg-background/60 px-2 py-1"
                              >
                                <ChevronRight
                                  className="size-3 shrink-0 text-muted-foreground"
                                  aria-hidden
                                />
                                <p className="min-w-0 flex-1 truncate text-xs text-foreground/90">
                                  {sub.name}{" "}
                                  <span className="text-muted-foreground">
                                    /{sub.slug}
                                  </span>
                                </p>
                                <Button
                                  type="button"
                                  size="icon-xs"
                                  variant="ghost"
                                  onClick={() =>
                                    openEdit({
                                      kind: "subcategory",
                                      themeId: theme.id,
                                      categoryId: cat.id,
                                      entity: sub,
                                    })
                                  }
                                  aria-label={`Éditer ${sub.name}`}
                                >
                                  <Pencil aria-hidden />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon-xs"
                                  variant="ghost"
                                  onClick={() =>
                                    setDeleting({
                                      kind: "subcategory",
                                      themeId: theme.id,
                                      categoryId: cat.id,
                                      entity: sub,
                                    })
                                  }
                                  aria-label={`Supprimer ${sub.name}`}
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 aria-hidden />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <EntityDialog
        target={editing}
        themes={themes}
        onClose={() => setEditing(null)}
        onSuccess={() => {
          setEditing(null);
          router.refresh();
        }}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. La suppression est refusée si
              l&apos;entité contient des enfants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dialog d'édition unifiée                                          */
/* ------------------------------------------------------------------ */

interface EntityDialogProps {
  readonly target: EditTarget | null;
  readonly themes: readonly Theme[];
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

function EntityDialog({ target, onClose, onSuccess }: EntityDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("chart-1");
  const [icon, setIcon] = useState("Sparkles");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  /* Reset à chaque nouvelle cible */
  const targetKey = target
    ? `${target.kind}:${target.themeId ?? ""}:${target.categoryId ?? ""}:${target.entity?.id ?? "new"}`
    : "";
  const [lastKey, setLastKey] = useState<string>("");
  if (targetKey !== lastKey) {
    setLastKey(targetKey);
    const entity = target?.entity;
    setName(entity?.name ?? "");
    setDescription(
      entity && "description" in entity ? (entity.description ?? "") : "",
    );
    if (entity && "color" in entity) setColor(entity.color ?? "chart-1");
    if (entity && "icon" in entity) setIcon(entity.icon ?? "Sparkles");
    setError(null);
  }

  if (!target) return null;

  const titleByKind: Record<EntityKind, string> = {
    theme: target.entity ? "Éditer le thème" : "Nouveau thème",
    category: target.entity ? "Éditer la catégorie" : "Nouvelle catégorie",
    subcategory: target.entity
      ? "Éditer la sous-catégorie"
      : "Nouvelle sous-catégorie",
  };

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("description", description.trim());
    if (target?.kind === "theme") {
      formData.set("color", color.trim() || "chart-1");
      formData.set("icon", icon.trim() || "Sparkles");
    }

    startTransition(async () => {
      let result;
      if (target?.kind === "theme") {
        result = target.entity
          ? await updateThemeAction(target.entity.id, formData)
          : await createThemeAction(formData);
      } else if (target?.kind === "category" && target.themeId) {
        result = target.entity
          ? await updateCategoryAction(
              target.themeId,
              target.entity.id,
              formData,
            )
          : await createCategoryAction(target.themeId, formData);
      } else if (
        target?.kind === "subcategory" &&
        target.themeId &&
        target.categoryId
      ) {
        result = target.entity
          ? await updateSubCategoryAction(
              target.themeId,
              target.categoryId,
              target.entity.id,
              formData,
            )
          : await createSubCategoryAction(
              target.themeId,
              target.categoryId,
              formData,
            );
      } else {
        return;
      }
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Enregistré.");
      onSuccess();
    });
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{titleByKind[target.kind]}</DialogTitle>
          <DialogDescription>
            Le slug est généré automatiquement à partir du nom.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive"
            >
              {error}
            </p>
          )}

          <Field>
            <FieldLabel htmlFor="entity-name">Nom</FieldLabel>
            <Input
              id="entity-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={100}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="entity-description">
              Description (optionnel)
            </FieldLabel>
            <Textarea
              id="entity-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={500}
            />
          </Field>

          {target.kind === "theme" && (
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="entity-color">Couleur</FieldLabel>
                <Input
                  id="entity-color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  maxLength={50}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="entity-icon">Icône (Lucide)</FieldLabel>
                <Input
                  id="entity-icon"
                  value={icon}
                  onChange={(event) => setIcon(event.target.value)}
                  maxLength={50}
                />
              </Field>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Save className="size-4" aria-hidden />
              )}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}