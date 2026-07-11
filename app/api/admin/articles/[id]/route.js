import { isAuthed } from '../../../../../lib/adminAuth'
import { adminGetArticle, updateArticle, deleteArticle } from '../../../../../lib/articles'

export const dynamic = 'force-dynamic'

function errorResponse(err) {
  if (err?.code === '23505') {
    return Response.json({ error: 'That URL slug is already taken.' }, { status: 409 })
  }
  if (err?.code === 'PGRST116') {
    return Response.json({ error: 'Article not found' }, { status: 404 })
  }
  return Response.json({ error: err?.message || 'Request failed' }, { status: 500 })
}

export async function GET(request, { params }) {
  if (!(await isAuthed())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    return Response.json({ article: await adminGetArticle(id) })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PUT(request, { params }) {
  if (!(await isAuthed())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  let body = {}
  try {
    body = await request.json()
  } catch {
    /* empty body */
  }
  try {
    return Response.json({ article: await updateArticle(id, body) })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(request, { params }) {
  if (!(await isAuthed())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    return Response.json(await deleteArticle(id))
  } catch (err) {
    return errorResponse(err)
  }
}
