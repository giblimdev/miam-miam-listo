/*
path :           app/blog/components/DiscussionThread.tsx
tag :            ["blog", "component", "discussion", "tree", "client", "avatar"]
projectId:       new-genesis
type :           component
generic:         false

role:            Arbre récursif des posts d'une discussion. Reconstruit
                 via buildTree (racine = discussion.id). Client : état
                 replyTo par post, bouton Supprimer visible si auteur
                 ou owner/mod, bouton Répondre si authentifié. Actions
                 via createPostAction / softDeletePostAction.
                 Affiche avatar + nom de l'auteur de chaque post via une
                 `Map<userId, AuthorProfile>` résolue côté serveur
                 (les posts JSON ne dupliquent pas les données Prisma).
                 Fallback « Utilisateur inconnu » si profil manquant.

flow:            Props { groupId, discussionId, posts, isAuthenticated,
                 isOwnerOrMod, currentUserId, authorProfiles } →
                 useMemo(buildTree) → rend PostNode récursif.

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
                  "@/app/blog/lib/actions/group.ts",
                  "@/app/blog/lib/services/author.ts",
                  "@/app/blog/components/NewPostForm.tsx"]

imports:         ["react", "next/navigation", "lucide-react", "sonner",
                  "@/app/blog/lib/types",
                  "@/app/blog/lib/tree",
                  "@/app/blog/lib/services/author",
                  "@/app/blog/lib/actions/group",
                  "@/app/blog/components/NewPostForm",
                  "@/components/ui/avatar",
                  "@/components/ui/button",
                  "@/utils/initials"]

exports:         ["DiscussionThread", "DiscussionThreadProps"]

useBy:           ["@/app/blog/community/[groupSlug]/[discussionId]/page.tsx"]

userStories:     ["us3100004",
                  "*en tant qu'utilisateur je veux voir le nom et l'avatar des participants"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState (replyTo), useMemo, useTransition, toast.

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { Post } from "@/app/blog/lib/types";
import { buildTree, type TreeNode } from "@/app/blog/lib/tree";
import type { AuthorProfile } from "@/app/blog/lib/services/author";
import { softDeletePostAction } from "@/app/blog/lib/actions/group";
import { NewPostForm } from "@/app/blog/components/NewPostForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initialsOf } from "@/utils/initials";

export interface DiscussionThreadProps {
  readonly groupId: string;
  readonly discussionId: string;
  readonly posts: readonly Post[];
  readonly isAuthenticated: boolean;
  readonly isOwnerOrMod: boolean;
  readonly currentUserId: string | null;
  /**
   * Map userId → profil (nom + image). Résolue côté serveur par
   * resolveAuthorProfiles() (posts + discussion.authorId).
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

export function DiscussionThread({
  groupId,
  discussionId,
  posts,
  isAuthenticated,
  isOwnerOrMod,
  currentUserId,
  authorProfiles,
}: DiscussionThreadProps) {
  const tree = useMemo(
    () => buildTree(posts, discussionId),
    [posts, discussionId],
  );

  if (tree.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        Aucune réponse pour l&apos;instant.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {tree.map((node) => (
        <PostNode
          key={node.id}
          node={node}
          groupId={groupId}
          discussionId={discussionId}
          isAuthenticated={isAuthenticated}
          isOwnerOrMod={isOwnerOrMod}
          currentUserId={currentUserId}
          authorProfiles={authorProfiles}
          depth={0}
        />
      ))}
    </ul>
  );
}

function PostNode({
  node,
  groupId,
  discussionId,
  isAuthenticated,
  isOwnerOrMod,
  currentUserId,
  authorProfiles,
  depth,
}: {
  readonly node: TreeNode<Post>;
  readonly groupId: string;
  readonly discussionId: string;
  readonly isAuthenticated: boolean;
  readonly isOwnerOrMod: boolean;
  readonly currentUserId: string | null;
  readonly authorProfiles: ReadonlyMap<string, AuthorProfile>;
  readonly depth: number;
}) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deleted = Boolean(node.deletedAt);
  const canDelete =
    !deleted &&
    (isOwnerOrMod || (currentUserId && node.authorId === currentUserId));
  const profile = authorProfiles.get(node.authorId);
  const displayName = deleted
    ? "—"
    : (profile?.name ?? "Utilisateur inconnu");
  const isSelf =
    currentUserId === node.authorId && !deleted ? " (vous)" : "";

  function handleDelete() {
    startTransition(async () => {
      const result = await softDeletePostAction(
        groupId,
        discussionId,
        node.id,
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Réponse supprimée.");
      router.refresh();
    });
  }

  return (
    <li className="space-y-3">
      <article className="rounded-xl border border-border/60 bg-card p-4">
        <header className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {!deleted && (
            <Avatar className="size-6">
              {profile?.image && (
                <AvatarImage src={profile.image} alt="" />
              )}
              <AvatarFallback className="bg-gradient-to-br from-chart-2 to-chart-3 text-[10px] font-bold text-white">
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
            Réponse supprimée
          </p>
        ) : (
          <p className="whitespace-pre-wrap text-sm text-foreground/90">
            {node.content}
          </p>
        )}
        {!deleted && (isAuthenticated || canDelete) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isAuthenticated && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setReplying((v) => !v)}
                className="gap-1.5"
              >
                <Reply className="size-3.5" aria-hidden />
                {replying ? "Annuler" : "Répondre"}
              </Button>
            )}
            {canDelete && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isPending}
                className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Supprimer
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              ❤ {node.likedBy.length}
            </span>
          </div>
        )}
        {replying && (
          <div className="mt-3">
            <NewPostForm
              groupId={groupId}
              discussionId={discussionId}
              parentId={node.id}
              onSuccess={() => setReplying(false)}
            />
          </div>
        )}
      </article>

      {node.children.length > 0 && depth < 4 && (
        <ul className="space-y-3 border-l-2 border-border/40 pl-4">
          {node.children.map((child) => (
            <PostNode
              key={child.id}
              node={child}
              groupId={groupId}
              discussionId={discussionId}
              isAuthenticated={isAuthenticated}
              isOwnerOrMod={isOwnerOrMod}
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