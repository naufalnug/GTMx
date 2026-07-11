import { cookies } from 'next/headers'
import {
  passwordMatches,
  createSessionToken,
  isAuthed,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  cookieOptions,
} from '../../../../lib/adminAuth'

export const dynamic = 'force-dynamic'

// GET -> session check. POST {password} -> sign in. DELETE -> sign out.
export async function GET() {
  return Response.json({ authenticated: await isAuthed() })
}

export async function POST(request) {
  let body = {}
  try {
    body = await request.json()
  } catch {
    /* empty body */
  }
  if (!passwordMatches(body.password)) {
    return Response.json({ error: 'Incorrect password' }, { status: 401 })
  }
  const store = await cookies()
  store.set(SESSION_COOKIE, createSessionToken(), {
    ...cookieOptions,
    maxAge: SESSION_MAX_AGE,
  })
  return Response.json({ ok: true })
}

export async function DELETE() {
  const store = await cookies()
  store.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 })
  return Response.json({ ok: true })
}
