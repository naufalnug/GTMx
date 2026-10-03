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
import { faqTabs } from '../data/faq'
import JsonLd from '../components/JsonLd'
import { baseNodes, graph, webPageNode, faqPageNode, serviceNode } from '../lib/schema'
import { BRAND_DEFINITION } from '../lib/site-facts'
import { services } from '../data/services'
import { SITE_URL, pageMetadata } from '../lib/seo'

export const metadata = pageMetadata({
  path: '/',
  title: 'GTMx | Outbound Revenue Engineering for B2B Tech Companies',
  description: 'GTMx builds the outbound revenue engine that gets B2B tech companies their first qualified pipeline. Cold email, LinkedIn outbound, and GTM engineering — done for you.',
  openGraph: {
    description: 'GTMx builds the outbound revenue engine that gets B2B tech companies their first qualified pipeline.',
  },
})

export default function Page() {
  const url = SITE_URL

  /* FAQPage is built from faqTabs only, NOT the exported `faqs` helper.
     `faqs` also spreads in `faqShared`, but components/home/Faq.jsx renders
     only faqTabs, so those three questions were being marked up while being
     invisible on the page. Structured data must match visible content. */
  const visibleFaqs = faqTabs.flatMap(tab =>
    tab.items.map(({ q, a }) => ({ question: q, answer: a }))
  )

  const jsonLd = graph([
    ...baseNodes,
    webPageNode({
      url,
      name: 'GTMx',
      description: BRAND_DEFINITION,
    }),
    faqPageNode(url, visibleFaqs),
    // One Service node per service actually sold, built from the same data the
    // service cards render from.
    ...services.map(s => serviceNode({ slug: s.slug, name: s.name, description: s.blurb })),
  ])

  return (
    <>
      <Navbar />
      <div className="dd">
        <JsonLd data={jsonLd} />
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
