import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from '../../lib/og'
export const alt = 'Book a Free GTM Audit — GTMx'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export default function Image() {
  return ogImageResponse({ eyebrow: 'Free GTM audit', title: 'Book a Free GTM Audit' })
}
