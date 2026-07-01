/* ──────────────────────────────────────────────
   GTMx — components/home/Footer.jsx
   Clean, warm footer for the redesigned homepage.
   ────────────────────────────────────────────── */

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-brand">gtmx<span className="dot"></span></span>
        <span className="footer-tag">Outbound, RevOps &amp; search &mdash; built into one engine.</span>
        <nav className="footer-links">
          <a href="/#services">Services</a>
          <a href="/#method">Method</a>
          <a href="/#work">Results</a>
          <a href="/content">Blog</a>
          <a href="/#book">Book a call</a>
        </nav>
      </div>
      <div className="footer-fine">
        <span>&copy; 2026 GTMx. All rights reserved.</span>
        <span><a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a></span>
      </div>
    </footer>
  )
}
