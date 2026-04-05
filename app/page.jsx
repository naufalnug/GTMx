import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import StatsBar from '../components/StatsBar'
import HowItWorks from '../components/HowItWorks'
import Services from '../components/Services'
import CaseStudies from '../components/CaseStudies'
import Pricing from '../components/Pricing'
import TechStack from '../components/TechStack'
import FAQ from '../components/FAQ'
import Footer from '../components/Footer'
import { faqs } from '../data/faq'

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
    url: 'https://gtmx.run',
    description: 'GTM pipeline engineering for B2B teams',
  }

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    provider: {
      '@type': 'Organization',
      name: 'GTMx',
    },
    name: 'GTM Pipeline Engineering',
    description: 'We build automated revenue infrastructure for funded B2B startups — from enrichment and sequences to routing, scoring, and dashboards.',
    serviceType: 'Go-to-Market Engineering',
  }

  return (
    <>
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
      <div className="app">
        <Navbar />
        <main>
          <Hero />
          <StatsBar />
          <HowItWorks />
          <Services />
          <CaseStudies />
          <Pricing />
          <TechStack />
          <FAQ />
        </main>
        <Footer />
      </div>
    </>
  )
}
