import Image from 'next/image';
import { loginAction, requestResetAction } from '../actions';
import '../portal.css';

export const metadata = { title: 'Client portal · GTMx', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }) {
  const query = await searchParams;
  return (
    <main className="portal-login">
      <section className="login-story" aria-label="GTMx client portal introduction">
        <a className="login-brand" href="/" aria-label="GTMx home"><Image src="/logo.svg" alt="GTMx" width={116} height={36} priority /></a>
        <div>
          <span className="portal-kicker">Client workspace</span>
          <h1>Your outbound engine, <span>in one place.</span></h1>
          <p>Campaign performance, the copy that is live, every positive lead, and your master inbox.</p>
        </div>
        <div className="login-proof"><span>Live campaign data</span><span>Private by client</span><span>Built by GTMx</span></div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div><p className="portal-kicker">Welcome back</p><h2>Sign in to your workspace</h2><p className="portal-muted">Use the client credentials provided by GTMx.</p></div>
          {query?.error === 'credentials' ? <p className="portal-alert" role="alert">That email or password is not correct.</p> : null}
          {query?.error === 'access' ? <p className="portal-alert" role="alert">This workspace is inactive. Contact your GTMx operator.</p> : null}
          {query?.error === 'link' ? <p className="portal-alert" role="alert">That recovery link is invalid or expired.</p> : null}
          {query?.reset === 'sent' ? <p className="portal-success" role="status">If the account exists, a recovery email is on its way.</p> : null}
          <form action={loginAction} className="portal-form">
            <label>Email<input name="email" type="email" autoComplete="username" required placeholder="client@company.com" /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
            <button className="portal-button" type="submit">Sign in <span aria-hidden="true">→</span></button>
          </form>
          <details className="reset-disclosure"><summary>Forgot your password?</summary><form action={requestResetAction}><label>Account email<input name="email" type="email" required /></label><button className="portal-button portal-button--quiet" type="submit">Send recovery email</button></form></details>
        </div>
      </section>
    </main>
  );
}
