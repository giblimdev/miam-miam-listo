/*
path :           app/blog/lib/services/taxonomy.ts
tag :            ["blog", "service", "taxonomy", "theme", "category", "subcategory", "tag", "crud", "split-files", "validate"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD de la taxonomie Blog. Depuis le split
                 taxonomie, TOUTES les lectures/écritures passent par
                 data/blog/taxonomy.json via readTaxonomyFile /
                 mutateTaxonomyFile — plus aucune dépendance à
                 readBlog()/mutateBlog() (donc plus de blocage du mutex
                 _index.json lors d'un ajout de tag).

                 - Thèmes : imbriqués (categories[].subCategories[]),
                   slug unique par scope.
                 - Tags : à plat, slug unique global, unicité de name
                   case-insensitive.
                 - deleteTag retire l'id des article.tagIds[] sur TOUS
                   les articles (via listArticleFiles + mutateArticleFile
                   par article — pas une réécriture globale).
                 - deleteTheme / deleteCategory : refus si l'entité a
                   des enfants (protection existante conservée).

                 + validateArticleTaxonomy() : vérifie que themeId,
                   categoryId (∈ theme), subCategoryId (∈ catégorie du
                   theme), tagIds[] existent dans taxonomy.json.
                   Appelée par createArticle (services/article.ts) pour
                   éviter les articles à références orphelines.

flow:            listThemes → readTaxonomyFile().themes.
                 createTheme / updateTheme / deleteTheme →
                 mutateTaxonomyFile.
                 createCategory(themeId) → mutateTaxonomyFile (thème
                 introuvable → throw).
                 createSubCategory(themeId, categoryId) → idem.
                 createTag / updateTag / deleteTag → mutateTaxonomyFile
                 (deleteTag : cascade sur article.tagIds[] à part, par
                 article).
                 validateArticleTaxonomy(input) → readTaxonomyFile →
                 vérifie themeId, categoryId, subCategoryId, tagIds.

ecosystem:       BlogServices = [
                   "@/app/blog/lib/services/article.ts",
                   "@/app/blog/lib/services/author.ts",
                   "@/app/blog/lib/services/comment.ts",
                   "@/app/blog/lib/services/favorite.ts",
                   "@/app/blog/lib/services/group.ts",
                   "@/app/blog/lib/services/like.ts",
                   "@/app/blog/lib/services/notification.ts",
                   "@/app/blog/lib/services/playlist.ts",
                   "@/app/blog/lib/services/search.ts",
                   "@/app/blog/lib/services/taxonomy.ts",
                 ]

relatedFiles:    ["@/app/blog/lib/storage.ts",
                  "@/app/blog/lib/types.ts",
                  "@/app/blog/lib/validations.ts",
                  "@/utils/slugify.ts",
                  "@/utils/slug.ts"]

imports:         ["@/app/blog/lib/storage",
                  "@/app/blog/lib/types",
                  "@/utils/slugify",
                  "@/utils/slug"]

exports:         ["listThemes", "createTheme", "updateTheme",
                  "deleteTheme", "createCategory", "updateCategory",
                  "deleteCategory", "createSubCategory",
                  "updateSubCategory", "deleteSubCategory",
                  "listTags", "createTag", "updateTag", "deleteTag",
                  "validateArticleTaxonomy",
                  "ThemeInput", "CategoryInput", "SubCategoryInput",
                  "TagInput"]

useBy:           ["@/app/blog/lib/actions/taxonomy.ts",
                  "@/app/blog/lib/services/article.ts"]

userStories:     ["us1100001", "us1100002", "us1100003", "us1100004",
                  "*en tant qu'admin je veux la taxonomie dans son propre fichier"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import {
  listArticleFiles,
  mutateArticleFile,
  mutateTaxonomyFile,
  readTaxonomyFile,
} from "@/app/blog/lib/storage";
import type {
  Article,
  Category,
  SubCategory,
  Tag,
  Theme,
} from "@/app/blog/lib/types";
import { findFreeSlug } from "@/utils/slug";
import { slugifyWithFallback } from "@/utils/slugify";

/* ------------------------------------------------------------------ */
/*  Inputs                                                            */
/* ------------------------------------------------------------------ */

export interface ThemeInput {
  readonly name: string;
  readonly description?: string;
  readonly color: string;
  readonly icon: string;
}

export interface CategoryInput {
  readonly name: string;
  readonly description?: string;
}

export interface SubCategoryInput {
  readonly name: string;
  readonly description?: string;
}

export interface TagInput {
  readonly name: string;
  readonly color?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function makeSlug(name: string, fallback: string): string {
  return slugifyWithFallback(name, fallback);
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

/* ------------------------------------------------------------------ */
/*  Thèmes                                                            */
/* ------------------------------------------------------------------ */

export async function listThemes(): Promise<readonly Theme[]> {
  const { themes } = await readTaxonomyFile();
  return themes;
}

export async function createTheme(input: ThemeInput): Promise<Theme> {
  const id = newId();
  const createdAt = nowIso();
  const base = makeSlug(input.name, "theme");

  const slugs = new Set(
    (await readTaxonomyFile()).themes.map((t) => t.slug),
  );
  const slug = await findFreeSlug(base, async (c) => slugs.has(c));

  const entity: Theme = {
    id,
    slug,
    name: input.name,
    description: input.description,
    color: input.color,
    icon: input.icon,
    order: (await readTaxonomyFile()).themes.length,
    createdAt,
    updatedAt: createdAt,
    categories: [],
  };

  await mutateTaxonomyFile((current) => ({
    ...current,
    themes: [...current.themes, entity],
  }));

  return entity;
}

export async function updateTheme(
  themeId: string,
  input: ThemeInput,
): Promise<Theme> {
  let updated!: Theme;
  await mutateTaxonomyFile((current) => ({
    ...current,
    themes: current.themes.map((theme) => {
      if (theme.id !== themeId) return theme;
      updated = {
        ...theme,
        name: input.name,
        description: input.description,
        color: input.color,
        icon: input.icon,
        updatedAt: nowIso(),
      };
      return updated;
    }),
  }));
  return updated;
}

export async function deleteTheme(themeId: string): Promise<void> {
  const { themes } = await readTaxonomyFile();
  const theme = themes.find((t) => t.id === themeId);
  if (!theme) throw new Error(`Thème introuvable : ${themeId}`);
  if (theme.categories.length > 0) {
    throw new Error(
      "Impossible de supprimer un thème qui contient des catégories.",
    );
  }

  await mutateTaxonomyFile((current) => ({
    ...current,
    themes: current.themes.filter((t) => t.id !== themeId),
  }));
}

/* ------------------------------------------------------------------ */
/*  Catégories                                                        */
/* ------------------------------------------------------------------ */

export async function createCategory(
  themeId: string,
  input: CategoryInput,
): Promise<Category> {
  const id = newId();
  const createdAt = nowIso();
  const base = makeSlug(input.name, "categorie");
  const entity: Category = {
    id,
    slug: base, // sera réécrit après findFreeSlug
    name: input.name,
    description: input.description,
    order: 0,
    createdAt,
    updatedAt: createdAt,
    subCategories: [],
  };

  await mutateTaxonomyFile(async (current) => {
    const theme = current.themes.find((t) => t.id === themeId);
    if (!theme) throw new Error(`Thème introuvable : ${themeId}`);

    const slugs = new Set(theme.categories.map((c) => c.slug));
    const slug = await findFreeSlug(base, async (c) => slugs.has(c));

    const created: Category = {
      ...entity,
      slug,
      order: theme.categories.length,
    };

    return {
      ...current,
      themes: current.themes.map((t) =>
        t.id === themeId
          ? { ...t, categories: [...t.categories, created], updatedAt: createdAt }
          : t,
      ),
    };
  });

  return entity;
}

export async function updateCategory(
  themeId: string,
  categoryId: string,
  input: CategoryInput,
): Promise<Category> {
  let updated!: Category;
  await mutateTaxonomyFile((current) => ({
    ...current,
    themes: current.themes.map((theme) => {
      if (theme.id !== themeId) return theme;
      return {
        ...theme,
        categories: theme.categories.map((cat) => {
          if (cat.id !== categoryId) return cat;
          updated = {
            ...cat,
            name: input.name,
            description: input.description,
            updatedAt: nowIso(),
          };
          return updated;
        }),
      };
    }),
  }));
  return updated;
}

export async function deleteCategory(
  themeId: string,
  categoryId: string,
): Promise<void> {
  const { themes } = await readTaxonomyFile();
  const theme = themes.find((t) => t.id === themeId);
  if (!theme) throw new Error(`Thème introuvable : ${themeId}`);
  const cat = theme.categories.find((c) => c.id === categoryId);
  if (!cat) throw new Error(`Catégorie introuvable : ${categoryId}`);
  if (cat.subCategories.length > 0) {
    throw new Error(
      "Impossible de supprimer une catégorie qui contient des sous-catégories.",
    );
  }

  await mutateTaxonomyFile((current) => ({
    ...current,
    themes: current.themes.map((t) =>
      t.id === themeId
        ? { ...t, categories: t.categories.filter((c) => c.id !== categoryId) }
        : t,
    ),
  }));
}

/* ------------------------------------------------------------------ */
/*  Sous-catégories                                                   */
/* ------------------------------------------------------------------ */

export async function createSubCategory(
  themeId: string,
  categoryId: string,
  input: SubCategoryInput,
): Promise<SubCategory> {
  const id = newId();
  const createdAt = nowIso();
  const base = makeSlug(input.name, "sous-categorie");
  const entity: SubCategory = {
    id,
    slug: base,
    name: input.name,
    description: input.description,
    order: 0,
    createdAt,
    updatedAt: createdAt,
  };

  await mutateTaxonomyFile(async (current) => {
    const theme = current.themes.find((t) => t.id === themeId);
    if (!theme) throw new Error(`Thème introuvable : ${themeId}`);
    const cat = theme.categories.find((c) => c.id === categoryId);
    if (!cat) throw new Error(`Catégorie introuvable : ${categoryId}`);

    const slugs = new Set(cat.subCategories.map((s) => s.slug));
    const slug = await findFreeSlug(base, async (c) => slugs.has(c));

    const created: SubCategory = {
      ...entity,
      slug,
      order: cat.subCategories.length,
    };

    return {
      ...current,
      themes: current.themes.map((t) =>
        t.id !== themeId
          ? t
          : {
              ...t,
              categories: t.categories.map((c) =>
                c.id !== categoryId
                  ? c
                  : { ...c, subCategories: [...c.subCategories, created] },
              ),
            },
      ),
    };
  });

  return entity;
}

export async function updateSubCategory(
  themeId: string,
  categoryId: string,
  subId: string,
  input: SubCategoryInput,
): Promise<SubCategory> {
  let updated!: SubCategory;
  await mutateTaxonomyFile((current) => ({
    ...current,
    themes: current.themes.map((theme) => {
      if (theme.id !== themeId) return theme;
      return {
        ...theme,
        categories: theme.categories.map((cat) => {
          if (cat.id !== categoryId) return cat;
          return {
            ...cat,
            subCategories: cat.subCategories.map((sub) => {
              if (sub.id !== subId) return sub;
              updated = {
                ...sub,
                name: input.name,
                description: input.description,
                updatedAt: nowIso(),
              };
              return updated;
            }),
          };
        }),
      };
    }),
  }));
  return updated;
}

export async function deleteSubCategory(
  themeId: string,
  categoryId: string,
  subId: string,
): Promise<void> {
  await mutateTaxonomyFile((current) => ({
    ...current,
    themes: current.themes.map((theme) =>
      theme.id !== themeId
        ? theme
        : {
            ...theme,
            categories: theme.categories.map((cat) =>
              cat.id !== categoryId
                ? cat
                : {
                    ...cat,
                    subCategories: cat.subCategories.filter(
                      (s) => s.id !== subId,
                    ),
                  },
            ),
          },
    ),
  }));
}

/* ------------------------------------------------------------------ */
/*  Tags                                                              */
/* ------------------------------------------------------------------ */

export async function listTags(): Promise<readonly Tag[]> {
  const { tags } = await readTaxonomyFile();
  return tags;
}

export async function createTag(input: TagInput): Promise<Tag> {
  const name = input.name.trim();
  const id = newId();
  const createdAt = nowIso();
  const base = makeSlug(name, "tag");
  let created!: Tag;

  await mutateTaxonomyFile(async (current) => {
    const lower = name.toLowerCase();
    const exists = current.tags.find(
      (t) => t.name.toLowerCase() === lower,
    );
    if (exists) throw new Error(`Un tag "${name}" existe déjà.`);

    const slugs = new Set(current.tags.map((t) => t.slug));
    const slug = await findFreeSlug(base, async (c) => slugs.has(c));

    created = {
      id,
      slug,
      name,
      color: input.color,
      createdAt,
      updatedAt: createdAt,
    };

    return { ...current, tags: [...current.tags, created] };
  });

  return created;
}

export async function updateTag(
  tagId: string,
  input: TagInput,
): Promise<Tag> {
  let updated!: Tag;
  await mutateTaxonomyFile((current) => ({
    ...current,
    tags: current.tags.map((tag) => {
      if (tag.id !== tagId) return tag;
      updated = {
        ...tag,
        name: input.name.trim(),
        color: input.color,
        updatedAt: nowIso(),
      };
      return updated;
    }),
  }));
  return updated;
}

/**
 * Supprime un tag et retire l'id des article.tagIds[] sur TOUS les
 * articles (via listArticleFiles + mutateArticleFile par article — pas
 * de réécriture globale du document).
 */
export async function deleteTag(tagId: string): Promise<void> {
  await mutateTaxonomyFile((current) => ({
    ...current,
    tags: current.tags.filter((t) => t.id !== tagId),
  }));

  const all = await listArticleFiles();
  const affected = all.filter((a) => a.tagIds.includes(tagId));
  await Promise.all(
    affected.map((article) =>
      mutateArticleFile(article.slug, (current) => ({
        ...current,
        tagIds: current.tagIds.filter((id) => id !== tagId),
      })),
    ),
  );
}

/* ------------------------------------------------------------------ */
/*  Validation d'un article face à la taxonomie                       */
/* ------------------------------------------------------------------ */

/**
 * Vérifie que les références taxonomiques d'un article existent dans
 * data/blog/taxonomy.json. Appelée par createArticle (services/article.ts).
 * Lève une erreur explicite (remontée en ActionResult par l'action).
 */
export async function validateArticleTaxonomy(input: {
  readonly themeId: string;
  readonly categoryId?: string;
  readonly subCategoryId?: string;
  readonly tagIds: readonly string[];
}): Promise<void> {
  const { themes, tags } = await readTaxonomyFile();

  const theme = themes.find((t) => t.id === input.themeId);
  if (!theme) {
    throw new Error(`Thème introuvable : ${input.themeId}`);
  }

  if (input.categoryId) {
    const cat = theme.categories.find((c) => c.id === input.categoryId);
    if (!cat) {
      throw new Error(
        `Catégorie introuvable dans ce thème : ${input.categoryId}`,
      );
    }
    if (input.subCategoryId) {
      const sub = cat.subCategories.find((s) => s.id === input.subCategoryId);
      if (!sub) {
        throw new Error(
          `Sous-catégorie introuvable dans cette catégorie : ${input.subCategoryId}`,
        );
      }
    }
  }

  const validTagIds = new Set(tags.map((t) => t.id));
  for (const tagId of input.tagIds) {
    if (!validTagIds.has(tagId)) {
      throw new Error(`Tag introuvable : ${tagId}`);
    }
  }
}