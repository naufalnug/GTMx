import { updatePasswordAction } from '../actions';
import '../portal.css';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({ searchParams }) {
  const query = await searchParams;
  return <main className="portal-centered"><form action={updatePasswordAction} className="login-card portal-form"><p className="portal-kicker">Secure your account</p><h1>Choose a new password</h1>{query?.error ? <p className="portal-alert">Use at least 10 characters and try again.</p> : null}<label>New password<input name="password" type="password" minLength="10" autoComplete="new-password" required /></label><button className="portal-button" type="submit">Update password</button></form></main>;
}
