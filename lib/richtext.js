/**
 * Rich-text helpers shared by the admin editor (client) and the article
 * renderer (server). Pure functions only — no DOM, no Node APIs — so the same
 * module works in both environments.
 *
 * Article bodies written in the WYSIWYG editor are stored as HTML. Rows
 * created before the editor existed hold the old lightweight-markdown format;
 * `looksLikeHtml` tells the two apart and `mdToHtml` upgrades legacy bodies to
 * the same HTML the editor produces (it mirrors exactly what the old renderer
 * supported: `## ` headings, `- ` bullet lists, `**bold**`, `![alt](url)`).
 */

export function looksLikeHtml(s) {
  return /^\s*</.test(String(s || ''))
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Inline markdown for one text run: images (http(s) only), then bold.
function mdInline(s) {
  return escapeHtml(s)
    .replace(
      /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,
      (_, alt, url) => `<img src="${url}" alt="${alt}" loading="lazy">`
    )
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

export function mdToHtml(md) {
  const blocks = String(md || '').split(/\n\s*\n/)
  const out = []
  for (const block of blocks) {
    const b = block.trim()
    if (!b) continue
    if (b.startsWith('## ')) {
      out.push(`<h2>${mdInline(b.slice(3))}</h2>`)
    } else if (/^!\[[^\]]*\]\(https?:\/\/[^\s)]+\)$/.test(b)) {
      out.push(`<figure>${mdInline(b)}</figure>`)
    } else if (b.startsWith('- ')) {
      const items = b
        .split('\n')
        .map((line) => `<li>${mdInline(line.replace(/^- /, ''))}</li>`)
        .join('')
      out.push(`<ul>${items}</ul>`)
    } else {
      out.push(`<p>${mdInline(b)}</p>`)
    }
  }
  return out.join('\n')
}

/**
 * Conservative HTML sanitizer for article bodies. Only the admin can write
 * bodies (auth-gated routes), so this guards against pasted junk and
 * self-inflicted XSS rather than hostile users:
 *   - drops <script>/<style>/<iframe>/<object>/<embed>/<form> + their content
 *   - drops <link>/<meta>/<base> tags
 *   - strips on*= event-handler attributes
 *   - neutralizes javascript:/vbscript:/data: URLs in href/src (data:image/*
 *     is allowed for src so pasted inline images survive)
 * Runs on save (lib/articles.js) and again on render, so legacy rows saved
 * before sanitization existed are covered too.
 */
export function sanitizeHtml(html) {
  let s = String(html || '')
  // Tags whose content must go with them.
  s = s.replace(/<(script|style|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
  // Self-closing / stray openers or closers of the same, plus head-only tags.
  s = s.replace(/<\/?(script|style|iframe|object|embed|form|link|meta|base)\b[^>]*>/gi, '')
  // Event handlers: on*="..." / on*='...' / on*=bare
  s = s.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  // Dangerous URL schemes in href/src.
  s = s.replace(/\s+(href|src)\s*=\s*("|')?\s*(javascript|vbscript):[^"'\s>]*\2?/gi, '')
  s = s.replace(/\s+href\s*=\s*("|')?\s*data:[^"'\s>]*\1?/gi, '')
  s = s.replace(/\s+src\s*=\s*("|')?\s*data:(?!image\/)[^"'\s>]*\1?/gi, '')
  return s
}
