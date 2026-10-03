import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from '../../../lib/og'
import { caseStudies } from '../../../data/caseStudies'
/* Client name only. No figures: several client numbers are still unresolved
   contradictions (C5, C18–C23), so none of them go on a shareable image. */
export const alt = 'GTMx case study'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export default async function Image({ params }) {
  const { slug } = await params
  const c = caseStudies.find(x => x.slug === slug)
  return ogImageResponse({ eyebrow: 'Case study', title: c ? c.company : 'GTMx case study' })
}
