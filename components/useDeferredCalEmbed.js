'use client'

import { useEffect } from 'react'

/**
 * Load the Cal.com inline booking embed, but only once its target container is
 * about to scroll into view.
 *
 * The booking calendar sits well below the fold on every page that uses it, yet
 * the official snippet loaded ~1 MB of third-party JS, spun up an iframe, and
 * set third-party cookies during the initial page load — saturating the mobile
 * main thread (LCP was ~12 s) and failing the third-party-cookie / console
 * Best-Practices audits. Deferring the load with an IntersectionObserver keeps
 * all of that off the critical path and out of the initial-load trace. The
 * `rootMargin` gives it an 800px head start so the calendar is already there by
 * the time a visitor scrolls down — the eventual rendered result is unchanged.
 *
 * @param {object}   opts
 * @param {string}   opts.namespace          Cal namespace (also the ns key).
 * @param {string}   opts.calLink            team/…/event-type link.
 * @param {string}   opts.elementId          id of the container div to fill.
 * @param {object|function} [opts.ui]        Cal `ui` config, or a function
 *                                           returning it (evaluated at load
 *                                           time, e.g. to read a CSS accent).
 * @param {boolean}  [opts.forwardQueryParams=false]
 */
export function useDeferredCalEmbed({ namespace, calLink, elementId, ui, forwardQueryParams = false }) {
  useEffect(() => {
    const el = document.getElementById(elementId)
    if (!el) return

    let started = false
    const load = () => {
      if (started) return
      started = true

      // Official Cal.com loader snippet (appends embed.js on first call).
      ;(function (C, A, L) {
        const p = function (a, ar) { a.q.push(ar) }
        const d = C.document
        C.Cal = C.Cal || function () {
          const cal = C.Cal
          const ar = arguments
          if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true }
          if (ar[0] === L) {
            const api = function () { p(api, arguments) }
            const ns = ar[1]
            api.q = api.q || []
            if (typeof ns === 'string') { cal.ns[ns] = cal.ns[ns] || api; p(cal.ns[ns], ar); p(cal, ['initNamespace', ns]) } else p(cal, ar)
            return
          }
          p(cal, ar)
        }
      })(window, 'https://app.cal.com/embed/embed.js', 'init')

      const Cal = window.Cal
      Cal('init', namespace, { origin: 'https://app.cal.com' })
      if (forwardQueryParams) { Cal.config = Cal.config || {}; Cal.config.forwardQueryParams = true }
      Cal.ns[namespace]('inline', {
        elementOrSelector: `#${elementId}`,
        config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true' },
        calLink,
      })
      const uiConfig = typeof ui === 'function' ? ui() : ui
      if (uiConfig) Cal.ns[namespace]('ui', uiConfig)
    }

    // No IntersectionObserver (very old browsers) → just load immediately.
    if (typeof IntersectionObserver === 'undefined') { load(); return }

    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) { load(); io.disconnect() } },
      { rootMargin: '800px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [namespace, calLink, elementId, ui, forwardQueryParams])
}
