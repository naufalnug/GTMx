import { articles } from '../data/articles'

export const dynamic = 'force-static'

export default function sitemap() {
  const articleEntries = articles.map(article => ({
    url: `https://gtmx.run/content/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    {
      url: 'https://gtmx.run',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://gtmx.run/content',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...articleEntries,
  ]
}
