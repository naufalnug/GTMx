import '../home.css'
import '../privacy/page.css'
import Navbar from '../../components/home/Navbar'
import Footer from '../../components/home/Footer'
import { pageMetadata } from '../../lib/seo'
import JsonLd from '../../components/JsonLd'
import { CONTACT_EMAIL, LEGAL_NAME, baseNodes, graph, webPageNode, breadcrumbNode } from '../../lib/schema'
import { SITE_URL } from '../../lib/seo'

export const metadata = pageMetadata({
  path: '/contact',
  title: 'Contact GTMx',
  description:
    'Book a free 30-minute GTM audit with GTMx, or email the team. GTMx is a GTM engineering agency building outbound, RevOps and search systems for B2B SaaS companies.',
})

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={graph([
          ...baseNodes,
          webPageNode({
            url: `${SITE_URL}/contact`,
            name: 'Contact GTMx',
            description: 'How to reach GTMx by email or book a free 30-minute GTM audit.',
            type: 'ContactPage',
          }),
          breadcrumbNode(`${SITE_URL}/contact`, [
            ['Home', SITE_URL],
            ['Contact', `${SITE_URL}/contact`],
          ]),
        ])}
      />
      <Navbar />
      <div className="dd">
        <main className="legal-page">
          <article className="legal-page__inner">
            <div className="legal-page__header">
              <span className="legal-page__label">// contact</span>
              <h1 className="legal-page__title">Contact GTMx</h1>
              <p className="legal-page__updated">
                Free 30-minute GTM audit. No pitch, no obligation.
              </p>
            </div>

            <div className="legal-page__body">
              <h2>Book a call</h2>
              <p>
                The fastest route is the booking calendar. Pick a time on the{' '}
                <a href="/book">booking page</a> and we&apos;ll map what it takes to
                build your engine and show you where the pipeline is.
              </p>

              <h2>Email</h2>
              <p>
                Prefer to write first? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </p>

              <h2>What to expect</h2>
              <p>
                We will ask what you have already tried, what your current pipeline looks like and
                which of the three systems &mdash;{' '}
                <a href="/services/automated-outbound">Automated Outbound</a>,{' '}
                <a href="/services/revops">RevOps</a> or{' '}
                <a href="/services/seo-aeo">SEO + AEO</a> &mdash; actually fits. If none of them do,
                we will say so.
              </p>

              <h2>Company details</h2>
              <p>
                GTMx is operated by {LEGAL_NAME}. More about the team and how we work is on the{' '}
                <a href="/about">about page</a>.
              </p>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  )
}
