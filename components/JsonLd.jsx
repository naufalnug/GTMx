/* Renders one JSON-LD graph as a single server-rendered script tag.
   `<` is escaped so a stray sequence in content cannot close the script early. */
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
