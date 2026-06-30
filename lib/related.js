/**
 * Taxonomy-driven internal linking. Relatedness is computed from real tag
 * overlap between content, so links are editorially relevant rather than
 * mechanical — topically unrelated services/posts are excluded automatically.
 * Pure functions, evaluated server-side/at build time by the article page.
 */

import { articles } from '../data/articles';
import { services } from '../data/services';

/** Number of tags two items share. */
function sharedTagCount(a = [], b = []) {
  const set = new Set(a);
  return b.reduce((n, tag) => (set.has(tag) ? n + 1 : n), 0);
}

/**
 * Service pages whose topics overlap this article's tags, most relevant first.
 * Returns [] when the article has no tags or nothing genuinely matches.
 *
 * @param {{tags?: string[]}} article
 * @param {number} [limit]
 * @returns {Array<{slug: string, name: string}>}
 */
export function relatedServices(article, limit = 2) {
  const tags = article?.tags ?? [];
  if (tags.length === 0) return [];
  return services
    .map(service => ({ service, score: sharedTagCount(tags, service.tags) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ service }) => service);
}

/**
 * Other posts sharing tags with this one, ranked by overlap then recency.
 * Excludes the post itself; returns [] when nothing qualifies.
 *
 * @param {{slug: string, tags?: string[]}} article
 * @param {number} [limit]
 * @returns {typeof articles}
 */
export function relatedPosts(article, limit = 2) {
  const tags = article?.tags ?? [];
  if (tags.length === 0) return [];
  return articles
    .filter(post => post.slug !== article.slug)
    .map(post => ({ post, score: sharedTagCount(tags, post.tags) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (a.post.date < b.post.date ? 1 : -1))
    .slice(0, limit)
    .map(({ post }) => post);
}
