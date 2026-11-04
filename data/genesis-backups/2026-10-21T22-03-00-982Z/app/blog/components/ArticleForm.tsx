/*
path :           app/blog/components/ArticleForm.tsx
tag :            ["blog", "component", "admin", "article", "form", "editor", "playlist"]
projectId:       new-genesis
type:            component
generic:         false

role:            Formulaire complet d'article (métadonnées, taxonomie
                 3 niveaux, tags, playlist optionnelle, publication,
                 contenu via BlockEditor). Mode create → createArticleAction ;
                 mode edit → updateArticleAction. Après création/mise à
                 jour, appelle assignArticleToPlaylistAction(articleId,
                 playlistId | null) pour rattacher/détacher l'article à
                 une playlist (0 ou 1, contrainte respectée). Brouillon
                 persisté en sessionStorage (playlistId inclus). Couverture
                 uploadée immédiatement via CoverImagePicker, rollback
                 sur « Annuler ».

flow:            useState(champs) + loadDraft(mode, id) → useEffect de
                 sauvegarde débounce 500 ms → submit → FormData →
                 createArticleAction / updateArticleAction → succès :
                 assignArticleToPlaylistAction(articleId, playlistId) →
                 clearDraft + push.

ecosystem:       BlogUI = [
                   ... (voir tableau de référence)
                 ]

relatedFiles:    ["@/app/blog/lib/actions/article.ts",
                  "@/app/blog/lib/actions/playlist.ts",
                  "@/app/blog/lib/uploads/actions.ts",
                  "@/app/blog/lib/types.ts",
                  "@/app/blog/components/block-editor/BlockEditor.tsx",
                  "@/app/blog/components/CoverImagePicker.tsx",
                  "@/app/blog/components/QuickCreateCategoryDialog.tsx",
                  "@/app/blog/components/QuickCreateTagDialog.tsx",
                  "@/app/blog/components/articleDraft.ts"]

imports:         ["react", "next/link", "next/navigation", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/article",
                  "@/app/blog/lib/actions/playlist",
                  "@/app/blog/lib/uploads/actions",
                  "@/app/blog/lib/types",
                  "@/app/blog/components/block-editor/BlockEditor",
                  "@/app/blog/components/CoverImagePicker",
                  "@/app/blog/components/QuickCreateCategoryDialog",
                  "@/app/blog/components/QuickCreateTagDialog",
                  "@/app/blog/components/articleDraft",
                  "@/components/ui/button",
                  "@/components/ui/checkbox",
                  "@/components/ui/field",
                  "@/components/ui/input",
                  "@/components/ui/label",
                  "@/components/ui/native-select",
                  "@/components/ui/textarea",
                  "@/components/ui/tooltip"]

exports:         ["ArticleForm", "ArticleFormProps"]

useBy:           ["@/app/blog/articles/new/page.tsx",
                  "@/app/blog/articles/[id]/edit/page.tsx"]

userStories:     ["us1100005", "us1100006",
                  "*en tant qu'auteur je veux rattacher mon article à une playlist"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, useEffect, useMemo, useTransition,
// router.push, toast, Tooltip.

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  HelpCircle,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  createArticleAction,
  updateArticleAction,
} from "@/app/blog/lib/actions/article";
import { assignArticleToPlaylistAction } from "@/app/blog/lib/actions/playlist";
import { deleteCoverFileAction } from "@/app/blog/lib/uploads/actions";
import type {
  Article,
  ArticleStatus,
  ContentBlock,
  Playlist,
  Tag,
  Theme,
  Visibility,
} from "@/app/blog/lib/types";
import { BlockEditor } from "@/app/blog/components/block-editor/BlockEditor";
import { CoverImagePicker } from "@/app/blog/components/CoverImagePicker";
import { QuickCreateCategoryDialog } from "@/app/blog/components/QuickCreateCategoryDialog";
import { QuickCreateTagDialog } from "@/app/blog/components/QuickCreateTagDialog";
import {
  clearDraft,
  loadDraft,
  saveDraft,
} from "@/app/blog/components/articleDraft";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

export interface ArticleFormProps {
  readonly mode: "create" | "edit";
  readonly initial?: Article;
  readonly themes: readonly Theme[];
  readonly tags: readonly Tag[];
  readonly mediaManifest: readonly string[];
  readonly playlists: readonly Playlist[];
  readonly currentPlaylistId: string | null;
}

/* ------------------------------------------------------------------ */
/*  FieldLabelWithHint                                                */
/* ------------------------------------------------------------------ */

interface FieldLabelWithHintProps {
  readonly htmlFor: string;
  readonly children: React.ReactNode;
  readonly hint: string;
  readonly required?: boolean;
}

function FieldLabelWithHint({
  htmlFor,
  children,
  hint,
  required = true,
}: FieldLabelWithHintProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {children}
      </Label>
      {required && (
        <span
          aria-hidden
          className="text-sm font-semibold leading-none text-destructive"
        >
          *
        </span>
      )}
      <Tooltip>
        <TooltipTrigger
          type="button"
          aria-label={hint}
          className="grid size-4 place-items-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HelpCircle className="size-3.5" aria-hidden />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-balance">
          {hint}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SectionHeader                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({
  title,
  description,
  action,
}: {
  readonly title: string;
  readonly description?: string;
  readonly action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-2">
      <div className="space-y-0.5">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Composant                                                         */
/* ------------------------------------------------------------------ */

export function ArticleForm({
  mode,
  initial,
  themes,
  tags,
  mediaManifest,
  playlists,
  currentPlaylistId,
}: ArticleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const articleId = initial?.id ?? null;

  const draft = useMemo(
    () => loadDraft(mode, articleId),
    [mode, articleId],
  );

  const [title, setTitle] = useState(
    draft?.data.title ?? initial?.title ?? "",
  );
  const [summary, setSummary] = useState(
    draft?.data.summary ?? initial?.summary ?? "",
  );
  const [coverImage, setCoverImage] = useState(
    draft?.data.coverImage ?? initial?.coverImage ?? "",
  );
  const [themeId, setThemeId] = useState(
    draft?.data.themeId ?? initial?.themeId ?? themes[0]?.id ?? "",
  );
  const [categoryId, setCategoryId] = useState(
    draft?.data.categoryId ?? initial?.categoryId ?? "",
  );
  const [subCategoryId, setSubCategoryId] = useState(
    draft?.data.subCategoryId ?? initial?.subCategoryId ?? "",
  );
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    () =>
      new Set(draft?.data.tagIds ?? initial?.tagIds ?? []),
  );
  const [playlistId, setPlaylistId] = useState<string>(
    currentPlaylistId ?? "",
  );
  const [status, setStatus] = useState<ArticleStatus>(
    (draft?.data.status as ArticleStatus | undefined) ??
      initial?.status ??
      "draft",
  );
  const [visibility, setVisibility] = useState<Visibility>(
    (draft?.data.visibility as Visibility | undefined) ??
      initial?.visibility ??
      "public",
  );
  const [featured, setFeatured] = useState(
    draft?.data.featured ?? initial?.featured ?? false,
  );
  const [content, setContent] = useState<readonly ContentBlock[]>(
    (draft?.data.content as readonly ContentBlock[] | undefined) ??
      initial?.content ??
      [],
  );

  const [showDraftBanner, setShowDraftBanner] = useState(draft !== null);
  useEffect(() => {
    if (!showDraftBanner) return;
    const t = setTimeout(() => setShowDraftBanner(false), 8000);
    return () => clearTimeout(t);
  }, [showDraftBanner]);

  const [uploadedThisSession, setUploadedThisSession] = useState<
    string | null
  >(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDraft(mode, articleId, {
        title,
        summary,
        coverImage,
        themeId,
        categoryId,
        subCategoryId,
        tagIds: Array.from(selectedTagIds),
        status,
        visibility,
        featured,
        content,
      });
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    mode,
    articleId,
    title,
    summary,
    coverImage,
    themeId,
    categoryId,
    subCategoryId,
    selectedTagIds,
    status,
    visibility,
    featured,
    content,
  ]);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subCategoryDialogOpen, setSubCategoryDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);

  const currentTheme = useMemo(
    () => themes.find((t) => t.id === themeId),
    [themes, themeId],
  );
  const categories = currentTheme?.categories ?? [];

  const currentCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );
  const subCategories = currentCategory?.subCategories ?? [];

  function handleThemeChange(nextThemeId: string) {
    setThemeId(nextThemeId);
    setCategoryId("");
    setSubCategoryId("");
  }

  function handleCategoryChange(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    setSubCategoryId("");
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  function handleCoverChange(nextPath: string) {
    setCoverImage(nextPath);
    if (nextPath !== "" && nextPath !== initial?.coverImage) {
      setUploadedThisSession(nextPath);
    }
    if (nextPath === "") {
      setUploadedThisSession(null);
    }
  }

  function handleIgnoreDraft() {
    clearDraft(mode, articleId);
    setShowDraftBanner(false);
    toast.success("Brouillon ignoré.");
  }

  function handleCancel() {
    startTransition(async () => {
      if (uploadedThisSession) {
        await deleteCoverFileAction(uploadedThisSession);
      }
      clearDraft(mode, articleId);
      router.push("/blog/articles");
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("summary", summary.trim());
      if (coverImage.trim()) formData.set("coverImage", coverImage.trim());
      formData.set("themeId", themeId);
      if (categoryId) formData.set("categoryId", categoryId);
      if (subCategoryId) formData.set("subCategoryId", subCategoryId);
      for (const id of selectedTagIds) formData.append("tagIds", id);
      formData.set("status", status);
      formData.set("visibility", visibility);
      if (featured) formData.set("featured", "on");
      formData.set("content", JSON.stringify(content));

      const result =
        mode === "create"
          ? await createArticleAction(formData)
          : initial
            ? await updateArticleAction(initial.id, formData)
            : { ok: false as const, error: "Article introuvable." };

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      /* Assignation playlist (article ↔ 0 ou 1 playlist) */
      const targetArticleId = result.data.id;
      const targetPlaylistId = playlistId === "" ? null : playlistId;
      const assignment = await assignArticleToPlaylistAction(
        targetArticleId,
        targetPlaylistId,
      );
      if (!assignment.ok) {
        toast.error(`Article enregistré, mais : ${assignment.error}`);
        return;
      }

      clearDraft(mode, articleId);
      toast.success(
        mode === "create" ? "Article créé." : "Article mis à jour.",
      );
      router.push("/blog/articles");
      router.refresh();
    });
  }

  const taxonomyReturnUrl =
    mode === "edit" && articleId
      ? `/blog/articles/${articleId}/edit`
      : `/blog/articles/new`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showDraftBanner && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-chart-3/40 bg-chart-3/5 px-3 py-2 text-xs text-chart-3">
          <span className="flex items-center gap-1.5">
            <RotateCcw className="size-3.5" aria-hidden />
            Brouillon restauré.
          </span>
          <button
            type="button"
            onClick={handleIgnoreDraft}
            className="font-medium underline underline-offset-2 hover:text-foreground"
          >
            Ignorer le brouillon
          </button>
        </div>
      )}

      {/* 1. Métadonnées */}
      <section className="space-y-5 rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
        <SectionHeader
          title="Métadonnées"
          description="Titre, résumé et image de couverture de l'article."
        />

        <Field>
          <FieldLabelWithHint
            htmlFor="article-title"
            hint="Titre affiché en tête d'article. 3 à 200 caractères."
          >
            Titre
          </FieldLabelWithHint>
          <Input
            id="article-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={200}
            placeholder="Ex. Concevoir une architecture Next.js robuste"
          />
          <div className="flex justify-end">
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {title.length}/200
            </span>
          </div>
        </Field>

        <Field>
          <FieldLabelWithHint
            htmlFor="article-summary"
            hint="Résumé affiché sur les cartes et en métadonnées SEO. 20 à 500 caractères."
          >
            Résumé
          </FieldLabelWithHint>
          <Textarea
            id="article-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={3}
            required
            maxLength={500}
            placeholder="En une ou deux phrases, de quoi parle l'article ?"
          />
          <div className="flex justify-end">
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {summary.length}/500
            </span>
          </div>
        </Field>

        <Field>
          <FieldLabelWithHint
            htmlFor="article-cover"
            hint="Déposez, collez (Ctrl+V) ou cliquez pour choisir une image. Enregistrée immédiatement dans public/blog/articles/. Optionnel."
            required={false}
          >
            Couverture
          </FieldLabelWithHint>
          <CoverImagePicker
            value={coverImage}
            onChange={handleCoverChange}
            disabled={isPending}
          />
        </Field>
      </section>

      {/* 2. Playlist */}
      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
        <SectionHeader
          title="Playlist"
          description="Regroupez cet article dans une playlist éditoriale (0 ou 1)."
        />
        <Field>
          <FieldLabelWithHint
            htmlFor="article-playlist"
            hint="Une playlist est une collection ordonnée d'articles. Un article ne peut appartenir qu'à une seule playlist."
            required={false}
          >
            Playlist
          </FieldLabelWithHint>
          <NativeSelect
            id="article-playlist"
            value={playlistId}
            onChange={(event) => setPlaylistId(event.target.value)}
          >
            <NativeSelectOption value="">— Aucune —</NativeSelectOption>
            {playlists.map((p) => (
              <NativeSelectOption key={p.id} value={p.id}>
                {p.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </section>

      {/* 3. Taxonomie */}
      <section className="space-y-5 rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
        <SectionHeader
          title="Taxonomie"
          description="Thème, catégorie et sous-catégorie dépendants, plus les tags."
          action={
            <Link
              href={`/blog/taxonomy?return=${encodeURIComponent(taxonomyReturnUrl)}`}
              className={`${buttonVariants({ variant: "ghost", size: "sm" })} gap-1.5 text-muted-foreground hover:text-foreground`}
            >
              Gérer la taxonomie
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field>
            <FieldLabelWithHint
              htmlFor="article-theme"
              hint="Thème principal. Détermine la couleur d'accent et le classement dans le blog."
            >
              Thème
            </FieldLabelWithHint>
            <NativeSelect
              id="article-theme"
              value={themeId}
              onChange={(event) => handleThemeChange(event.target.value)}
              required
            >
              <NativeSelectOption value="">—</NativeSelectOption>
              {themes.map((theme) => (
                <NativeSelectOption key={theme.id} value={theme.id}>
                  {theme.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabelWithHint
              htmlFor="article-category"
              hint="Catégorie du thème sélectionné. Optionnel."
              required={false}
            >
              Catégorie
            </FieldLabelWithHint>
            <div className="flex gap-1.5">
              <NativeSelect
                id="article-category"
                value={categoryId}
                onChange={(event) => handleCategoryChange(event.target.value)}
                disabled={categories.length === 0}
                className="flex-1"
              >
                <NativeSelectOption value="">—</NativeSelectOption>
                {categories.map((cat) => (
                  <NativeSelectOption key={cat.id} value={cat.id}>
                    {cat.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setCategoryDialogOpen(true)}
                disabled={!themeId}
                aria-label="Créer une nouvelle catégorie"
                title="Créer une nouvelle catégorie"
              >
                <Plus className="size-3.5" aria-hidden />
              </Button>
            </div>
          </Field>

          <Field>
            <FieldLabelWithHint
              htmlFor="article-subcategory"
              hint="Sous-catégorie de la catégorie sélectionnée. Optionnel."
              required={false}
            >
              Sous-catégorie
            </FieldLabelWithHint>
            <div className="flex gap-1.5">
              <NativeSelect
                id="article-subcategory"
                value={subCategoryId}
                onChange={(event) => setSubCategoryId(event.target.value)}
                disabled={subCategories.length === 0}
                className="flex-1"
              >
                <NativeSelectOption value="">—</NativeSelectOption>
                {subCategories.map((sub) => (
                  <NativeSelectOption key={sub.id} value={sub.id}>
                    {sub.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setSubCategoryDialogOpen(true)}
                disabled={!categoryId}
                aria-label="Créer une nouvelle sous-catégorie"
                title="Créer une nouvelle sous-catégorie"
              >
                <Plus className="size-3.5" aria-hidden />
              </Button>
            </div>
          </Field>
        </div>

        <Field>
          <div className="flex items-center justify-between gap-2">
            <FieldLabelWithHint
              htmlFor="article-tags"
              hint="Plusieurs tags possibles. Ils aident au référencement interne et au filtrage."
              required={false}
            >
              Tags
              <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {selectedTagIds.size}
              </span>
            </FieldLabelWithHint>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTagDialogOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-3.5" aria-hidden />
              Nouveau tag
            </Button>
          </div>

          {tags.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aucun tag pour l&apos;instant. Créez-en via « Nouveau tag ».
            </p>
          ) : (
            <div
              id="article-tags"
              role="group"
              aria-label="Sélection des tags"
              className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border/60 bg-muted/10 p-3"
            >
              {tags.map((tag) => {
                const checked = selectedTagIds.has(tag.id);
                return (
                  <label
                    key={tag.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                      checked
                        ? "border-chart-1/40 bg-chart-1/10 text-foreground"
                        : "border-border/60 bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleTag(tag.id)}
                      aria-label={`Tag ${tag.name}`}
                    />
                    <span>{tag.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </Field>
      </section>

      {/* 4. Publication */}
      <section className="space-y-5 rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
        <SectionHeader
          title="Publication"
          description="Statut éditorial, visibilité et mise en avant."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field>
            <FieldLabelWithHint
              htmlFor="article-status"
              hint="Brouillon (invisible), Publié (visible), Archivé (masqué du blog mais conservé)."
            >
              Statut
            </FieldLabelWithHint>
            <NativeSelect
              id="article-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ArticleStatus)
              }
            >
              <NativeSelectOption value="draft">Brouillon</NativeSelectOption>
              <NativeSelectOption value="published">
                Publié
              </NativeSelectOption>
              <NativeSelectOption value="archived">
                Archivé
              </NativeSelectOption>
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabelWithHint
              htmlFor="article-visibility"
              hint="Public (visible partout), Non listé (accessible par URL), Privé (visible uniquement par vous et les admins)."
            >
              Visibilité
            </FieldLabelWithHint>
            <NativeSelect
              id="article-visibility"
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as Visibility)
              }
            >
              <NativeSelectOption value="public">Public</NativeSelectOption>
              <NativeSelectOption value="unlisted">
                Non listé
              </NativeSelectOption>
              <NativeSelectOption value="private">Privé</NativeSelectOption>
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabelWithHint
              htmlFor="article-featured"
              hint="Met l'article en avant sur la page d'accueil du blog. À réserver aux contenus phares."
              required={false}
            >
              À la une
            </FieldLabelWithHint>
            <label
              htmlFor="article-featured"
              className="flex h-8 items-center gap-2 rounded-lg border border-border/60 bg-background px-2.5 text-sm"
            >
              <Checkbox
                id="article-featured"
                checked={featured}
                onCheckedChange={(value) => setFeatured(value === true)}
              />
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="size-3.5" aria-hidden />
                Mis en avant
              </span>
            </label>
          </Field>
        </div>
      </section>

      {/* 5. Contenu */}
      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
        <SectionHeader
          title="Contenu"
          description="Structurez l'article en blocs hiérarchiques (sections, paragraphes, médias, code, embeds). Profondeur maximale : 6."
        />
        <BlockEditor
          initialBlocks={content}
          rootId={initial?.id ?? "draft-root"}
          mediaManifest={mediaManifest}
          onChange={setContent}
        />
      </section>

      <div className="sticky bottom-4 z-10 flex flex-wrap justify-end gap-2 rounded-xl border border-border/60 bg-card/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
        {mode === "edit" && initial && (
          <Link
            href={`/blog/${initial.slug}?preview=1`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonVariants({ variant: "outline" })} gap-2`}
          >
            <Eye className="size-4" aria-hidden />
            Aperçu
          </Link>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={isPending}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isPending || !title.trim() || !summary.trim()}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          {mode === "create" ? "Créer l'article" : "Enregistrer"}
        </Button>
      </div>

      <QuickCreateCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        themeId={themeId}
        mode="category"
        onCreated={(id) => {
          setCategoryId(id);
          setSubCategoryId("");
          router.refresh();
        }}
      />
      <QuickCreateCategoryDialog
        open={subCategoryDialogOpen}
        onOpenChange={setSubCategoryDialogOpen}
        themeId={themeId}
        categoryId={categoryId}
        mode="subcategory"
        onCreated={(id) => {
          setSubCategoryId(id);
          router.refresh();
        }}
      />
      <QuickCreateTagDialog
        open={tagDialogOpen}
        onOpenChange={setTagDialogOpen}
        onCreated={(id) => {
          setSelectedTagIds((prev) => new Set(prev).add(id));
          router.refresh();
        }}
      />
    </form>
  );
}