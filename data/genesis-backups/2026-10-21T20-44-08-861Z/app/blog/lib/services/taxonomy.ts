/*
path :           app/blog/lib/services/taxonomy.ts
tag :            ["blog", "service", "taxonomy", "theme", "category", "subcategory", "tag", "crud"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service CRUD de la taxonomie Blog. Thèmes (imbriqués
                 avec categories[].subCategories[]), catégories,
                 sous-catégories et tags (à plat). Génère les slugs via
                 slugifyWithFallback + findFreeSlug, dédoublonne les tags
                 case-insensitive, protège les suppressions
                 destructrices (un thème avec catégories ne peut pas
                 être supprimé, une catégorie avec sous-catégories non
                 plus). Toute écriture passe par mutateBlog.

flow:            listThemes() → readBlog().taxonomy.themes.
                 createTheme(input) → slug unique → push → retourne le
                 thème créé.
                 updateTheme(id, input) → map + updatedAt.
                 deleteTheme(id) → refuse si categories non vide.
                 createCategory(themeId, input) → find theme → slug
                 unique dans le thème → push dans theme.categories[].
                 deleteCategory(themeId, categoryId) → refuse si
                 subCategories non vide.
                 createSubCategory(themeId, categoryId, input) → slug
                 unique dans la catégorie → push.
                 createTag(input) → slug unique global + dédoublonnage
                 case-insensitive.
                 deleteTag(id) → retire aussi l'id des article.tagIds.

ecosystem:       BlogServices = [
                   "@/app/blog/lib/services/article.ts",
                   "@/app/blog/lib/services/comment.ts",
                   "@/app/blog/lib/services/discussion.ts",
                   "@/app/blog/lib/services/favorite.ts",
                   "@/app/blog/lib/services/group.ts",
                   "@/app/blog/lib/services/like.ts",
                   "@/app/blog/lib/services/notification.ts",
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
                  "ThemeInput", "CategoryInput", "SubCategoryInput",
                  "TagInput"]
useBy:           ["@/app/blog/lib/actions/taxonomy.ts"]

userStories:     ["us1100001", "us1100002", "us1100003", "us1100004"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { mutateBlog, readBlog } from "@/app/blog/lib/storage";
import type {
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
  const doc = await readBlog();
  return doc.taxonomy.themes;
}

export async function createTheme(input: ThemeInput): Promise<Theme> {
  const id = newId();
  const createdAt = nowIso();
  const base = makeSlug(input.name, "theme");
  let entity!: Theme;

  await mutateBlog((doc) => {
    const existing = new Set(doc.taxonomy.themes.map((t) => t.slug));
    return (async () => {
      const slug = await findFreeSlug(base, async (c) => existing.has(c));
      entity = {
        id,
        slug,
        name: input.name,
        description: input.description,
        color: input.color,
        icon: input.icon,
        order: doc.taxonomy.themes.length,
        createdAt,
        updatedAt: createdAt,
        categories: [],
      };
      return {
        ...doc,
        taxonomy: {
          ...doc.taxonomy,
          themes: [...doc.taxonomy.themes, entity],
        },
      };
    })();
  });

  return entity;
}

export async function updateTheme(
  themeId: string,
  input: ThemeInput,
): Promise<Theme> {
  let updated!: Theme;
  await mutateBlog((doc) => {
    const themes = doc.taxonomy.themes.map((theme) => {
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
    });
    return { ...doc, taxonomy: { ...doc.taxonomy, themes } };
  });
  return updated;
}

export async function deleteTheme(themeId: string): Promise<void> {
  await mutateBlog((doc) => {
    const theme = doc.taxonomy.themes.find((t) => t.id === themeId);
    if (!theme) throw new Error(`Thème introuvable : ${themeId}`);
    if (theme.categories.length > 0) {
      throw new Error(
        "Impossible de supprimer un thème qui contient des catégories.",
      );
    }
    return {
      ...doc,
      taxonomy: {
        ...doc.taxonomy,
        themes: doc.taxonomy.themes.filter((t) => t.id !== themeId),
      },
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Catégories                                                        */
/* ------------------------------------------------------------------ */

export async function listCategories(
  themeId: string,
): Promise<readonly Category[]> {
  const doc = await readBlog();
  const theme = doc.taxonomy.themes.find((t) => t.id === themeId);
  return theme?.categories ?? [];
}

export async function createCategory(
  themeId: string,
  input: CategoryInput,
): Promise<Category> {
  const id = newId();
  const createdAt = nowIso();
  const base = makeSlug(input.name, "categorie");
  let entity!: Category;

  await mutateBlog((doc) => {
    const theme = doc.taxonomy.themes.find((t) => t.id === themeId);
    if (!theme) throw new Error(`Thème introuvable : ${themeId}`);
    const existing = new Set(theme.categories.map((c) => c.slug));
    return (async () => {
      const slug = await findFreeSlug(base, async (c) => existing.has(c));
      entity = {
        id,
        slug,
        name: input.name,
        description: input.description,
        order: theme.categories.length,
        createdAt,
        updatedAt: createdAt,
        subCategories: [],
      };
      const themes = doc.taxonomy.themes.map((t) =>
        t.id === themeId
          ? { ...t, categories: [...t.categories, entity], updatedAt: createdAt }
          : t,
      );
      return { ...doc, taxonomy: { ...doc.taxonomy, themes } };
    })();
  });

  return entity;
}

export async function updateCategory(
  themeId: string,
  categoryId: string,
  input: CategoryInput,
): Promise<Category> {
  let updated!: Category;
  await mutateBlog((doc) => {
    const themes = doc.taxonomy.themes.map((theme) => {
      if (theme.id !== themeId) return theme;
      const categories = theme.categories.map((cat) => {
        if (cat.id !== categoryId) return cat;
        updated = {
          ...cat,
          name: input.name,
          description: input.description,
          updatedAt: nowIso(),
        };
        return updated;
      });
      return { ...theme, categories };
    });
    return { ...doc, taxonomy: { ...doc.taxonomy, themes } };
  });
  return updated;
}

export async function deleteCategory(
  themeId: string,
  categoryId: string,
): Promise<void> {
  await mutateBlog((doc) => {
    const theme = doc.taxonomy.themes.find((t) => t.id === themeId);
    if (!theme) throw new Error(`Thème introuvable : ${themeId}`);
    const cat = theme.categories.find((c) => c.id === categoryId);
    if (!cat) throw new Error(`Catégorie introuvable : ${categoryId}`);
    if (cat.subCategories.length > 0) {
      throw new Error(
        "Impossible de supprimer une catégorie qui contient des sous-catégories.",
      );
    }
    const themes = doc.taxonomy.themes.map((t) =>
      t.id === themeId
        ? { ...t, categories: t.categories.filter((c) => c.id !== categoryId) }
        : t,
    );
    return { ...doc, taxonomy: { ...doc.taxonomy, themes } };
  });
}

/* ------------------------------------------------------------------ */
/*  Sous-catégories                                                   */
/* ------------------------------------------------------------------ */

export async function listSubCategories(
  themeId: string,
  categoryId: string,
): Promise<readonly SubCategory[]> {
  const doc = await readBlog();
  const theme = doc.taxonomy.themes.find((t) => t.id === themeId);
  const cat = theme?.categories.find((c) => c.id === categoryId);
  return cat?.subCategories ?? [];
}

export async function createSubCategory(
  themeId: string,
  categoryId: string,
  input: SubCategoryInput,
): Promise<SubCategory> {
  const id = newId();
  const createdAt = nowIso();
  const base = makeSlug(input.name, "sous-categorie");
  let entity!: SubCategory;

  await mutateBlog((doc) => {
    const theme = doc.taxonomy.themes.find((t) => t.id === themeId);
    if (!theme) throw new Error(`Thème introuvable : ${themeId}`);
    const cat = theme.categories.find((c) => c.id === categoryId);
    if (!cat) throw new Error(`Catégorie introuvable : ${categoryId}`);
    const existing = new Set(cat.subCategories.map((s) => s.slug));
    return (async () => {
      const slug = await findFreeSlug(base, async (c) => existing.has(c));
      entity = {
        id,
        slug,
        name: input.name,
        description: input.description,
        order: cat.subCategories.length,
        createdAt,
        updatedAt: createdAt,
      };
      const themes = doc.taxonomy.themes.map((t) =>
        t.id !== themeId
          ? t
          : {
              ...t,
              categories: t.categories.map((c) =>
                c.id !== categoryId
                  ? c
                  : { ...c, subCategories: [...c.subCategories, entity] },
              ),
            },
      );
      return { ...doc, taxonomy: { ...doc.taxonomy, themes } };
    })();
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
  await mutateBlog((doc) => {
    const themes = doc.taxonomy.themes.map((theme) => {
      if (theme.id !== themeId) return theme;
      const categories = theme.categories.map((cat) => {
        if (cat.id !== categoryId) return cat;
        const subCategories = cat.subCategories.map((sub) => {
          if (sub.id !== subId) return sub;
          updated = {
            ...sub,
            name: input.name,
            description: input.description,
            updatedAt: nowIso(),
          };
          return updated;
        });
        return { ...cat, subCategories };
      });
      return { ...theme, categories };
    });
    return { ...doc, taxonomy: { ...doc.taxonomy, themes } };
  });
  return updated;
}

export async function deleteSubCategory(
  themeId: string,
  categoryId: string,
  subId: string,
): Promise<void> {
  await mutateBlog((doc) => {
    const themes = doc.taxonomy.themes.map((theme) =>
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
    );
    return { ...doc, taxonomy: { ...doc.taxonomy, themes } };
  });
}

/* ------------------------------------------------------------------ */
/*  Tags                                                              */
/* ------------------------------------------------------------------ */

export async function listTags(): Promise<readonly Tag[]> {
  const doc = await readBlog();
  return doc.taxonomy.tags;
}

export async function createTag(input: TagInput): Promise<Tag> {
  const name = input.name.trim();
  const id = newId();
  const createdAt = nowIso();
  const base = makeSlug(name, "tag");
  let entity!: Tag;

  await mutateBlog((doc) => {
    const lower = name.toLowerCase();
    const existing = doc.taxonomy.tags.find(
      (t) => t.name.toLowerCase() === lower,
    );
    if (existing) throw new Error(`Un tag "${name}" existe déjà.`);
    const slugs = new Set(doc.taxonomy.tags.map((t) => t.slug));
    return (async () => {
      const slug = await findFreeSlug(base, async (c) => slugs.has(c));
      entity = {
        id,
        slug,
        name,
        color: input.color,
        createdAt,
        updatedAt: createdAt,
      };
      return {
        ...doc,
        taxonomy: {
          ...doc.taxonomy,
          tags: [...doc.taxonomy.tags, entity],
        },
      };
    })();
  });

  return entity;
}

export async function updateTag(
  tagId: string,
  input: TagInput,
): Promise<Tag> {
  let updated!: Tag;
  await mutateBlog((doc) => {
    const tags = doc.taxonomy.tags.map((tag) => {
      if (tag.id !== tagId) return tag;
      updated = {
        ...tag,
        name: input.name.trim(),
        color: input.color,
        updatedAt: nowIso(),
      };
      return updated;
    });
    return { ...doc, taxonomy: { ...doc.taxonomy, tags } };
  });
  return updated;
}

export async function deleteTag(tagId: string): Promise<void> {
  await mutateBlog((doc) => ({
    ...doc,
    taxonomy: {
      ...doc.taxonomy,
      tags: doc.taxonomy.tags.filter((t) => t.id !== tagId),
    },
    articles: doc.articles.map((a) =>
      a.tagIds.includes(tagId)
        ? { ...a, tagIds: a.tagIds.filter((id) => id !== tagId) }
        : a,
    ),
  }));
}