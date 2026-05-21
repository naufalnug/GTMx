import { Geist, Geist_Mono } from 'next/font/google'
import { Instrument_Serif } from 'next/font/google'
import './globals.css'

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

export const metadata = {
  icons: {
    icon: '/favicon.svg',
  },
  title: 'GTMx — Outbound Revenue Engineering for B2B Tech Companies',
  description: 'GTMx builds the outbound revenue engine that gets B2B tech companies their first qualified pipeline. Cold email, LinkedIn outbound, and GTM engineering — done for you.',
  openGraph: {
    title: 'GTMx — Outbound Revenue Engineering for B2B Tech Companies',
    description: 'GTMx builds the outbound revenue engine that gets B2B tech companies their first qualified pipeline.',
    url: 'https://gtmx.run',
    type: 'website',
    siteName: 'GTMx',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GTMx — Outbound Revenue Engineering for B2B Tech Companies',
    description: 'GTMx builds the outbound revenue engine that gets B2B tech companies their first qualified pipeline.',
  },
  alternates: {
    canonical: 'https://gtmx.run',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}
