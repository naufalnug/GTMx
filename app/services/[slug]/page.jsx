import { notFound } from 'next/navigation'
import Navbar from '../../../components/home/Navbar'
import Footer from '../../../components/home/Footer'
import ServiceFaq from '../../../components/home/ServiceFaq'
import ServiceCta from '../../../components/home/ServiceCta'
import { services } from '../../../data/services'
import { pageMetadata, absoluteUrl, SITE_URL, SITE_NAME } from '../../../lib/seo'
import './page.css'

// `</script>`-safe JSON-LD serialization (matches the article route).
const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c')

export function generateStaticParams() {
  return services.map(service => ({ slug: service.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const service = services.find(s => s.slug === slug)
  // No canonical for an unknown slug — the page itself 404s (notFound below).
  if (!service) return {}

  return pageMetadata({
    path: `/services/${service.slug}`,
    title: `${service.name} | GTMx`,
    description: service.blurb,
    openGraph: {
      title: `${service.name} — GTMx`,
      description: service.blurb,
    },
  })
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
)

export default async function ServicePage({ params }) {
  const { slug } = await params
  const service = services.find(s => s.slug === slug)
  if (!service) notFound()

  const stepCount = service.process.length
  const cols = stepCount <= 4 ? stepCount : 3

  const url = absoluteUrl(`/services/${service.slug}`)
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.name,
      description: service.blurb,
      serviceType: service.name,
      url,
      provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: service.name, item: url },
      ],
    },
  ]

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
        />
      ))}
      <Navbar />
      <div className={`svc-page ${service.theme}`}>
        <main>
          {/* HERO */}
          <section className="shero">
            <div className="wrap shero__grid">
              <div>
                <span className="svc-eyebrow"><span className="dot"></span>{service.kicker}</span>
                <h1 className="shero__h1" dangerouslySetInnerHTML={{ __html: service.h1 }} />
                <p className="lede shero__lede" dangerouslySetInnerHTML={{ __html: service.subhead }} />
                <div className="shero__cta">
                  <a href="#book" className="btn btn--dark">Book a free audit <Arrow /></a>
                  <a href="/#work" className="btn btn--ghost">See the work <Arrow /></a>
                </div>
              </div>
              <div className="shero__art">
                <span className="shero__blob" style={{ width: 160, height: 160, background: 'var(--white)', top: -30, left: -20, opacity: 0.4 }}></span>
                <span className="shero__blob" style={{ width: 120, height: 120, background: 'var(--gold)', bottom: -20, right: -10 }}></span>
                <div className="shero__icon">
                  <svg width="58" height="58" viewBox="0 0 44 44" fill="none" stroke="#1A1712" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: service.icon }} />
                </div>
              </div>
            </div>
          </section>

          {/* PROBLEM */}
          <section className="section">
            <div className="wrap">
              <div className="sec-head"><h2 className="h2">The <span className="hl hl--accent">problem.</span></h2></div>
              <div className="problem-card"><p className="lede" dangerouslySetInnerHTML={{ __html: service.problem }} /></div>
            </div>
          </section>

          {/* INCLUDED */}
          <section className="section section--paper">
            <div className="wrap">
              <div className="sec-head">
                <h2 className="h2">What&apos;s <span className="hl">included.</span></h2>
                <p className="lede">Everything we build, launch, and run for you &mdash; one connected system, not a pile of tools.</p>
              </div>
              <div className="inc-grid">
                {service.included.map((it, i) => (
                  <div key={i} className="inc-card">
                    <span className="inc-card__n">{i + 1}</span>
                    <h3 className="inc-card__t">{it.title}</h3>
                    <p className="inc-card__d">{it.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PROCESS */}
          <section className="section" id="process">
            <div className="wrap">
              <div className="sec-head">
                <h2 className="h2">How it <span className="hl">works.</span></h2>
                <p className="lede">The GTMx Method, applied to {service.name.toLowerCase()}.</p>
              </div>
              <div
                className={'steps' + (stepCount > 4 ? ' no-line' : '')}
                style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, ...(stepCount > 4 ? { rowGap: '40px' } : {}) }}
              >
                {service.process.map((p, i) => (
                  <div key={i} className="step">
                    <div className="step__tile">{i + 1}</div>
                    <h3 className="step__t">{p.title}</h3>
                    <p className="step__d">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PROOF */}
          <section className="section section--paper">
            <div className="wrap"><p className="proofline" dangerouslySetInnerHTML={{ __html: service.proof }} /></div>
          </section>

          {/* FAQ */}
          <ServiceFaq items={service.faq} />

          {/* CTA + inline Cal.com booking */}
          <ServiceCta serviceName={service.name} />
        </main>
        <Footer />
      </div>
    </>
  )
}
