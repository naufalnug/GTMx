import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div>
          <img src="/logo.svg" alt="GTMx" style={{ height: 20, width: 'auto' }} />
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
        <div className="footer-copy">&copy; 2026 GTMx &mdash; All rights reserved.</div>
      </div>
    </footer>
  )
}

export default Footer
