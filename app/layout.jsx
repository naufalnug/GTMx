import Script from 'next/script'
import { JetBrains_Mono, Inter } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata = {
  title: 'GTMx — GTM Engineering for APAC B2B Companies Expanding to the US',
  description: 'GTMx builds the outbound revenue engine that gets APAC B2B tech companies their first qualified US and European pipeline. Cold email, LinkedIn outbound, and GTM engineering — done for you.',
  openGraph: {
    title: 'GTMx — GTM Engineering for APAC B2B Companies Expanding to the US',
    description: 'GTMx builds the outbound revenue engine that gets APAC B2B tech companies their first qualified US and European pipeline.',
    url: 'https://gtmx.run',
    type: 'website',
    siteName: 'GTMx',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GTMx — GTM Engineering for APAC B2B Companies Expanding to the US',
    description: 'GTMx builds the outbound revenue engine that gets APAC B2B tech companies their first qualified US and European pipeline.',
  },
  alternates: {
    canonical: 'https://gtmx.run',
  },
  other: {
    'geo.region': 'SG',
    'geo.placename': 'Singapore',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${inter.variable}`}>
      <body>
        {children}
        <Script id="cal-embed" strategy="afterInteractive">
          {`(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");Cal("init", "30min", {origin:"https://app.cal.com"});`}
        </Script>
      </body>
    </html>
  )
}
