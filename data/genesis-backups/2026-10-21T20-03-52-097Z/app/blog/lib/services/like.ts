/*
path :           app/blog/lib/services/like.ts
tag :            ["blog", "service", "like", "toggle"]
projectId:       new-genesis
type:            helper
generic:         true

role:            Service toggle de like sur un article. Le like est un
                 userId dans article.likedBy[]. Unicité garantie par
                 vérification d'absence avant push (sous mutex). Compteur
                 = likedBy.length. Aucune table dédiée. Le like de
                 commentaire est géré dans comment.ts (toggleLikeOnComment).

flow:            toggleLikeOnArticle(articleId, userId) →
                 mutateBlog → map article → si userId présent : filter
                 sinon push → retourne { liked, count }.

ecosystem:       BlogServices = [
                   "@/app/blog/lib/services/article.ts",
                   "@/app/blog/lib/services/comment.ts",
                   "@/app/blog/lib/services/favorite.ts",
                   "@/app/blog/lib/services/group.ts",
                   "@/app/blog/lib/services/like.ts",
                   "@/app/blog/lib/services/notification.ts",
                   "@/app/blog/lib/services/search.ts",
                   "@/app/blog/lib/services/taxonomy.ts",
                 ]

relatedFiles:    ["@/app/blog/lib/storage.ts"]

imports:         ["@/app/blog/lib/storage"]

exports:         ["toggleLikeOnArticle", "ToggleArticleLikeResult"]

useBy:           ["@/app/blog/lib/actions/like.ts"]

userStories:     ["us2100003"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import { mutateBlog } from "@/app/blog/lib/storage";

export interface ToggleArticleLikeResult {
  readonly liked: boolean;
  readonly count: number;
}

export async function toggleLikeOnArticle(
  articleId: string,
  userId: string,
): Promise<ToggleArticleLikeResult> {
  let result: ToggleArticleLikeResult = { liked: false, count: 0 };

  await mutateBlog((doc) => ({
    ...doc,
    articles: doc.articles.map((article) => {
      if (article.id !== articleId) return article;
      const already = article.likedBy.includes(userId);
      const likedBy = already
        ? article.likedBy.filter((id) => id !== userId)
        : [...article.likedBy, userId];
      result = { liked: !already, count: likedBy.length };
      return { ...article, likedBy };
    }),
  }));

  return result;
}