'use client'

import '../home.css'
import '../privacy/page.css'
import Navbar from '../../components/home/Navbar'
import Footer from '../../components/home/Footer'
import BookingFallback from '../../components/BookingFallback'
import { useDeferredCalEmbed } from '../../components/useDeferredCalEmbed'

/* Fallback booking page. Every fact here is already published on the site:
   data/faq.js (free 30-minute audit, no pitch), app/contact/page.jsx and
   app/engagements/page.jsx (what the call covers), components/home/Hero.jsx
   (who it is for). Nothing new is asserted.

   Metadata lives in layout.jsx because this is a client component (the Cal embed
   needs an effect). noindex,follow per decision D5: this duplicates the booking
   section already on / and the three service pages, so indexing it would compete
   with them. It is deliberately NOT disallowed in robots.txt, because a crawler
   has to be able to read the noindex tag. */
export default function BookPage() {
  useDeferredCalEmbed({
    elementId: 'book-cal-embed',
    calLink: 'team/gtmx/initial-consultation-call',
    namespace: 'book',
    forwardQueryParams: true,
    uiConfig: { hideEventTypeDetails: false, layout: 'month_view' },
  })

  return (
    <>
      <Navbar />
      <div className="dd">
        <main className="legal-page">
          <article className="legal-page__inner">
            <div className="legal-page__header">
              <span className="legal-page__label">// book</span>
              <h1 className="legal-page__title">Book a Free GTM Audit</h1>
            </div>

            <div className="legal-page__body">
              <p className="eng-answer">
                GTMx runs a free 30-minute GTM audit for B2B SaaS companies and agencies. On the call
                GTMx maps what it would take to build your outbound, RevOps or search engine, and shows
                you where the pipeline is. No pitch, no obligation, and no charge.
              </p>

              <h2>Pick a time</h2>
              <div className="booking" id="book">
                <div className="booking__frame">
                  <div id="book-cal-embed" className="booking__cal"></div>
                </div>
                <BookingFallback />
              </div>

              <h2>Prefer to write first?</h2>
              <p>
                Email <a href="mailto:hello@gtmx.run">hello@gtmx.run</a>, or read{' '}
                <a href="/engagements">how GTMx engagements work</a> before you book. Past work is
                written up in the <a href="/case-studies">case studies</a>.
              </p>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  )
}
