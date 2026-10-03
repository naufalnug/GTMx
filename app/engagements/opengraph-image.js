import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from '../../lib/og'
export const alt = 'How GTMx Engagements Work — GTMx'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export default function Image() {
  return ogImageResponse({ eyebrow: 'How we work', title: 'How GTMx Engagements Work' })
}
