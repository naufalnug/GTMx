import './GlowButton.css'

function GlowButton({ href, children, variant = 'primary', size = 'md', onClick }) {
  const className = `glow-btn glow-btn--${variant} glow-btn--${size}`

  if (href) {
    const isExternal = href && !href.startsWith('#')
    return (
      <a
        href={href}
        className={className}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    )
  }

  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  )
}

export default GlowButton
