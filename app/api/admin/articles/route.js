import { isAuthed } from '../../../../lib/adminAuth'
import { adminListArticles, createArticle } from '../../../../lib/articles'

export const dynamic = 'force-dynamic'

function errorResponse(err) {
  // 23505 = unique_violation (duplicate slug).
  if (err?.code === '23505') {
    return Response.json({ error: 'That URL slug is already taken.' }, { status: 409 })
  }
  return Response.json({ error: err?.message || 'Request failed' }, { status: 500 })
}

export async function GET() {
  if (!(await isAuthed())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return Response.json({ articles: await adminListArticles() })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(request) {
  if (!(await isAuthed())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  let body = {}
  try {
    body = await request.json()
  } catch {
    /* empty body */
  }
  try {
    return Response.json({ article: await createArticle(body) }, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
