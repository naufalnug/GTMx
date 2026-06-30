'use client'

/**
 * Lazily initialize a Cal.com inline booking embed. The booking widget is
 * always the below-the-fold final section, so its third-party script
 * (app.cal.com/embed/embed.js) and calendar are deferred until the target
 * element nears the viewport. This keeps heavy third-party JS off initial
 * page load — cutting total blocking time / INP and speeding up the main
 * thread — with no change to markup, layout, or behavior once visible.
 */

import { useEffect, useRef } from 'react'

const CAL_NS = 'initial-consultation-call'
const CAL_LINK = 'team/gtmx/initial-consultation-call'

export function useCalEmbed({ elementId, brand = '#E8552B' }) {
  const initialized = useRef(false)

  useEffect(() => {
    const el = document.getElementById(elementId)
    if (!el) return

    const init = () => {
      if (initialized.current) return
      initialized.current = true

      // Official Cal.com embed loader snippet (appends embed.js once).
      ;(function (C, A, L) {
        let p = function (a, ar) { a.q.push(ar) }
        let d = C.document
        C.Cal = C.Cal || function () {
          let cal = C.Cal
          let ar = arguments
          if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true }
          if (ar[0] === L) {
            const api = function () { p(api, arguments) }
            const namespace = ar[1]
            api.q = api.q || []
            if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]) } else p(cal, ar)
            return
          }
          p(cal, ar)
        }
      })(window, 'https://app.cal.com/embed/embed.js', 'init')

      const calBrand = typeof brand === 'function' ? brand() : brand
      const Cal = window.Cal
      Cal('init', CAL_NS, { origin: 'https://app.cal.com' })
      Cal.config = Cal.config || {}
      Cal.config.forwardQueryParams = true
      Cal.ns[CAL_NS]('inline', {
        elementOrSelector: `#${elementId}`,
        config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true' },
        calLink: CAL_LINK,
      })
      Cal.ns[CAL_NS]('ui', {
        theme: 'light',
        cssVarsPerTheme: { light: { 'cal-brand': calBrand || '#E8552B' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      })
    }

    // No IntersectionObserver (very old browsers) → just load immediately.
    if (!('IntersectionObserver' in window)) {
      init()
      return
    }

    // Start loading ~one viewport early so it feels instant on scroll.
    const observer = new IntersectionObserver(
      entries => { if (entries.some(e => e.isIntersecting)) { init(); observer.disconnect() } },
      { rootMargin: '600px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [elementId, brand])
}
