import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from '../../lib/og'
export const alt = 'GTM Engineering and Outbound Blog — GTMx'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export default function Image() {
  return ogImageResponse({ eyebrow: 'Blog', title: 'GTM Engineering and Outbound Blog' })
}
