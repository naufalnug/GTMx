import { articles } from '../data/articles'
import { services } from '../data/services'
import { caseStudies } from '../data/caseStudies'
import { absoluteUrl } from '../lib/seo'

export const dynamic = 'force-static'

export default function sitemap() {
  const serviceEntries = services.map(service => ({
    url: absoluteUrl(`/services/${service.slug}`),
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const caseStudyEntries = caseStudies.map(study => ({
    url: absoluteUrl(`/case-studies/${study.slug}`),
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const articleEntries = articles.map(article => ({
    url: absoluteUrl(`/content/${article.slug}`),
    lastModified: new Date(article.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    {
      url: absoluteUrl('/'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteUrl('/content'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...serviceEntries,
    ...caseStudyEntries,
    ...articleEntries,
  ]
}
