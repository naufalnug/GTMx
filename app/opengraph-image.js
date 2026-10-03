import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from '../lib/og'
/* Root template. Next's metadata file convention cascades, so this also serves
   any route that does not define its own (/privacy, /terms). */
export const alt = 'GTMx — GTM engineering agency for B2B SaaS'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export default function Image() {
  return ogImageResponse({
    eyebrow: 'GTM engineering agency',
    title: 'Outbound, RevOps and Search, Built Into One Engine',
  })
}
