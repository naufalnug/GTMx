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
  "frame-src 'self' https://app.cal.com https://cal.com",
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
