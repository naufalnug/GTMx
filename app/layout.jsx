import { Geist, Geist_Mono } from 'next/font/google'
import { Instrument_Serif } from 'next/font/google'
import { Figtree, Caveat } from 'next/font/google'
import { SITE_URL, SITE_NAME } from '../lib/seo'
import './globals.css'

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
  weight: ['600', '700'],
})

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--geist-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--geist-mono',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--instrument-serif',
  display: 'swap',
  weight: '400',
  style: ['normal', 'italic'],
})

// metadataBase lets Next resolve any relative metadata URLs and silences the
// build-time warning. Per-page canonical and og:url are set on each route via
// pageMetadata() (lib/seo.js); the root layout deliberately does NOT set
// `alternates.canonical` or `openGraph.url`, so nothing here can leak the
// homepage URL onto child routes.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: '/favicon.svg',
  },
  title: 'GTMx — Outbound Revenue Engineering for B2B Tech Companies',
  description: 'GTMx builds the outbound revenue engine that gets B2B tech companies their first qualified pipeline. Cold email, LinkedIn outbound, and GTM engineering — done for you.',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
  },
  // Twitter Card tags are produced per-route by pageMetadata() (lib/seo.js) so
  // each page carries its own title/description; no homepage default is set
  // here, which would otherwise leak onto every subpage.
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${figtree.variable} ${caveat.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}
