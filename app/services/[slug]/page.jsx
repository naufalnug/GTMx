import { notFound } from 'next/navigation'
import ContentNavbar from '../../../components/ContentNavbar'
import CaseStudyCta from '../../../components/CaseStudyCta'
import { services } from '../../../data/services'
import './page.css'

export function generateStaticParams() {
  return services.map(service => ({
    slug: service.slug,
  }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const service = services.find(s => s.slug === slug)
  if (!service) return {}

  return {
    title: `${service.title} | GTMx`,
    description: service.blurb,
    openGraph: {
      title: `${service.title} — GTMx`,
      description: service.blurb,
      type: 'website',
    },
  }
}

export default async function ServicePage({ params }) {
  const { slug } = await params
  const service = services.find(s => s.slug === slug)
  if (!service) notFound()

  return (
    <>
      <ContentNavbar />
      <main className="service">
        <article className="service__inner">
          <div className="service__header">
            <a href="/#services" className="service__back">&larr; Back to Services</a>
            <span className="service__eyebrow">{service.hero.eyebrow}</span>
            <h1 className="service__title">{service.hero.title}</h1>
            <p className="service__subhead">{service.hero.subhead}</p>
          </div>

          {/* The problem */}
          <section className="service__section">
            <h2 className="service__h2">The Problem</h2>
            <p className="service__paragraph">{service.problem}</p>
          </section>

          {/* What's included */}
          <section className="service__section">
            <h2 className="service__h2">What&apos;s Included</h2>
            <div className="service__included-grid">
              {service.included.map((item, i) => (
                <div key={i} className="service__included-card">
                  <h3 className="service__included-title">{item.title}</h3>
                  <p className="service__included-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section className="service__section">
            <h2 className="service__h2">How It Works</h2>
            <ol className="service__steps">
              {service.process.map((step, i) => (
                <li key={i} className="service__step">
                  <span className="service__step-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="service__step-body">
                    <span className="service__step-title">{step.title}</span>
                    <span className="service__step-desc">{step.desc}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {/* Proof (optional) */}
          {service.proof && (
            <section className="service__section">
              <h2 className="service__h2">Proof</h2>
              <p className="service__paragraph">{service.proof}</p>
            </section>
          )}

          {/* FAQ (optional) */}
          {service.faq?.length > 0 && (
            <section className="service__section">
              <h2 className="service__h2">FAQ</h2>
              <div className="service__faq">
                {service.faq.map((item, i) => (
                  <details key={i} className="service__faq-item">
                    <summary className="service__faq-q">
                      <span>{item.q}</span>
                      <span className="service__faq-toggle" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                      </span>
                    </summary>
                    <p className="service__faq-a">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <CaseStudyCta />
        </article>
      </main>
    </>
  )
}
