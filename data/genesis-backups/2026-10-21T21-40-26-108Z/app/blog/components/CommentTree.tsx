/*
path :           app/blog/components/CommentTree.tsx
tag :            ["blog", "component", "comment", "tree", "client", "avatar"]
projectId:       new-genesis
type :           component
generic:         false

role:            Arbre récursif de commentaires. Reconstruit l'arbre
                 via buildTree, affiche chaque commentaire (avatar +
                 nom de l'auteur, contenu, date, bouton Répondre).
                 Les commentaires soft-deleted affichent « Commentaire
                 supprimé » mais conservent leurs réponses. Bouton
                 Répondre ouvre un CommentForm inline. Client Component.
                 Les noms + images viennent d'une `Map<userId,
                 AuthorProfile>` passée par le Server Component parent :
                 on ne stocke pas ces données dans Comment (JSON), on
                 les résout à l'affichage via resolveAuthorProfiles.
                 Fallback si profil introuvable (user supprimé, id
                 orphelin) : libellé « Utilisateur inconnu » + avatar
                 générique.

flow:            Props { articleId, comments, isAuthenticated,
                 currentUserId, authorProfiles } →
                 useMemo(buildTree(comments, articleId)) → rend récursif.
                 Pour chaque nœud : profile = authorProfiles.get(node.
                 authorId) → Avatar(profile.image | initiales) + nom.

ecosystem:       BlogUI = [
                   "@/app/blog/components/ArticleBody.tsx",
                   "@/app/blog/components/ArticleCard.tsx",
                   "@/app/blog/components/ArticleHeader.tsx",
                   "@/app/blog/components/CommentForm.tsx",
                   "@/app/blog/components/CommentTree.tsx",
                   "@/app/blog/components/ContentBlockRenderer.tsx",
                   "@/app/blog/components/DiscussionThread.tsx",
                   "@/app/blog/components/FavoriteButton.tsx",
                   "@/app/blog/components/GroupCard.tsx",
                   "@/app/blog/components/LikeButton.tsx",
                   "@/app/blog/components/NotificationBell.tsx",
                   "@/app/blog/components/NotificationList.tsx",
                   "@/app/blog/components/PostTree.tsx",
                   "@/app/blog/components/SearchFilters.tsx",
                   "@/app/blog/components/TableOfContents.tsx",
                   "@/app/blog/components/TaxonomyNav.tsx",
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

relatedFiles:    ["@/app/blog/lib/types.ts",
                  "@/app/blog/lib/tree.ts",
                  "@/app/blog/lib/services/author.ts",
                  "@/app/blog/components/CommentForm.tsx"]

imports:         ["react",
                  "@/app/blog/lib/types",
                  "@/app/blog/lib/tree",
                  "@/app/blog/lib/services/author",
                  "@/app/blog/components/CommentForm",
                  "@/components/ui/avatar",
                  "@/components/ui/button",
                  "@/utils/initials"]

exports:         ["CommentTree", "CommentTreeProps"]

useBy:           ["@/app/blog/[slug]/page.tsx"]

userStories:     ["us2100001", "us2100002",
                  "*en tant qu'utilisateur je veux voir le nom et l'avatar des commentateurs"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (replyTo), useMemo (buildTree).

import { useMemo, useState } from "react";

import type { Comment } from "@/app/blog/lib/types";
import { buildTree, type TreeNode } from "@/app/blog/lib/tree";
import type { AuthorProfile } from "@/app/blog/lib/services/author";
import { CommentForm } from "@/app/blog/components/CommentForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initialsOf } from "@/utils/initials";

export interface CommentTreeProps {
  readonly articleId: string;
  readonly comments: readonly Comment[];
  readonly isAuthenticated: boolean;
  readonly currentUserId: string | null;
  /**
   * Map userId → profil (nom + image). Résolue côté serveur par
   * resolveAuthorProfiles(). Les entrées manquantes (auteur supprimé)
   * retombent sur un libellé générique + initiales « ? ».
   */
  readonly authorProfiles: ReadonlyMap<string, AuthorProfile>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentTree({
  articleId,
  comments,
  isAuthenticated,
  currentUserId,
  authorProfiles,
}: CommentTreeProps) {
  const tree = useMemo(
    () => buildTree(comments, articleId),
    [comments, articleId],
  );

  if (tree.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        Aucun commentaire pour l'instant.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {tree.map((node) => (
        <CommentNode
          key={node.id}
          node={node}
          articleId={articleId}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
          authorProfiles={authorProfiles}
          depth={0}
        />
      ))}
    </ul>
  );
}

function CommentNode({
  node,
  articleId,
  isAuthenticated,
  currentUserId,
  authorProfiles,
  depth,
}: {
  readonly node: TreeNode<Comment>;
  readonly articleId: string;
  readonly isAuthenticated: boolean;
  readonly currentUserId: string | null;
  readonly authorProfiles: ReadonlyMap<string, AuthorProfile>;
  readonly depth: number;
}) {
  const [replying, setReplying] = useState(false);
  const deleted = Boolean(node.deletedAt);
  const profile = authorProfiles.get(node.authorId);
  const displayName = deleted
    ? "—"
    : (profile?.name ?? "Utilisateur inconnu");
  const isSelf =
    currentUserId === node.authorId && !deleted ? " (vous)" : "";

  return (
    <li className="space-y-3">
      <article
        className="rounded-xl border border-border/60 bg-card p-4"
        aria-label={deleted ? "Commentaire supprimé" : undefined}
      >
        <header className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {!deleted && (
            <Avatar className="size-6">
              {profile?.image && (
                <AvatarImage src={profile.image} alt="" />
              )}
              <AvatarFallback className="bg-gradient-to-br from-chart-1 to-chart-2 text-[10px] font-bold text-white">
                {initialsOf(profile?.name ?? "")}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="font-semibold text-foreground">
            {displayName}
            {isSelf}
          </span>
          <span aria-hidden>·</span>
          <time dateTime={node.createdAt}>{formatDate(node.createdAt)}</time>
        </header>

        {deleted ? (
          <p className="text-sm italic text-muted-foreground">
            Commentaire supprimé
          </p>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {node.content}
          </p>
        )}

        {!deleted && isAuthenticated && (
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReplying((v) => !v)}
            >
              {replying ? "Annuler" : "Répondre"}
            </Button>
            <span className="text-xs text-muted-foreground">
              ❤ {node.likedBy.length}
            </span>
          </div>
        )}

        {replying && (
          <div className="mt-3">
            <CommentForm
              articleId={articleId}
              parentId={node.id}
              isAuthenticated={isAuthenticated}
              onSuccess={() => setReplying(false)}
            />
          </div>
        )}
      </article>

      {node.children.length > 0 && depth < 4 && (
        <ul className="space-y-4 border-l-2 border-border/40 pl-4">
          {node.children.map((child) => (
            <CommentNode
              key={child.id}
              node={child}
              articleId={articleId}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
              authorProfiles={authorProfiles}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}