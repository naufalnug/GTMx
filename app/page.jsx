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
import { pageMetadata, faqPageJsonLd } from '../lib/seo'
import JsonLd from '../components/JsonLd'

export const metadata = pageMetadata({
  path: '/',
  title: 'GTMx — Outbound Revenue Engineering for B2B Tech Companies',
  description: 'GTMx builds the outbound revenue engine that gets B2B tech companies their first qualified pipeline. Cold email, LinkedIn outbound, and GTM engineering — done for you.',
  openGraph: {
    description: 'GTMx builds the outbound revenue engine that gets B2B tech companies their first qualified pipeline.',
  },
})

export default function Page() {
  const faqJsonLd = faqPageJsonLd(faqs)

  return (
    <>
      <Navbar />
      <div className="dd">
        <JsonLd data={faqJsonLd} />
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
