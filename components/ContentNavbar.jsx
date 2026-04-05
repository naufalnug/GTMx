import GlowButton from './ui/GlowButton'
import './ContentNavbar.css'

function ContentNavbar() {
  return (
    <nav className="content-nav">
      <div className="content-nav__inner">
        <a href="/" className="content-nav__logo">
          GTMx<span className="content-nav__cursor">_</span>
        </a>
        <div className="content-nav__links">
          <a href="/content" className="content-nav__link">Content</a>
          <GlowButton href="/#book" size="sm">
            {'>>> Book Free Audit'}
          </GlowButton>
        </div>
      </div>
    </nav>
  )
}

export default ContentNavbar
