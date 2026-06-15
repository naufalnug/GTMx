import Navbar from '../../components/home/Navbar'
import Footer from '../../components/home/Footer'
import '../home.css'
import './page.css'

export const metadata = {
  title: 'Privacy Policy | GTMx',
  description: 'GTMx privacy policy — how we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div className="dd">
        <main className="legal-page">
          <article className="legal-page__inner">
            <div className="legal-page__header">
              <span className="legal-page__label">// privacy_policy</span>
              <h1 className="legal-page__title">Privacy Policy</h1>
              <p className="legal-page__updated">Last updated: May 15, 2026</p>
            </div>

            <div className="legal-page__body">
              <p>
                GTMx LLC (&ldquo;GTMx,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the website
                gtmx.run (the &ldquo;Site&rdquo;). This Privacy Policy explains how we collect, use, disclose,
                and safeguard your information when you visit our Site or engage our services.
              </p>

              <h2>1. Information We Collect</h2>

              <h3>Information you provide</h3>
              <p>
                When you book a call through our Cal.com scheduling embed, we collect your name and email address.
                If you contact us directly, we may collect any information you choose to provide in your message.
              </p>

              <h3>Information collected automatically</h3>
              <p>
                We use analytics tools to collect standard usage data, including your IP address, browser type,
                operating system, referring URLs, pages visited, and time spent on the Site. This data is collected
                through cookies and similar technologies.
              </p>

              <h2>2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Schedule and manage consultation calls</li>
                <li>Respond to your inquiries</li>
                <li>Analyze Site usage and improve our services</li>
                <li>Send relevant communications about our services (only if you have engaged with us)</li>
              </ul>
              <p>We do not sell your personal information to third parties.</p>

              <h2>3. Third-Party Services</h2>
              <p>
                Our Site uses the following third-party services that may collect data on our behalf:
              </p>
              <ul>
                <li><strong>Cal.com</strong> &mdash; for scheduling. Subject to Cal.com&apos;s privacy policy.</li>
                <li><strong>Analytics provider</strong> &mdash; for anonymous usage analytics and site performance monitoring.</li>
                <li><strong>Vercel</strong> &mdash; for hosting. Subject to Vercel&apos;s privacy policy.</li>
              </ul>

              <h2>4. Cookies</h2>
              <p>
                We use cookies and similar tracking technologies to analyze trends, administer the Site,
                and gather demographic information. You can control cookies through your browser settings.
                Disabling cookies may limit certain features of the Site.
              </p>

              <h2>5. Data Retention</h2>
              <p>
                We retain your personal information only for as long as necessary to fulfill the purposes
                described in this policy, or as required by law. Booking data is retained for the duration
                of our business relationship and a reasonable period thereafter.
              </p>

              <h2>6. Your Rights</h2>
              <p>
                Depending on your location, you may have the right to:
              </p>
              <ul>
                <li>Access the personal data we hold about you</li>
                <li>Request correction or deletion of your data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Request a portable copy of your data</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p>
                If you are located in the European Economic Area (EEA), you have rights under the General Data
                Protection Regulation (GDPR). To exercise any of these rights, contact us at the email below.
              </p>

              <h2>7. Data Security</h2>
              <p>
                We implement reasonable technical and organizational measures to protect your personal
                information. However, no method of transmission over the Internet is 100% secure, and we
                cannot guarantee absolute security.
              </p>

              <h2>8. Children&apos;s Privacy</h2>
              <p>
                Our Site is not directed to individuals under the age of 18. We do not knowingly collect
                personal information from children.
              </p>

              <h2>9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted on this page
                with an updated revision date. Your continued use of the Site after changes constitutes
                acceptance of the revised policy.
              </p>

              <h2>10. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or wish to exercise your data rights,
                contact us at:
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
