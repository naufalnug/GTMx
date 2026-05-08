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
          <span style={{ color: 'var(--ink-4)' }}>LinkedIn</span>
          <span style={{ color: 'var(--ink-4)' }}>X</span>
          <span style={{ color: 'var(--ink-4)' }}>Email</span>
        </div>
        <div className="footer-copy">&copy; 2026 GTMx. All rights reserved.</div>
      </div>
    </footer>
  )
}

export default Footer
