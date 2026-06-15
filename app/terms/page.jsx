import Navbar from '../../components/home/Navbar'
import Footer from '../../components/home/Footer'
import '../home.css'
import '../privacy/page.css'

export const metadata = {
  title: 'Terms of Service | GTMx',
  description: 'GTMx terms of service — the terms governing use of our website and services.',
}

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <div className="dd">
        <main className="legal-page">
          <article className="legal-page__inner">
            <div className="legal-page__header">
              <span className="legal-page__label">// terms_of_service</span>
              <h1 className="legal-page__title">Terms of Service</h1>
              <p className="legal-page__updated">Last updated: May 15, 2026</p>
            </div>

            <div className="legal-page__body">
              <p>
                These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the website
                gtmx.run (the &ldquo;Site&rdquo;) operated by GTMx LLC (&ldquo;GTMx,&rdquo; &ldquo;we,&rdquo;
                &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By accessing or using the Site, you agree to be bound
                by these Terms.
              </p>

              <h2>1. Services</h2>
              <p>
                GTMx provides outbound revenue engineering services for B2B technology companies, including
                cold email infrastructure, LinkedIn outbound, lead enrichment, and GTM workflow engineering.
                Service engagements are governed by separate agreements between GTMx and the client.
              </p>

              <h2>2. Use of the Site</h2>
              <p>You agree to use the Site only for lawful purposes. You may not:</p>
              <ul>
                <li>Use the Site in any way that violates applicable laws or regulations</li>
                <li>Attempt to gain unauthorized access to any part of the Site or its systems</li>
                <li>Use the Site to transmit malicious code, spam, or harmful content</li>
                <li>Scrape, crawl, or otherwise extract data from the Site without our written consent</li>
              </ul>

              <h2>3. Intellectual Property</h2>
              <p>
                All content on the Site, including text, graphics, logos, and software, is the property of
                GTMx LLC or its licensors and is protected by intellectual property laws. You may not reproduce,
                distribute, or create derivative works from any content on the Site without our prior written
                consent.
              </p>

              <h2>4. Third-Party Services</h2>
              <p>
                The Site integrates with third-party services such as Cal.com for scheduling. Your use of
                these services is subject to their respective terms and privacy policies. We are not
                responsible for the practices of third-party service providers.
              </p>

              <h2>5. Disclaimer of Warranties</h2>
              <p>
                The Site and its content are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
                warranties of any kind, either express or implied. GTMx does not warrant that the Site will be
                uninterrupted, error-free, or free of harmful components.
              </p>

              <h2>6. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, GTMx LLC shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages arising out of or related to your
                use of the Site or our services, regardless of the theory of liability.
              </p>

              <h2>7. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless GTMx LLC, its officers, directors, and employees
                from any claims, damages, or expenses arising from your use of the Site or violation of
                these Terms.
              </p>

              <h2>8. Governing Law</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of the United States.
                Any disputes arising under these Terms shall be resolved in the courts of competent
                jurisdiction.
              </p>

              <h2>9. Changes to These Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. Changes will be posted on this page
                with an updated revision date. Your continued use of the Site after changes constitutes
                acceptance of the revised Terms.
              </p>

              <h2>10. Contact Us</h2>
              <p>
                If you have questions about these Terms, contact us at:
              </p>
              <p>
                <strong>GTMx LLC</strong><br />
                Email: hello@gtmx.run
              </p>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  )
}
