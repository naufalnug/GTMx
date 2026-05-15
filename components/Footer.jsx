import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div>
          <span className="brand" style={{ color: 'var(--ink)' }}>GTMx<span className="brand-tail">_</span></span>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-3)' }}>
            Outbound revenue engineering for B2B tech companies.
          </div>
        </div>
        <div className="footer-links">
          <a href="/content">Content</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
        <div className="footer-copy">&copy; 2026 GTMx LLC. All rights reserved.</div>
      </div>
    </footer>
  )
}

export default Footer
