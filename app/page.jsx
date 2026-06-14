import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import ProofStrip from '../components/ProofStrip'
import Problem from '../components/Problem'
import Services from '../components/Services'
import IcpSection from '../components/IcpSection'
import Process from '../components/Process'
import Founder from '../components/Founder'
import CaseStudies from '../components/CaseStudies'
import FAQ from '../components/FAQ'
import FinalCTA from '../components/FinalCTA'
import Footer from '../components/Footer'
import RevealObserver from '../components/RevealObserver'
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
    description: 'Outbound revenue engineering for B2B tech companies',
  }

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    provider: {
      '@type': 'Organization',
      name: 'GTMx',
    },
    name: 'GTM Engineering for Outbound Pipeline',
    description: 'We build the outbound revenue engine that gets B2B tech companies their first qualified pipeline.',
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
      <RevealObserver />
      <Navbar />
      <main>
        <Hero />
        <ProofStrip />
        <Problem />
        <Services />
        <IcpSection />
        <Process />
        {/* Cases moved BEFORE Founder — work first, human second */}
        <CaseStudies />
        <Founder />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
