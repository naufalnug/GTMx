import '../home.css'
import '../privacy/page.css'
import Navbar from '../../components/home/Navbar'
import Footer from '../../components/home/Footer'
import { pageMetadata } from '../../lib/seo'
import { BRAND_DEFINITION } from '../../lib/site-facts'
import { CONTACT_EMAIL, LEGAL_NAME } from '../../lib/schema'
import { services } from '../../data/services'
import { caseStudies } from '../../data/caseStudies'

export const metadata = pageMetadata({
  path: '/about',
  title: 'About GTMx | GTM Engineering Agency',
  description: BRAND_DEFINITION,
})

/* NOTE on the founder section below.
   Everything stated is already public on the homepage (components/home/Founder.jsx).
   Two things are deliberately NOT repeated here:
   1. The surname. The repo has the first name only and it will not be inferred.
   2. The "multiple millions of emails / over 5,000 MQLs" line, because that figure
      is contradiction C6 (the stats block says "1M+") and is unresolved. Copying it
      onto a new page would spread the conflict to a second URL.
   Person schema is held for the same reason (decision D5). */

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="dd">
        <main className="legal-page">
          <article className="legal-page__inner">
            <div className="legal-page__header">
              <span className="legal-page__label">// about</span>
              <h1 className="legal-page__title">About GTMx</h1>
              <p className="legal-page__updated">{BRAND_DEFINITION}</p>
            </div>

            <div className="legal-page__body">
              <h2>What GTMx does</h2>
              <p>
                GTMx builds and runs three systems. Each one is engineered, launched and
                operated for you rather than handed over as a playbook.
              </p>
              <ul>
                {services.map(s => (
                  <li key={s.slug}>
                    <a href={`/services/${s.slug}`}>{s.name}</a> &mdash; {s.blurb}
                  </li>
                ))}
              </ul>

              <h2>Engines we have already built</h2>
              <p>
                Four client engagements, each written up with the campaign data behind it.
              </p>
              <ul>
                {caseStudies.map(c => (
                  <li key={c.slug}>
                    <a href={`/case-studies/${c.slug}`}>{c.company}</a> &mdash; {c.headline}
                  </li>
                ))}
              </ul>
              <h2>Founder</h2>
              <div className="founder-grid">
                <div className="founder-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/founder-headshot.jpg"
                    alt="Josh, founder of GTMx"
                    width={1000}
                    height={1000}
                    className="founder-photo__img"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="founder-photo__tag">Founder</span>
                </div>
                <div className="founder-copy">
                  {/* NEEDS INPUT: founder surname, formal job title, and any further
                      verifiable bio facts. Person schema and post bylines stay held
                      until these arrive (decision D5). */}
                  <p>
                    Hey there, I&apos;m Josh. I&apos;ve worn a lot of hats: project manager, product
                    manager, blogger (back in the pre-ChatGPT days), cold email agency owner, GTM
                    engineer, and then a cold email agency owner again. That loop wasn&apos;t an
                    accident. Every detour taught me something about how B2B pipeline actually gets
                    built, and it kept pulling me back to the thing I&apos;m best at &mdash; which is GTM.
                  </p>
                  <p>
                    <a
                      href="https://www.linkedin.com/in/youhavefoundjoshua/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Josh on LinkedIn
                    </a>
                  </p>
                </div>
              </div>

              <h2>How we work</h2>
              <p>
                Every engagement runs the same four moves &mdash; audit, build, launch, iterate.
                The <a href="/#method">GTMx Method section</a> on the homepage walks through what
                each move covers for outbound, RevOps and search. Each service page then sets out
                that service&apos;s own engagement steps.
              </p>

              <h2>Company</h2>
              <p>
                GTMx is operated by {LEGAL_NAME}. You can reach us at {CONTACT_EMAIL}, or book a
                free 30-minute GTM audit from the <a href="/contact">contact page</a>.
              </p>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  )
}
