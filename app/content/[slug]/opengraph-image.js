import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from '../../../lib/og'
import { getPublishedArticleBySlug } from '../../../lib/articles'
export const alt = 'GTMx article'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export default async function Image({ params }) {
  const { slug } = await params
  const a = await getPublishedArticleBySlug(slug)
  return ogImageResponse({ eyebrow: 'GTMx blog', title: a ? a.title : 'GTMx blog' })
}
