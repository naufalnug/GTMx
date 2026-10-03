/* ──────────────────────────────────────────────
   GTMx — lib/og.js
   Shared 1200x630 Open Graph image template (decision D6).
   Rendered at build time by next/og's ImageResponse via the
   `opengraph-image.js` file convention in each route segment.

   Content rule: page title or client name, plus the GTMx wordmark.
   NO figures are drawn on any image — several client numbers are still
   unresolved contradictions, so none of them belong on a shareable asset.
   ────────────────────────────────────────────── */

import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const INK = '#1A1712'
const CREAM = '#FFFDF7'
const FLAME = '#E8552B'

/** Title sizing that keeps long headlines inside the frame without clipping. */
function titleSize(text) {
  const n = (text || '').length
  if (n > 90) return 50
  if (n > 60) return 62
  if (n > 38) return 74
  return 86
}

export function ogImageResponse({ eyebrow, title }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: CREAM,
          padding: '64px 72px',
          border: `16px solid ${INK}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: FLAME }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: INK, letterSpacing: -0.5 }}>
            {eyebrow}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: titleSize(title),
            fontWeight: 800,
            color: INK,
            lineHeight: 1.08,
            letterSpacing: -2,
          }}
        >
          {title}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 44, fontWeight: 800, color: INK, letterSpacing: -1.5 }}>
            <span>gtmx</span>
            <span style={{ color: FLAME }}>.</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: INK, opacity: 0.6 }}>gtmx.run</div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  )
}
