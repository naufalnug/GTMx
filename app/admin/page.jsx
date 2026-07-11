'use client'

/* ──────────────────────────────────────────────
   GTMx — app/admin/page.jsx
   Password-protected blog CMS. Talks to the /api/admin/* route
   handlers (cookie session). Client-only: no server data is
   imported here, so no secrets ever reach the browser.

   The post body is edited as rich HTML (contenteditable WYSIWYG with
   an HTML source toggle) and stored as HTML. Legacy posts written in
   the old lightweight-markdown format are upgraded on open via
   mdToHtml. SEO fields (meta title/description, canonical, custom
   JSON-LD), FAQs, and cover/OG images live in the sidebar.
   ────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import { looksLikeHtml, mdToHtml, sanitizeHtml } from '../../lib/richtext'
import './admin.css'

const EMPTY = {
  title: '',
  slug: '',
  status: 'draft',
  excerpt: '',
  tags: '',
  body: '',
  coverImage: '',
  coverAlt: '',
  ogImage: '',
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  customSchema: '',
  faqs: [],
}

// Re-encode png/jpeg to WebP in the browser before upload (smaller files,
// same quality budget). Anything already compact (webp/avif/gif/svg) — or a
// conversion that comes out larger — passes through untouched.
async function toWebP(file) {
  if (!/^image\/(png|jpeg)$/.test(file.type || '')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.getContext('2d').drawImage(bitmap, 0, 0)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
    if (blob && blob.size < file.size) {
      const name = (file.name || 'image').replace(/\.[^.]+$/, '') + '.webp'
      return new File([blob], name, { type: 'image/webp' })
    }
  } catch {
    /* canvas unsupported or decode failed — upload the original */
  }
  return file
}

// Uploads an image to Vercel Blob via the auth-gated route and returns its URL.
// Uses raw fetch (not api()) so the browser sets the multipart boundary itself.
async function uploadImage(rawFile) {
  const file = await toWebP(rawFile)
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    credentials: 'same-origin',
    body: fd,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `Upload failed (${res.status})`)
  return body.url
}

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function api(path, init) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`)
  return body
}

const Wordmark = () => (
  <span className="cms-mark">
    gtm<span className="cms-mark-x">x</span>
    <span className="cms-mark-dot" />
  </span>
)

// ── Login ──
function Login({ onIn }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: pw }) })
      onIn()
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="cms-auth">
      <form className="cms-auth-card" onSubmit={submit}>
        <Wordmark />
        <h1>CMS sign in</h1>
        <p className="cms-sub">Manage the GTMx blog</p>
        <input
          type="password"
          placeholder="Admin password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
        />
        {err && <div className="cms-err">{err}</div>}
        <button className="cms-btn cms-btn-primary" disabled={busy || !pw}>
          {busy ? 'Checking…' : 'Sign in →'}
        </button>
      </form>
    </div>
  )
}

// ── Post list ──
function PostList({ onNew, onEdit, onLogout }) {
  const [posts, setPosts] = useState(null)
  const [err, setErr] = useState('')

  const load = useCallback(() => {
    api('/api/admin/articles')
      .then((r) => setPosts(r.articles))
      .catch((e) => setErr(e.message))
  }, [])
  useEffect(load, [load])

  const del = async (id) => {
    if (!window.confirm('Delete this post permanently?')) return
    try {
      await api(`/api/admin/articles/${id}`, { method: 'DELETE' })
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="cms-wrap">
      <header className="cms-top">
        <div className="cms-top-brand">
          <Wordmark />
          <span className="cms-top-label">CMS</span>
        </div>
        <div className="cms-top-actions">
          <button className="cms-btn cms-btn-primary" onClick={onNew}>+ New post</button>
          <button className="cms-btn cms-btn-ghost" onClick={onLogout}>Log out</button>
        </div>
      </header>

      {err && <div className="cms-err">{err}</div>}

      {!posts ? (
        <p className="cms-muted">Loading…</p>
      ) : posts.length === 0 ? (
        <div className="cms-empty">
          <p>No posts yet.</p>
          <button className="cms-btn cms-btn-primary" onClick={onNew}>Write your first post</button>
        </div>
      ) : (
        <table className="cms-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Updated</th>
              <th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.title}</strong>
                  <div className="cms-muted cms-sm">/content/{p.slug}</div>
                </td>
                <td>
                  <span className={`cms-pill cms-pill-${p.status}`}>{p.status}</span>
                </td>
                <td className="cms-muted cms-sm">
                  {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}
                </td>
                <td className="cms-row-actions">
                  <button className="cms-btn cms-sm" onClick={() => onEdit(p.id)}>Edit</button>
                  {p.status === 'published' && (
                    <a
                      className="cms-btn cms-sm cms-btn-ghost"
                      href={`/content/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  )}
                  <button className="cms-btn cms-sm cms-btn-danger" onClick={() => del(p.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Rich text editor ──
// Uncontrolled contenteditable: content is seeded via dangerouslySetInnerHTML
// and only ever re-seeded by remounting (the parent bumps `key` when returning
// from HTML view or importing a file). Typing reports up through onChange
// without React touching the DOM, so the caret never jumps.
function RichEditor({ initialHtml, onChange, onInsertImage, imageBusy, onImport, importBusy, mode, onMode }) {
  const ref = useRef(null)

  // The contenteditable is fully uncontrolled: React renders it EMPTY (no
  // children, no dangerouslySetInnerHTML) and the content is seeded here,
  // imperatively, exactly once per mount. React 19 re-applies a
  // dangerouslySetInnerHTML whose object identity changed even when the
  // __html string is identical — and since onChange re-renders us on every
  // keystroke, that wiped each typed character. With React out of the
  // content path entirely, nothing can clobber the DOM the caret lives in.
  // Re-seeding (load, import, HTML→visual switch) happens by remounting:
  // the parent bumps `key`.
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = initialHtml
    // Emit <p> on Enter instead of the browser default <div>.
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p')
    } catch {
      /* older engines */
    }
    // Mount-only by design; `initialHtml` changes must not touch the DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exec = (cmd, arg = null) => {
    ref.current?.focus()
    document.execCommand(cmd, false, arg)
    onChange(ref.current?.innerHTML || '')
  }

  const addLink = () => {
    const url = window.prompt('Link URL (leave empty to remove the link):', 'https://')
    if (url === null) return
    if (!url || url === 'https://') exec('unlink')
    else exec('createLink', url)
  }

  // Toolbar buttons use onMouseDown+preventDefault so the text selection in the
  // editor survives the click.
  const B = ({ label, title, onRun, active }) => (
    <button
      type="button"
      className={`cms-tool${active ? ' cms-tool-active' : ''}`}
      title={title}
      onMouseDown={(e) => {
        e.preventDefault()
        onRun()
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="cms-rich">
      <div className="cms-toolbar">
        <B label="H2" title="Section heading" onRun={() => exec('formatBlock', 'h2')} />
        <B label="H3" title="Sub-heading" onRun={() => exec('formatBlock', 'h3')} />
        <B label="¶" title="Paragraph" onRun={() => exec('formatBlock', 'p')} />
        <span className="cms-tool-sep" />
        <B label={<strong>B</strong>} title="Bold" onRun={() => exec('bold')} />
        <B label={<em>I</em>} title="Italic" onRun={() => exec('italic')} />
        <B label="🔗" title="Link" onRun={addLink} />
        <span className="cms-tool-sep" />
        <B label="• List" title="Bullet list" onRun={() => exec('insertUnorderedList')} />
        <B label="1. List" title="Numbered list" onRun={() => exec('insertOrderedList')} />
        <B label="❝" title="Quote" onRun={() => exec('formatBlock', 'blockquote')} />
        <B label="</>" title="Code block" onRun={() => exec('formatBlock', 'pre')} />
        <B label="—" title="Divider" onRun={() => exec('insertHorizontalRule')} />
        <span className="cms-tool-sep" />
        <B
          label={imageBusy ? '…' : '🖼 Image'}
          title="Upload & insert image"
          onRun={onInsertImage}
        />
        <B
          label={importBusy ? '…' : '⬇ Import'}
          title="Import a .html or .md file as the post body"
          onRun={onImport}
        />
        <span className="cms-tool-spacer" />
        <B
          label="⟨⟩ HTML"
          title="Toggle HTML source view"
          active={mode === 'html'}
          onRun={() => onMode(mode === 'html' ? 'visual' : 'html')}
        />
      </div>
      <div
        ref={ref}
        className="cms-rich-area"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Write your post here…"
        onInput={() => onChange(ref.current?.innerHTML || '')}
        onBlur={() => onChange(ref.current?.innerHTML || '')}
      />
    </div>
  )
}

// ── Editor ──
function PostForm({ id, onDone }) {
  const [f, setF] = useState(EMPTY)
  const [slugTouched, setSlugTouched] = useState(Boolean(id))
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(!id)
  const [coverBusy, setCoverBusy] = useState(false)
  const [bodyImgBusy, setBodyImgBusy] = useState(false)
  const [importBusy, setImportBusy] = useState(false)
  const [mode, setMode] = useState('visual') // 'visual' | 'html'
  const [editorKey, setEditorKey] = useState(0) // bump to re-seed the contenteditable
  const coverInputRef = useRef(null)
  const bodyInputRef = useRef(null)
  const importInputRef = useRef(null)

  useEffect(() => {
    if (!id) return
    api(`/api/admin/articles/${id}`)
      .then((r) => {
        const p = r.article
        const rawBody = p.body || ''
        setF({
          title: p.title || '',
          slug: p.slug || '',
          status: p.status || 'draft',
          excerpt: p.excerpt || '',
          tags: (p.tags || []).join(', '),
          // Upgrade legacy markdown bodies to the HTML the editor speaks.
          body: rawBody && !looksLikeHtml(rawBody) ? mdToHtml(rawBody) : rawBody,
          coverImage: p.cover_image || '',
          coverAlt: p.cover_alt || '',
          ogImage: p.og_image || '',
          metaTitle: p.meta_title || '',
          metaDescription: p.meta_description || '',
          canonicalUrl: p.canonical_url || '',
          customSchema: p.custom_schema ? JSON.stringify(p.custom_schema, null, 2) : '',
          faqs: Array.isArray(p.faqs) ? p.faqs : [],
        })
        setEditorKey((k) => k + 1)
        setLoaded(true)
      })
      .catch((e) => setErr(e.message))
  }, [id])

  const set = (k) => (e) => {
    const v = e?.target ? e.target.value : e
    setF((s) => ({
      ...s,
      [k]: v,
      ...(k === 'title' && !slugTouched ? { slug: slugify(v) } : {}),
    }))
  }

  const setBody = (html) => setF((s) => ({ ...s, body: html }))

  // Uploads the chosen cover image (auto-WebP) and stores its URL on the form.
  const onCoverPick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    setCoverBusy(true)
    setErr('')
    try {
      const url = await uploadImage(file)
      setF((s) => ({ ...s, coverImage: url }))
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setCoverBusy(false)
    }
  }

  // Uploads an image (auto-WebP) and appends a figure to the body. Appending —
  // rather than splicing at a remembered caret — keeps the uncontrolled
  // contenteditable and React state trivially in sync.
  const onBodyImagePick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBodyImgBusy(true)
    setErr('')
    try {
      const url = await uploadImage(file)
      const alt = (file.name || 'image').replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
      setF((s) => ({
        ...s,
        body: `${s.body}\n<figure><img src="${url}" alt="${alt}" loading="lazy"></figure>\n<p></p>`,
      }))
      setEditorKey((k) => k + 1)
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setBodyImgBusy(false)
    }
  }

  // Import a .html/.md/.txt file as the post body (replaces current content).
  const onImportPick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (f.body.trim() && !window.confirm('Importing replaces the current post body. Continue?')) return
    setImportBusy(true)
    setErr('')
    try {
      const text = await file.text()
      let html
      if (/\.html?$/i.test(file.name || '') || looksLikeHtml(text)) {
        // Full documents → keep only what's inside <body>.
        const m = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
        html = sanitizeHtml(m ? m[1] : text)
      } else {
        html = mdToHtml(text)
      }
      setF((s) => ({ ...s, body: html }))
      setEditorKey((k) => k + 1)
      setMode('visual')
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setImportBusy(false)
    }
  }

  const setFaq = (i, k) => (e) => {
    const v = e.target.value
    setF((s) => {
      const faqs = s.faqs.slice()
      faqs[i] = { ...faqs[i], [k]: v }
      return { ...s, faqs }
    })
  }
  const addFaq = () => setF((s) => ({ ...s, faqs: [...s.faqs, { question: '', answer: '' }] }))
  const removeFaq = (i) => setF((s) => ({ ...s, faqs: s.faqs.filter((_, j) => j !== i) }))

  const save = async (publish) => {
    setBusy(true)
    setErr('')
    const payload = {
      ...f,
      status: publish ? 'published' : f.status,
      tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
      faqs: f.faqs.filter((q) => q.question.trim() && q.answer.trim()),
    }
    try {
      if (id) await api(`/api/admin/articles/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
      else await api('/api/admin/articles', { method: 'POST', body: JSON.stringify(payload) })
      onDone()
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setBusy(false)
    }
  }

  if (!loaded) return <div className="cms-wrap"><p className="cms-muted">Loading…</p></div>

  const metaDescLen = (f.metaDescription || f.excerpt).length

  return (
    <div className="cms-wrap cms-editor">
      <div className="cms-editor-main">
        <button className="cms-btn cms-btn-ghost cms-sm" onClick={onDone}>← Back</button>
        <input
          className="cms-title-input"
          placeholder="Post title"
          value={f.title}
          onChange={set('title')}
        />

        {mode === 'visual' ? (
          <RichEditor
            key={editorKey}
            initialHtml={f.body}
            onChange={setBody}
            onInsertImage={() => bodyInputRef.current?.click()}
            imageBusy={bodyImgBusy}
            onImport={() => importInputRef.current?.click()}
            importBusy={importBusy}
            mode={mode}
            onMode={setMode}
          />
        ) : (
          <div className="cms-rich">
            <div className="cms-toolbar">
              <span className="cms-muted cms-sm">Editing raw HTML</span>
              <span className="cms-tool-spacer" />
              <button
                type="button"
                className="cms-tool cms-tool-active"
                onClick={() => {
                  setEditorKey((k) => k + 1)
                  setMode('visual')
                }}
              >
                ⟨⟩ HTML
              </button>
            </div>
            <textarea
              className="cms-html-input"
              value={f.body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
            />
          </div>
        )}

        <input ref={bodyInputRef} type="file" accept="image/*" hidden onChange={onBodyImagePick} />
        <input
          ref={importInputRef}
          type="file"
          accept=".html,.htm,.md,.markdown,.txt,text/html,text/markdown,text/plain"
          hidden
          onChange={onImportPick}
        />

        {/* ── FAQs ── */}
        <div className="cms-card cms-faq-card">
          <h3>FAQs</h3>
          <p className="cms-muted cms-sm">
            Shown as a dropdown accordion at the bottom of the post and added as FAQPage schema
            for rich results. Add as many as you like.
          </p>
          {f.faqs.length === 0 && <p className="cms-muted cms-sm">No FAQs yet.</p>}
          {f.faqs.map((faq, i) => (
            <div key={i} className="cms-faq-row">
              <div className="cms-faq-fields">
                <input
                  placeholder={`Question ${i + 1}`}
                  value={faq.question}
                  onChange={setFaq(i, 'question')}
                />
                <textarea
                  rows={3}
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={setFaq(i, 'answer')}
                />
              </div>
              <button
                type="button"
                className="cms-btn cms-sm cms-btn-danger"
                onClick={() => removeFaq(i)}
                title="Remove FAQ"
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="cms-btn cms-sm" onClick={addFaq}>+ Add FAQ</button>
        </div>
      </div>

      <aside className="cms-editor-side">
        <div className="cms-card">
          <h3>Publish</h3>
          {err && <div className="cms-err">{err}</div>}
          <div className="cms-muted cms-sm">
            Status: <strong>{f.status}</strong>
          </div>
          <div className="cms-btn-col">
            <button className="cms-btn" disabled={busy} onClick={() => save(false)}>
              {busy ? 'Saving…' : 'Save draft'}
            </button>
            <button className="cms-btn cms-btn-primary" disabled={busy} onClick={() => save(true)}>
              {f.status === 'published' ? 'Update (live)' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="cms-card">
          <h3>SEO</h3>
          <label>
            URL slug
            <input
              value={f.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug')(e)
              }}
            />
          </label>
          <div className="cms-muted cms-sm">gtmx.run/content/{f.slug || '…'}</div>

          <label>
            Meta title
            <input
              value={f.metaTitle}
              onChange={set('metaTitle')}
              placeholder="Defaults to post title"
            />
          </label>

          <label>
            Meta description
            <textarea
              rows={3}
              value={f.metaDescription}
              onChange={set('metaDescription')}
              placeholder="Defaults to excerpt / first paragraph"
            />
          </label>
          <div className={`cms-muted cms-sm${metaDescLen > 160 ? ' cms-over' : ''}`}>
            {metaDescLen}/160 chars
          </div>

          <label>
            Excerpt (card + summary)
            <textarea rows={3} value={f.excerpt} onChange={set('excerpt')} />
          </label>

          <label>
            Tags (comma separated)
            <input value={f.tags} onChange={set('tags')} placeholder="seo, geo, saas" />
          </label>

          <label>
            Canonical URL (optional)
            <input
              value={f.canonicalUrl}
              onChange={set('canonicalUrl')}
              placeholder="Leave blank for default"
            />
          </label>

          <label>
            Custom JSON-LD schema (advanced)
            <textarea
              rows={5}
              className="cms-mono"
              value={f.customSchema}
              onChange={set('customSchema')}
              placeholder={'{ "@context": "https://schema.org", "@type": "HowTo", … }'}
            />
          </label>
          <div className="cms-muted cms-sm">
            Auto schema (BlogPosting + Breadcrumb) is always added. Paste extra schema.org JSON
            here to layer on FAQPage, HowTo, etc.
          </div>
        </div>

        <div className="cms-card">
          <h3>Cover image</h3>
          {f.coverImage ? (
            <div className="cms-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.coverImage} alt="Cover preview" />
              <div className="cms-cover-actions">
                <button
                  type="button"
                  className="cms-btn cms-sm"
                  disabled={coverBusy}
                  onClick={() => coverInputRef.current?.click()}
                >
                  Replace
                </button>
                <button
                  type="button"
                  className="cms-btn cms-sm cms-btn-danger"
                  onClick={() => setF((s) => ({ ...s, coverImage: '' }))}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="cms-btn cms-sm"
              disabled={coverBusy}
              onClick={() => coverInputRef.current?.click()}
            >
              {coverBusy ? 'Uploading…' : 'Upload cover (auto-WebP)'}
            </button>
          )}
          <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={onCoverPick} />

          <label>
            Cover alt text
            <input
              value={f.coverAlt}
              onChange={set('coverAlt')}
              placeholder="Describe the image"
            />
          </label>

          <label>
            OG image URL (social share)
            <input
              value={f.ogImage}
              onChange={set('ogImage')}
              placeholder="Defaults to cover image"
            />
          </label>
        </div>
      </aside>
    </div>
  )
}

export default function AdminApp() {
  const [state, setState] = useState({ view: 'loading', id: null })

  // Probe the session on mount. setState only fires inside the async callbacks
  // (never synchronously in the effect body), so there's no cascading render.
  useEffect(() => {
    let alive = true
    api('/api/admin/login')
      .then((r) => alive && setState({ view: r.authenticated ? 'list' : 'login', id: null }))
      .catch(() => alive && setState({ view: 'login', id: null }))
    return () => {
      alive = false
    }
  }, [])

  const logout = async () => {
    try {
      await api('/api/admin/login', { method: 'DELETE' })
    } catch {
      /* ignore */
    }
    setState({ view: 'login', id: null })
  }

  if (state.view === 'loading')
    return (
      <div className="cms-auth">
        <div className="cms-auth-card">
          <Wordmark />
          <p className="cms-sub">Loading…</p>
        </div>
      </div>
    )

  if (state.view === 'login')
    return <Login onIn={() => setState({ view: 'list', id: null })} />

  if (state.view === 'edit' || state.view === 'new')
    return <PostForm id={state.id} onDone={() => setState({ view: 'list', id: null })} />

  return (
    <PostList
      onNew={() => setState({ view: 'new', id: null })}
      onEdit={(id) => setState({ view: 'edit', id })}
      onLogout={logout}
    />
  )
}
