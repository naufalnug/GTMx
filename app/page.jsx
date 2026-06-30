import './home.css'
import Navbar from '../components/home/Navbar'
import Hero from '../components/home/Hero'
import Partners from '../components/home/Partners'
import Services from '../components/home/Services'
import Proof from '../components/home/Proof'
import Method from '../components/home/Method'
import Results from '../components/home/Results'
import Founder from '../components/home/Founder'
import Faq from '../components/home/Faq'
import FinalCTA from '../components/home/FinalCTA'
import Footer from '../components/home/Footer'
import { faqs } from '../data/faq'
import { SITE_URL, pageMetadata } from '../lib/seo'

export const metadata = pageMetadata({
  path: '/',
  title: 'GTMx — Outbound Revenue Engineering for B2B Tech Companies',
  description: 'GTMx builds the outbound revenue engine that gets B2B tech companies their first qualified pipeline. Cold email, LinkedIn outbound, and GTM engineering — done for you.',
  openGraph: {
    description: 'GTMx builds the outbound revenue engine that gets B2B tech companies their first qualified pipeline.',
  },
})

export default function Page() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GTMx',
    url: SITE_URL,
    description: 'Outbound, RevOps, and search systems for B2B tech companies — built into one engine.',
  }

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    provider: {
      '@type': 'Organization',
      name: 'GTMx',
    },
    name: 'GTM Engineering — Outbound, RevOps & Search',
    description: 'We engineer the outbound, RevOps, and search systems that turn a working product into predictable pipeline.',
    serviceType: 'Go-to-Market Engineering',
  }

  return (
    <>
      <Navbar />
      <div className="dd">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
        />
        <Hero />
        <main>
          <Partners />
          <Services />
          <Proof />
          <Method />
          <Results />
          <Founder />
          <Faq />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </>
  )
}
