'use client'

/* ──────────────────────────────────────────────
   GTMx — app/admin/page.jsx
   Password-protected blog CMS. Talks to the /api/admin/* route
   handlers (cookie session). Client-only: no server data is
   imported here, so the service-role key never reaches the browser.
   ────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import './admin.css'

const EMPTY = { title: '', slug: '', status: 'draft', excerpt: '', tags: '', body: '' }

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

// ── Editor ──
function PostForm({ id, onDone }) {
  const [f, setF] = useState(EMPTY)
  const [slugTouched, setSlugTouched] = useState(Boolean(id))
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(!id)

  useEffect(() => {
    if (!id) return
    api(`/api/admin/articles/${id}`)
      .then((r) => {
        const p = r.article
        setF({
          title: p.title || '',
          slug: p.slug || '',
          status: p.status || 'draft',
          excerpt: p.excerpt || '',
          tags: (p.tags || []).join(', '),
          body: p.body || '',
        })
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

  const save = async (publish) => {
    setBusy(true)
    setErr('')
    const payload = {
      ...f,
      status: publish ? 'published' : f.status,
      tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
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
        <textarea
          className="cms-body-input"
          placeholder={
            'Write your post here.\n\nSeparate paragraphs with a blank line.\n\n## Use two hashes for a section heading\n\n- **Bold lead-in** followed by the point for list items'
          }
          value={f.body}
          onChange={set('body')}
        />
        <p className="cms-muted cms-sm cms-fmt-hint">
          Formatting: blank line = new paragraph · <code>## Heading</code> · bullet lines start with
          <code> - </code> · <code>**bold**</code>.
        </p>
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
          <h3>Details</h3>
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
            Excerpt (card + meta description)
            <textarea rows={3} value={f.excerpt} onChange={set('excerpt')} />
          </label>

          <label>
            Tags (comma separated)
            <input value={f.tags} onChange={set('tags')} placeholder="GTM, AI, Outbound" />
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
