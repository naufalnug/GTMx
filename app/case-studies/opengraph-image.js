import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from '../../lib/og'
export const alt = 'B2B Outbound Case Studies — GTMx'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export default function Image() {
  return ogImageResponse({ eyebrow: 'Case studies', title: 'B2B Outbound Case Studies' })
}
