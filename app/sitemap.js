import { getPublishedArticles } from '../lib/articles'
import { services } from '../data/services'
import { caseStudies } from '../data/caseStudies'
import { absoluteUrl } from '../lib/seo'
import pageDates from '../data/page-dates.json'

// Rebuilt periodically so newly published CMS posts enter the sitemap.
export const revalidate = 300

/* lastModified comes from data/page-dates.json (last git commit date of each
   page's source files, via `npm run sitemap:dates`). It used to be `new Date()`
   on every entry, i.e. build time stamped on every URL. Where a date cannot be
   determined the field is omitted entirely rather than invented. */
function entry(url, route, rest) {
  const d = pageDates[route]
  return { url, ...(d ? { lastModified: new Date(d) } : {}), ...rest }
}

export default async function sitemap() {
  const articles = await getPublishedArticles()

  const serviceEntries = services.map(service =>
    entry(absoluteUrl(`/services/${service.slug}`), '/services', {
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  )

  const caseStudyEntries = caseStudies.map(study =>
    entry(absoluteUrl(`/case-studies/${study.slug}`), '/case-study', {
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  )

  const articleEntries = articles.map(article => ({
    url: absoluteUrl(`/content/${article.slug}`),
    lastModified: new Date(article.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    entry(absoluteUrl('/'), '/', { changeFrequency: 'weekly', priority: 1 }),
    entry(absoluteUrl('/about'), '/about', { changeFrequency: 'monthly', priority: 0.7 }),
    entry(absoluteUrl('/contact'), '/contact', { changeFrequency: 'monthly', priority: 0.6 }),
    entry(absoluteUrl('/case-studies'), '/case-studies', { changeFrequency: 'monthly', priority: 0.8 }),
    entry(absoluteUrl('/content'), '/content', { changeFrequency: 'weekly', priority: 0.8 }),
    ...serviceEntries,
    ...caseStudyEntries,
    ...articleEntries,
  ]
}
