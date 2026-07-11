import { put } from '@vercel/blob'
import { isAuthed } from '../../../../lib/adminAuth'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 8 * 1024 * 1024 // 8MB
const ALLOWED = /^image\/(png|jpe?g|gif|webp|avif|svg\+xml)$/

/**
 * Auth-gated image upload for the blog CMS. Accepts a multipart `file`, stores
 * it in Vercel Blob (public), and returns its URL. The image bytes live in
 * Blob; only the URL is saved in Neon (as a post's cover_image or inline in the
 * body). Requires BLOB_READ_WRITE_TOKEN in the environment — Vercel injects it
 * automatically once a Blob store is connected to the project.
 */
export async function POST(request) {
  if (!(await isAuthed())) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let file
  try {
    const form = await request.formData()
    file = form.get('file')
  } catch {
    return Response.json({ error: 'Expected a multipart form upload' }, { status: 400 })
  }

  if (!file || typeof file === 'string') {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!ALLOWED.test(file.type || '')) {
    return Response.json({ error: 'Only image files are allowed (png, jpg, gif, webp, avif, svg).' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'Image is too large (max 8MB).' }, { status: 400 })
  }

  try {
    const blob = await put(`blog/${file.name || 'image'}`, file, {
      access: 'public',
      addRandomSuffix: true, // avoid collisions / overwrites across posts
      contentType: file.type,
    })
    return Response.json({ url: blob.url })
  } catch (err) {
    // Most common cause: BLOB_READ_WRITE_TOKEN missing / no Blob store connected.
    const msg = /token/i.test(err?.message || '')
      ? 'Upload failed — is a Vercel Blob store connected? (BLOB_READ_WRITE_TOKEN missing)'
      : err?.message || 'Upload failed'
    return Response.json({ error: msg }, { status: 500 })
  }
}
