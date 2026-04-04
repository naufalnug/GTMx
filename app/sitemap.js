export const dynamic = 'force-static'

export default function sitemap() {
  return [
    {
      url: 'https://gtmx.run',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
