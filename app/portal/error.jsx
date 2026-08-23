'use client';
import './portal.css';
export default function PortalError({ reset }) { return <main className="portal-centered"><div className="login-card portal-empty"><span>!</span><h1>We couldn’t load this workspace.</h1><p>The data service may be catching up. Try again in a moment.</p><button className="portal-button" onClick={reset}>Try again</button></div></main>; }
