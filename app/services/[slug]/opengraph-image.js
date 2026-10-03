import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from '../../../lib/og'
import { services } from '../../../data/services'
export const alt = 'GTMx service'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export default async function Image({ params }) {
  const { slug } = await params
  const s = services.find(x => x.slug === slug)
  return ogImageResponse({ eyebrow: 'GTMx service', title: s ? s.name : 'GTMx' })
}
