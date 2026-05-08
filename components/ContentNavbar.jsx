import './ContentNavbar.css'

function ContentNavbar() {
  return (
    <nav className="content-nav">
      <div className="content-nav__inner">
        <a href="/" className="content-nav__logo">
          <span className="brand">GTMx<span className="brand-tail">_</span></span>
        </a>
        <div className="content-nav__links">
          <a href="/content" className="content-nav__link">Content</a>
          <a href="/#book" className="btn btn-primary btn-sm">
            Book Free Audit
          </a>
        </div>
      </div>
    </nav>
  )
}

export default ContentNavbar
