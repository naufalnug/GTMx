/* ──────────────────────────────────────────────
   GTMx — components/JsonLd.jsx
   Renders a JSON-LD <script> server-side. Accepts a single
   schema object (or null, in which case nothing renders), so
   callers can pass builders that conditionally return null.
   ────────────────────────────────────────────── */

export default function JsonLd({ data }) {
  if (!data) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
