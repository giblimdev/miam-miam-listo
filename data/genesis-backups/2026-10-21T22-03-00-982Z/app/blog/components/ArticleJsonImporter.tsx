/*
path :           app/blog/components/ArticleJsonImporter.tsx
tag :            ["blog", "component", "article", "import", "json", "ai", "client", "dialog", "taxonomy"]
projectId :      new-genesis
type :           component
generic :        false

role :           Bouton + dialog d'import d'article depuis un JSON
                 AI-friendly. Trois affordances :

                 1. « Copier le prompt IA » : génère et copie un prompt
                    structuré contenant :
                    - le format JSON attendu,
                    - un TABLEAU par entité (thème, catégorie, sous-catégorie,
                      tag) avec id + slug + name → l'IA peut utiliser
                      indifféremment l'ID (précis, copiable) ou le nom
                      (robuste aux typos).
                 2. « Charger un exemple » : remplit le textarea avec un
                    article minimal pré-rempli avec l'ID réel du premier
                    thème et les IDs des deux premiers tags.
                 3. « Créer l'article » : appelle importArticleFromJsonAction,
                    redirige vers /blog/articles/[id]/edit en cas de succès.

                 Le textarea est éditable. Les erreurs sont affichées inline
                 (issues Zod, résolutions taxonomie, tags inconnus). Le
                 composant NE valide PAS côté client — tout est délégué au
                 serveur (principe « trust the server »).

flow :           Props { themes, tags } → useState(open, json, error,
                 copied, isPending) → buildPrompt(themes, tags) construit
                 le prompt (tableaux ID + slug + name) → handleCopyPrompt
                 → clipboard + toast → handleImport →
                 importArticleFromJsonAction → succès : toast + push →
                 erreur : setError + toast.

ecosystem :      BlogUI = [
                   "@/app/blog/components/ArticleBody.tsx",
                   "@/app/blog/components/ArticleCard.tsx",
                   "@/app/blog/components/ArticleForm.tsx",
                   "@/app/blog/components/ArticleHeader.tsx",
                   "@/app/blog/components/ArticleJsonImporter.tsx",
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
                   "@/app/blog/components/PlaylistBadge.tsx",
                   "@/app/blog/components/PlaylistCard.tsx",
                   "@/app/blog/components/PlaylistForm.tsx",
                   "@/app/blog/components/PlaylistManager.tsx",
                   "@/app/blog/components/QuickCreateCategoryDialog.tsx",
                   "@/app/blog/components/QuickCreateTagDialog.tsx",
                   "@/app/blog/components/SearchFilters.tsx",
                   "@/app/blog/components/TableOfContents.tsx",
                   "@/app/blog/components/TagForm.tsx",
                   "@/app/blog/components/TagSection.tsx",
                   "@/app/blog/components/TaxonomyForm.tsx",
                   "@/app/blog/components/TaxonomyNav.tsx",
                   "@/app/blog/components/block-editor/BlockEditor.tsx",
                   "@/app/blog/components/block-editor/BlockList.tsx",
                   "@/app/blog/components/block-editor/BlockToolbar.tsx",
                   "@/app/blog/components/block-editor/BlockTypeMenu.tsx",
                 ]

relatedFiles :   ["@/app/blog/lib/actions/article-import.ts",
                  "@/app/blog/lib/validations/article-import.ts",
                  "@/app/blog/lib/types.ts"]

imports :        ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/blog/lib/actions/article-import",
                  "@/app/blog/lib/types",
                  "@/components/ui/button",
                  "@/components/ui/dialog",
                  "@/components/ui/textarea"]

exports :        ["ArticleJsonImporter", "ArticleJsonImporterProps"]

useBy :          ["@/app/blog/articles/new/page.tsx"]

userStories :    ["*en tant qu'auteur je veux importer un article depuis un JSON généré par une IA"]

status :         planned
pathChecked :    ✔true
metaDataChecked: ✔true
scriptChecked :  ✔true
*/

"use client";
// "use client" justifié : useState, useTransition, clipboard, Dialog, router.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, FileJson, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

import { importArticleFromJsonAction } from "@/app/blog/lib/actions/article-import";
import type { Tag, Theme } from "@/app/blog/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

export interface ArticleJsonImporterProps {
  readonly themes: readonly Theme[];
  readonly tags: readonly Tag[];
}

/* ------------------------------------------------------------------ */
/*  Prompt IA — avec IDs + slug + name pour chaque entité             */
/* ------------------------------------------------------------------ */

function buildPrompt(themes: readonly Theme[], tags: readonly Tag[]): string {
  const themeLines = themes.length
    ? themes
        .map((t) => {
          const head = `- "${t.name}"  (id: ${t.id}, slug: ${t.slug})`;
          if (t.categories.length === 0) return head;
          const cats = t.categories
            .map((c) => {
              const catHead = `    • "${c.name}"  (id: ${c.id}, slug: ${c.slug})`;
              if (c.subCategories.length === 0) return catHead;
              const subs = c.subCategories
                .map(
                  (s) =>
                    `        ◦ "${s.name}"  (id: ${s.id}, slug: ${s.slug})`,
                )
                .join("\n");
              return `${catHead}\n${subs}`;
            })
            .join("\n");
          return `${head}\n${cats}`;
        })
        .join("\n")
    : "  (aucun thème disponible — impossible d'importer)";

  const tagLines = tags.length
    ? tags
        .map((t) => `- "${t.name}"  (id: ${t.id}, slug: ${t.slug})`)
        .join("\n")
    : "  (aucun tag existant — les nouveaux seront créés si vous êtes admin)";

  return `Tu vas générer un article de blog au format JSON STRICT.

═══ TAXONOMIE DU PROJET ═══

Thèmes disponibles (choisir UN seul, obligatoire) :
${themeLines}

Tags existants :
${tagLines}

═══ RÈGLES STRICTES ═══

1. Choix du thème : utilise EN PRIORITÉ \`themeId\` (le CUID est précis et
   copiable). Si tu n'es pas sûr de l'ID, utilise \`themeName\` (le nom exact).
   Ne fournis pas les deux avec des valeurs différentes.
2. Catégorie (optionnelle) : \`categoryId\` (préféré) ou \`categoryName\`.
   Doit appartenir au thème choisi.
3. Sous-catégorie (optionnelle) : \`subCategoryId\` (préféré) ou
   \`subCategoryName\`. Doit appartenir à la catégorie choisie.
4. Tags : \`tagIds\` (liste de CUIDs existants) ET/OU \`tagNames\` (liste de
   noms ; les inconnus seront créés si l'utilisateur est admin). Tu peux
   mélanger les deux.
5. \`content\` : tableau de blocs À PLAT (pas d'imbrication). Pour
   structurer, utilise des blocs \`section\` successifs.
6. Respecte STRICTEMENT le schéma. Aucun champ en plus.
7. Renvoie UNIQUEMENT le JSON, sans texte avant ni après.

═══ FORMAT ATTENDU ═══

{
  "title": "Titre de l'article (3-200 caractères)",
  "summary": "Résumé de 20-500 caractères.",
  "coverImage": "",
  "themeId": "CUID du thème choisi (préféré)",
  "themeName": "(optionnel — fallback si themeId absent)",
  "categoryId": "CUID de la catégorie (optionnel)",
  "subCategoryId": "CUID de la sous-catégorie (optionnel)",
  "tagIds": ["CUID tag 1", "CUID tag 2"],
  "tagNames": ["Nom tag 3"],
  "status": "draft",
  "visibility": "public",
  "featured": false,
  "content": [
    { "type": "section", "title": "Introduction" },
    { "type": "paragraph", "text": "Premier paragraphe." },
    { "type": "section", "title": "Développement" },
    { "type": "paragraph", "text": "Second paragraphe." }
  ]
}

═══ TYPES DE BLOCS AUTORISÉS ═══

- { "type": "section", "title": "Titre" }
- { "type": "paragraph", "text": "Texte" }
- { "type": "image", "path": "fichier.jpg", "alt": "Description", "caption": "...", "credit": "..." }
- { "type": "video", "path": "video.mp4", "caption": "...", "poster": "poster.jpg" }
- { "type": "audio", "path": "audio.mp3", "caption": "..." }
- { "type": "code", "language": "ts", "code": "const x = 1;", "caption": "..." }
- { "type": "embed", "url": "https://...", "provider": "youtube | vimeo | codesandbox | twitter | other", "caption": "..." }
- { "type": "document", "path": "doc.pdf", "title": "Titre", "mimeType": "application/pdf", "sizeBytes": 1024 }

Génère maintenant l'article demandé.`;
}

/* ------------------------------------------------------------------ */
/*  Exemple concret — utilise les IDs réels                          */
/* ------------------------------------------------------------------ */

function buildExample(themes: readonly Theme[], tags: readonly Tag[]): string {
  const theme = themes[0];
  const category = theme?.categories[0];
  const subCategory = category?.subCategories[0];
  const tag1 = tags[0];
  const tag2 = tags[1];

  if (!theme) {
    return JSON.stringify(
      {
        title: "Impossible : aucun thème disponible",
        summary:
          "Créez d'abord un thème depuis /blog/taxonomy pour activer l'import.",
        themeId: "—",
        tagIds: [],
        content: [],
      },
      null,
      2,
    );
  }

  const tagIds = [tag1?.id, tag2?.id].filter(
    (id): id is string => typeof id === "string",
  );

  return JSON.stringify(
    {
      title: "Article de démonstration",
      summary:
        "Un article court créé via l'import JSON, pour tester le workflow.",
      coverImage: "",
      themeId: theme.id,
      categoryId: category?.id,
      subCategoryId: subCategory?.id,
      tagIds,
      tagNames: [],
      status: "draft",
      visibility: "public",
      featured: false,
      content: [
        { type: "section", title: "Introduction" },
        {
          type: "paragraph",
          text: "Cet article a été créé via l'import JSON. Vous pouvez maintenant l'éditer manuellement.",
        },
        { type: "section", title: "Conclusion" },
        { type: "paragraph", text: "Fin de la démonstration." },
      ],
    },
    null,
    2,
  );
}

/* ------------------------------------------------------------------ */
/*  Composant                                                         */
/* ------------------------------------------------------------------ */

export function ArticleJsonImporter({
  themes,
  tags,
}: ArticleJsonImporterProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(buildPrompt(themes, tags));
      setCopied(true);
      toast.success("Prompt copié. Collez-le dans votre IA préférée.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le prompt.");
    }
  }

  function handleLoadExample() {
    setJson(buildExample(themes, tags));
    setError(null);
  }

  function handleImport() {
    setError(null);
    startTransition(async () => {
      const result = await importArticleFromJsonAction(json);
      if (!result.ok) {
        setError(result.error);
        toast.error("Import échoué.");
        return;
      }
      const tagsInfo =
        result.data.createdTags.length > 0
          ? ` Tags créés : ${result.data.createdTags.join(", ")}.`
          : "";
      const viaInfo =
        result.data.resolved.theme === "id" ? "" : " (thème résolu par nom)";
      toast.success(`Article créé.${tagsInfo}${viaInfo}`);
      setOpen(false);
      setJson("");
      router.push(`/blog/articles/${result.data.id}/edit`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2">
            <FileJson className="size-4" aria-hidden />
            Importer un JSON
          </Button>
        }
      />

      <DialogContent className="flex h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="size-4 text-chart-2" aria-hidden />
            Importer un article depuis un JSON
          </DialogTitle>
          <DialogDescription>
            Copiez le prompt ci-dessous dans votre IA. Le prompt contient les
            thèmes / catégories / tags réels du projet, avec leurs IDs. Collez
            le JSON retourné dans le champ, puis validez. Les tags inconnus
            seront créés automatiquement si vous êtes admin.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <div className="flex shrink-0 items-center justify-between gap-2 rounded-lg border border-chart-2/30 bg-chart-2/5 p-2">
            <p className="flex items-center gap-1.5 text-xs text-foreground/80">
              <Sparkles className="size-3.5 text-chart-2" aria-hidden />
              Étape 1 — copiez le prompt pour votre IA
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPrompt}
              className="shrink-0 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-chart-4" aria-hidden />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden />
                  Copier le prompt
                </>
              )}
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex shrink-0 items-center justify-between gap-2">
              <label
                htmlFor="import-json"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Étape 2 — collez le JSON retourné
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLoadExample}
                disabled={isPending}
                className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Upload className="size-3.5" aria-hidden />
                Charger un exemple
              </Button>
            </div>
            <Textarea
              id="import-json"
              value={json}
              onChange={(e) => setJson(e.target.value)}
              placeholder='{ "title": "…", "summary": "…", "themeId": "…", "content": [ … ] }'
              spellCheck={false}
              disabled={isPending}
              aria-invalid={error ? true : undefined}
              className="min-h-0 flex-1 resize-none overflow-y-auto font-mono text-xs"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="shrink-0 whitespace-pre-wrap rounded-lg border border-destructive/40 bg-destructive/5 p-2.5 text-xs text-destructive"
            >
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={isPending || json.trim().length === 0}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Création…
              </>
            ) : (
              <>
                <FileJson className="size-4" aria-hidden />
                Créer l&apos;article
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
