import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Problem from '../components/Problem'
import Solution from '../components/Solution'
import IcpSection from '../components/IcpSection'
import Process from '../components/Process'
import SocialProof from '../components/SocialProof'
import CaseStudies from '../components/CaseStudies'
import FAQ from '../components/FAQ'
import Pricing from '../components/Pricing'
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
    description: 'GTM engineering for APAC B2B companies expanding to the US and Europe',
  }

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    provider: {
      '@type': 'Organization',
      name: 'GTMx',
    },
    name: 'GTM Engineering for APAC Expansion',
    description: 'We build the outbound revenue engine that gets APAC B2B tech companies their first qualified US and European pipeline.',
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
          <Problem />
          <Solution />
          <IcpSection />
          <Process />
          <SocialProof />
          <CaseStudies />
          <FAQ />
          <Pricing />
        </main>
        <Footer />
      </div>
    </>
  )
}
