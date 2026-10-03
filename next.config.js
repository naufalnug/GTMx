/** @type {import('next').NextConfig} */

// Security response headers. These are all invisible to users and change no
// rendered pixels — they only harden the transport.
//
// The Content-Security-Policy is shipped in REPORT-ONLY mode on purpose: the
// site loads the Cal.com booking embed (an inline loader script that injects
// https://app.cal.com/embed/embed.js and an app.cal.com iframe) and Next.js
// injects its own inline bootstrap/hydration scripts, so an *enforced* strict
// policy would need per-request nonces (middleware) to avoid breaking booking
// and hydration. Report-Only lets the exact policy below be validated against
// real traffic first; flip the header name to `Content-Security-Policy` to
// enforce once violation reports are clean. See SEO-FINAL-REPORT.md.
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self' https://app.cal.com",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://app.cal.com https://cal.com",
  "connect-src 'self' https://app.cal.com https://cal.com",
  "frame-src 'self' https://app.cal.com https://cal.com https://send.gtmx.run https://*.emailbison.com",
  // NOTE: `upgrade-insecure-requests` is intentionally omitted here — it is
  // ignored inside a report-only policy and browsers log a console warning if
  // present. Add it back only when the policy is switched to enforced.
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
]

const nextConfig = {
  // Don't advertise the framework in a response header.
  poweredByHeader: false,
  /* Permanent redirects. Single hop only: never point one redirect at another.
     /case-studies/metatron-concepts -> /case-studies/vidify, because every
     visible surface (homepage card, stats strip, page h1) says "Vidify" while
     the URL said "metatron-concepts". */
  async redirects() {
    return [
      {
        source: '/case-studies/metatron-concepts',
        destination: '/case-studies/vidify',
        // statusCode 301 rather than `permanent: true`, which emits 308. Both are
        // permanent and Google treats them the same, but the spec asked for 301.
        statusCode: 301,
      },
      /* Blog moved /content -> /blog so the URL matches the visible "Blog" label.
         ORDER MATTERS: the renamed VP of Sales post must match its own rule BEFORE
         the generic /content/:slug* rule, or it would land on /blog/<old-slug> and
         need a second hop. Next matches redirects in array order. */
      {
        source: '/content/the-250k-mistake-hiring-us-vp-sales-too-early',
        destination: '/blog/the-250k-mistake-hiring-vp-sales-first',
        statusCode: 301,
      },
      {
        source: '/content/:slug*',
        destination: '/blog/:slug*',
        statusCode: 301,
      },
      {
        source: '/content',
        destination: '/blog',
        statusCode: 301,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
