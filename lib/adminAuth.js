import crypto from 'node:crypto'
import { cookies } from 'next/headers'

/**
 * Single-admin auth for the /admin CMS. The password is checked, then a short
 * HMAC-signed token is stored in an httpOnly cookie — no database, no external
 * dependency beyond Node's built-in crypto.
 *
 * A built-in default password keeps /admin working out of the box. SECURITY:
 * if this repo is public, override it by setting ADMIN_PASSWORD (and ideally
 * ADMIN_SESSION_SECRET) in Vercel → Settings → Environment Variables.
 */
const DEFAULT_ADMIN_PASSWORD = 'GTMxRankedtag@1122'

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD
const SECRET = process.env.ADMIN_SESSION_SECRET || ADMIN_PASSWORD

export const SESSION_COOKIE = 'gtmx_admin'
export const SESSION_MAX_AGE = 60 * 60 * 12 // 12h, in seconds

function sign(value) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('base64url')
}

/** Constant-time password comparison. */
export function passwordMatches(input) {
  const a = Buffer.from(String(input ?? ''))
  const b = Buffer.from(ADMIN_PASSWORD)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export function createSessionToken() {
  const payload = `admin.${Date.now() + SESSION_MAX_AGE * 1000}`
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token) {
  if (!token) return false
  const parts = String(token).split('.')
  if (parts.length !== 3) return false
  const [role, exp, sig] = parts
  const expected = sign(`${role}.${exp}`)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false
  return role === 'admin' && Number(exp) > Date.now()
}

/** Reads the session cookie (async in Next 15+) and validates it. */
export async function isAuthed() {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
}
