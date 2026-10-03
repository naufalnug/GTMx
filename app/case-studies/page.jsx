import '../home.css'
import '../privacy/page.css'
import Navbar from '../../components/home/Navbar'
import Footer from '../../components/home/Footer'
import { pageMetadata } from '../../lib/seo'
import { caseStudies } from '../../data/caseStudies'
import JsonLd from '../../components/JsonLd'
import { baseNodes, graph, webPageNode, breadcrumbNode } from '../../lib/schema'
import { SITE_URL } from '../../lib/seo'

export const metadata = pageMetadata({
  path: '/case-studies',
  title: 'B2B Outbound Case Studies | GTMx',
  description:
    'Four GTMx client engagements, each written up with the campaign data behind it: OpenSponsorship, Strategy Achievers, Metatron Concepts (Vidify) and United Safety Training Systems.',
})

export default function CaseStudiesPage() {
  return (
    <>
      <JsonLd
        data={graph([
          ...baseNodes,
          webPageNode({
            url: `${SITE_URL}/case-studies`,
            name: 'B2B Outbound Case Studies',
            description: 'Four GTMx client engagements, each written up with the campaign data behind it.',
            type: 'CollectionPage',
          }),
          breadcrumbNode(`${SITE_URL}/case-studies`, [
            ['Home', SITE_URL],
            ['Case studies', `${SITE_URL}/case-studies`],
          ]),
        ])}
      />
      <Navbar />
      <div className="dd">
        <main className="legal-page">
          <article className="legal-page__inner">
            <div className="legal-page__header">
              <span className="legal-page__label">// case_studies</span>
              <h1 className="legal-page__title">B2B Outbound Case Studies</h1>
              <p className="legal-page__updated">
                Four engagements, each written up with the campaign data behind it.
              </p>
            </div>

            <div className="legal-page__body">
              <p>
                Every engagement below was built and run by GTMx end to end. Most of them are
                cold email and LinkedIn work, which is our{' '}
                <a href="/services/automated-outbound">Automated Outbound</a> service.
              </p>

              {caseStudies.map(study => (
                <section key={study.slug}>
                  <h2>
                    <a href={`/case-studies/${study.slug}`}>{study.company}</a>
                  </h2>
                  <p>
                    <strong>{study.vertical}</strong> &mdash; {study.headline}
                  </p>
                  <p>{study.problem}</p>
                  <p>
                    <a href={`/case-studies/${study.slug}`}>
                      Read the {study.company} case study
                    </a>
                  </p>
                </section>
              ))}
              <p>
                Want an engagement like these? <a href="/contact">Get in touch</a> and we will map
                what it would take for your pipeline.
              </p>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  )
}
