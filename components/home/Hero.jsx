/* ──────────────────────────────────────────────
   GTMx — components/home/Hero.jsx
   Nav + headline + hand-drawn pipeline illustration.
   Server component. Big decorative SVGs are embedded
   verbatim via dangerouslySetInnerHTML to stay faithful
   to the design handoff.
   ────────────────────────────────────────────── */

const ILLO_SVG = `
<svg viewBox="0 0 1440 470" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gMintSky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C6E8D2"/><stop offset="1" stop-color="#C2CBF2"/></linearGradient>
    <linearGradient id="gLilacPink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E0C6E8"/><stop offset="1" stop-color="#F6C0AC"/></linearGradient>
    <linearGradient id="gSky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#CBD2F4"/><stop offset="1" stop-color="#9AA8EC"/></linearGradient>
    <linearGradient id="gMint" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#CDEAD6"/><stop offset="1" stop-color="#8FCBA6"/></linearGradient>
  </defs>

  <g fill="none" stroke="#1A1712" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">

    <!-- FUNNEL sweep from cluster to engine -->
    <path d="M70,250 C150,150 330,150 470,210 C560,248 600,250 640,250
             C600,250 560,252 470,290 C330,350 150,350 70,250 Z"
          fill="#ECDFC0" opacity="0.55" stroke="#1A1712" stroke-width="2.2"/>

    <!-- ===== LEFT CLUSTER ===== -->
    <!-- chat bubble -->
    <g>
      <rect x="92" y="120" width="118" height="74" rx="18" fill="#FFFDF9"/>
      <path d="M126,194 l-6,22 22,-12" fill="#FFFDF9"/>
      <circle cx="124" cy="157" r="6.5" fill="#D8B6E2"/>
      <circle cx="151" cy="157" r="6.5" fill="#D8B6E2"/>
      <circle cx="178" cy="157" r="6.5" fill="#D8B6E2"/>
    </g>

    <!-- chart card -->
    <g>
      <rect x="150" y="214" width="178" height="120" rx="20" fill="url(#gMint)"/>
      <polyline points="176,300 210,268 244,288 296,238" stroke-width="2.6"/>
      <circle cx="176" cy="300" r="3.6" fill="#1A1712"/>
      <circle cx="210" cy="268" r="3.6" fill="#1A1712"/>
      <circle cx="244" cy="288" r="3.6" fill="#1A1712"/>
      <circle cx="296" cy="238" r="3.6" fill="#1A1712"/>
      <circle cx="300" cy="312" r="15" fill="#F4ECD9"/>
      <path d="M293,312 l5,5 9,-11" stroke-width="2.4"/>
    </g>

    <!-- search / inbox card -->
    <g>
      <rect x="300" y="150" width="170" height="118" rx="20" fill="url(#gSky)"/>
      <rect x="322" y="176" width="84" height="13" rx="6.5" fill="#F6B7A2"/>
      <rect x="322" y="202" width="120" height="9" rx="4.5" fill="#FFFDF9" opacity="0.8"/>
      <rect x="322" y="221" width="96" height="9" rx="4.5" fill="#FFFDF9" opacity="0.8"/>
      <circle cx="420" cy="232" r="17" fill="#FFFDF9"/>
      <line x1="432" y1="244" x2="444" y2="256"/>
    </g>

    <!-- list/doc card -->
    <g>
      <rect x="430" y="270" width="150" height="104" rx="18" fill="#FFFDF9"/>
      <circle cx="454" cy="298" r="5.5" fill="#8FCBA6"/>
      <line x1="470" y1="298" x2="556" y2="298"/>
      <circle cx="454" cy="322" r="5.5" fill="#C49AD2"/>
      <line x1="470" y1="322" x2="548" y2="322"/>
      <circle cx="454" cy="346" r="5.5" fill="#EF9C82"/>
      <line x1="470" y1="346" x2="540" y2="346"/>
    </g>

    <!-- ===== ENGINE HEXAGON ===== -->
    <g>
      <path d="M650,250 m0,-52 l45,26 0,52 -45,26 -45,-26 0,-52 z" fill="url(#gMintSky)" stroke-width="2.6"/>
      <text x="650" y="262" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800" font-size="34" fill="#1A1712" stroke="none">x</text>
    </g>

    <!-- ===== PIPELINE LINE + NODES ===== -->
    <line x1="700" y1="250" x2="1440" y2="250" stroke="#C49AD2" stroke-width="2.2"/>
    <circle cx="785" cy="250" r="4" fill="#C49AD2" stroke="none"/>
    <circle cx="965" cy="250" r="4" fill="#C49AD2" stroke="none"/>
    <circle cx="1145" cy="250" r="4" fill="#C49AD2" stroke="none"/>
    <circle cx="1325" cy="250" r="4" fill="#C49AD2" stroke="none"/>

    <!-- TILE 1 · target (data / ICP) -->
    <g>
      <rect x="746" y="206" width="88" height="88" rx="22" fill="#FFFDF9" stroke-width="2.4"/>
      <rect x="746" y="206" width="88" height="20" rx="10" fill="#D9C9F0" stroke="none"/>
      <rect x="746" y="206" width="88" height="88" rx="22" fill="none" stroke="#1A1712" stroke-width="2.4"/>
      <circle cx="790" cy="252" r="20"/>
      <circle cx="790" cy="252" r="11"/>
      <circle cx="790" cy="252" r="3.2" fill="#1A1712"/>
    </g>
    <!-- TILE 2 · envelope (Automated Outbound) -->
    <g>
      <rect x="926" y="206" width="88" height="88" rx="22" fill="#FFFDF9"/>
      <rect x="926" y="206" width="88" height="20" rx="10" fill="#F6B7A2" stroke="none"/>
      <rect x="926" y="206" width="88" height="88" rx="22" fill="none" stroke="#1A1712" stroke-width="2.4"/>
      <rect x="948" y="238" width="44" height="32" rx="6"/>
      <path d="M948,242 l22,16 22,-16"/>
    </g>
    <!-- TILE 3 · nodes (RevOps) -->
    <g>
      <rect x="1106" y="206" width="88" height="88" rx="22" fill="#FFFDF9"/>
      <rect x="1106" y="206" width="88" height="20" rx="10" fill="#C2CBF2" stroke="none"/>
      <rect x="1106" y="206" width="88" height="88" rx="22" fill="none" stroke="#1A1712" stroke-width="2.4"/>
      <circle cx="1132" cy="244" r="8"/>
      <circle cx="1166" cy="232" r="8"/>
      <circle cx="1166" cy="266" r="8"/>
      <line x1="1139" y1="248" x2="1159" y2="234"/>
      <line x1="1139" y1="250" x2="1159" y2="263"/>
    </g>
    <!-- TILE 4 · magnifier + spark (Search) -->
    <g>
      <rect x="1286" y="206" width="88" height="88" rx="22" fill="#FFFDF9"/>
      <rect x="1286" y="206" width="88" height="20" rx="10" fill="#B6DEC4" stroke="none"/>
      <rect x="1286" y="206" width="88" height="88" rx="22" fill="none" stroke="#1A1712" stroke-width="2.4"/>
      <circle cx="1322" cy="248" r="15"/>
      <line x1="1333" y1="259" x2="1346" y2="272"/>
      <path d="M1322,240 l2.4,5 5,2.4 -5,2.4 -2.4,5 -2.4,-5 -5,-2.4 5,-2.4 z" fill="#E8552B" stroke-width="1.4"/>
    </g>
  </g>
</svg>`

export default function Hero() {
  return (
    <div className="hero">
      {/* Navigation is provided by the shared <Navbar> (components/home/Navbar.jsx),
          rendered once at the page level, so the hero no longer carries its own. */}

      {/* floating bg accents */}
      <span className="bg-accent" style={{ width: 120, height: 120, background: 'var(--mint)', top: '24%', left: '7%' }}></span>
      <span className="bg-accent" style={{ width: 90, height: 90, background: 'var(--lilac)', top: '16%', right: '12%' }}></span>

      {/* HEADLINE */}
      <div className="stage">
        <span className="eyebrow"><span className="dots"><i></i><i></i><i></i></span><span>For B2B SaaS &amp; agencies at $1M+ ARR</span></span>

        <h1 className="h1">
          Outbound, RevOps, and Search,<br />
          built into <span className="win">one engine.
            <svg viewBox="0 0 220 20" preserveAspectRatio="none"><path d="M3,13 C46,4 92,17 138,9 C170,4 200,13 217,7" fill="none" stroke="#E8552B" strokeWidth="7" strokeLinecap="round" /></svg>
          </span>
          <span className="scribble" style={{ top: '-0.62em', right: '4%' }}>no duct&nbsp;tape</span>
        </h1>

        <p className="lede">
          GTMx engineers the outbound, RevOps, and search systems that turn a
          working product into predictable pipeline — built, launched, and run for you.
        </p>

        <div className="actions">
          <a href="#services" className="btn-lg btn-lg--dark">Explore services
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
          </a>
          <a href="#book" className="btn-lg btn-lg--grad">Book a call</a>
        </div>
      </div>

      {/* ILLUSTRATION */}
      <div className="illo" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ILLO_SVG }} />
    </div>
  )
}
