import '../home.css'
import '../privacy/page.css'
import './page.css'
import Navbar from '../../components/home/Navbar'
import Footer from '../../components/home/Footer'
import { pageMetadata } from '../../lib/seo'
import JsonLd from '../../components/JsonLd'
import { CONTACT_EMAIL, baseNodes, graph, webPageNode, breadcrumbNode, serviceNode } from '../../lib/schema'
import { SITE_URL } from '../../lib/seo'
import { services } from '../../data/services'

export const metadata = pageMetadata({
  path: '/engagements',
  title: 'How GTMx Engagements Work | GTMx',
  description:
    'How GTMx engagements work: scoped sprint projects or GTM engineering as an ongoing subscription, a 90-day initial commitment then month to month, and a system you own end to end.',
})

/* Every fact on this page is already published elsewhere on the site:
   data/services.js:66 (the two models), data/faq.js:23 (commitment, pricing
   policy), :46 (approval and reporting), :50 and :71 (ownership), :60 (RevOps
   delivery window). Nothing here is new information, and no price appears,
   because the site's stated policy is to quote against scope. */

export default function EngagementsPage() {
  return (
    <>
      <JsonLd
        data={graph([
          ...baseNodes,
          webPageNode({
            url: `${SITE_URL}/engagements`,
            name: 'How GTMx Engagements Work',
            description:
              'The two GTMx engagement models, commitment terms, what the client owns, and how pricing is scoped.',
          }),
          // Self-contained Service nodes, so these references resolve inside this
          // page's own graph rather than pointing at another page.
          ...services.map(s => serviceNode({ slug: s.slug, name: s.name, description: s.blurb })),
          breadcrumbNode(`${SITE_URL}/engagements`, [
            ['Home', SITE_URL],
            ['How engagements work', `${SITE_URL}/engagements`],
          ]),
        ])}
      />
      <Navbar />
      <div className="dd">
        <main className="legal-page">
          <article className="legal-page__inner">
            <div className="legal-page__header">
              <span className="legal-page__label">// engagements</span>
              <h1 className="legal-page__title">How GTMx Engagements Work</h1>
            </div>

            <div className="legal-page__body">
              <p className="eng-answer">
                GTMx is a GTM engineering agency that builds outbound, RevOps and search systems for
                B2B SaaS companies. GTMx works two ways: scoped sprint projects for a specific build,
                or GTM engineering as an ongoing subscription. Engagements start with a 90-day
                commitment, then run month to month.
              </p>

              <h2>What are the two engagement models?</h2>
              <p>
                GTMx offers a scoped sprint for a single defined build, and an ongoing subscription
                with dedicated engineers. The commitment, ownership and approval terms are the same in
                both. What changes is the scope and how the work is directed.
              </p>

              <table className="eng-table">
                <caption>GTMx engagement models compared</caption>
                <thead>
                  <tr>
                    <th scope="col">&nbsp;</th>
                    <th scope="col">Scoped sprint</th>
                    <th scope="col">GTM engineering as a service</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">What it is</th>
                    <td>A project scoped to one specific use case.</td>
                    <td>An ongoing subscription with dedicated engineers.</td>
                  </tr>
                  <tr>
                    <th scope="row">Typical scope</th>
                    <td>TAM sourcing, inbound orchestration, CRM enrichment, or a HubSpot build.</td>
                    <td>Whatever the current priority is. Engineers adapt week to week.</td>
                  </tr>
                  <tr>
                    <th scope="row">How work is directed</th>
                    <td>Fixed at the start, against the agreed scope.</td>
                    <td>Re-prioritized with you as the motion changes.</td>
                  </tr>
                  <tr>
                    <th scope="row">Commitment</th>
                    <td colSpan={2}>
                      90 days initially, then month to month. GTMx does not use 12-month contracts.
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Who owns the stack</th>
                    <td colSpan={2}>
                      You do. Workflows, sequences, lead data and infrastructure all live in your
                      accounts, not in GTMx accounts.
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">What you approve</th>
                    <td colSpan={2}>
                      Lead lists, sequences and copy variants, all reviewed by you before anything
                      launches.
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Pricing</th>
                    <td colSpan={2}>
                      Quoted against scope on the strategy call. It depends on which systems you are
                      building.
                    </td>
                  </tr>
                </tbody>
              </table>

              <h2>What does an engagement cost?</h2>
              <p>
                GTMx does not publish a price list. Pricing depends on which of the three systems you
                are building and how much of it already exists, so GTMx quotes against scope on the
                strategy call. That call is free and runs 30 minutes.
              </p>

              <h2>How does an engagement run, step by step?</h2>
              <p>
                Every GTMx engagement runs the same four moves, whatever the service. The{' '}
                <a href="/#method">GTMx Method section</a> on the homepage shows what each move covers
                for outbound, RevOps and search.
              </p>
              <ol className="eng-steps">
                <li>
                  <strong>Audit.</strong> GTMx maps the current stack, data and workflows, and shows
                  where pipeline is leaking.
                </li>
                <li>
                  <strong>Build.</strong> GTMx engineers the system: infrastructure, lists, sequences,
                  enrichment, scoring and routing.
                </li>
                <li>
                  <strong>Launch.</strong> Campaigns and workflows go live. GTMx manages replies and
                  reporting from day one.
                </li>
                <li>
                  <strong>Iterate.</strong> Weekly tuning on what is converting, so output compounds
                  instead of plateauing.
                </li>
              </ol>
              <p>
                For RevOps specifically, GTMx delivers the system in 30 to 60 days. Each service page
                sets out that service&apos;s own engagement steps:{' '}
                <a href="/services/automated-outbound">Automated Outbound</a>,{' '}
                <a href="/services/revops">RevOps</a> and{' '}
                <a href="/services/seo-aeo">SEO + AEO</a>.
              </p>

              <h2>What visibility do you get during an engagement?</h2>
              <p>
                You approve everything before it ships. Once campaigns are live you get a shared
                dashboard with daily reply data, booked meetings and pipeline value. If something is
                not working, you see it the same day GTMx does.
              </p>

              <h2>What happens when an engagement ends?</h2>
              <p>
                You keep the system. Workflows, data and infrastructure stay in your accounts, so there
                is no handover cost and no dependency on GTMx to keep it running. GTMx documents what
                it built and hands it over.
              </p>

              <h2>Ready to scope an engagement?</h2>
              <p>
                Book a free 30-minute GTM audit from the <a href="/contact">contact page</a> and GTMx
                will map what it would take for your pipeline. You can also email {CONTACT_EMAIL}.
                Past engagements are written up in the{' '}
                <a href="/case-studies">case studies</a>.
              </p>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  )
}
