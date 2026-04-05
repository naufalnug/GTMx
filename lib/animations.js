import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function animateSection(sectionEl) {
  if (!sectionEl) return

  // Fade up the section header
  const header = sectionEl.querySelector('[data-animate="fade-up"]')
  if (header) {
    gsap.from(header, {
      y: 50,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: header,
        start: 'top 85%',
        once: true,
      },
    })
  }

  // Stagger cards/items
  const staggerParent = sectionEl.querySelector('[data-animate="stagger"]')
  if (staggerParent) {
    const children = staggerParent.children
    gsap.from(children, {
      y: 50,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: staggerParent,
        start: 'top 80%',
        once: true,
      },
    })
  }

  // Individual fade-up elements
  const fadeUps = sectionEl.querySelectorAll('[data-animate="fade-up-item"]')
  fadeUps.forEach(el => {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    })
  })

  // Counter animation for stat numbers
  const counters = sectionEl.querySelectorAll('[data-animate="counter"]')
  counters.forEach(el => {
    const target = el.textContent
    const numMatch = target.match(/^(\d+)/)
    if (numMatch) {
      const endVal = parseInt(numMatch[1])
      const suffix = target.replace(numMatch[1], '')
      const obj = { val: 0 }
      gsap.to(obj, {
        val: endVal,
        duration: 1.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
        onUpdate: () => {
          el.textContent = Math.round(obj.val) + suffix
        },
      })
    }
  })
}

export function animateHeroText(containerEl) {
  if (!containerEl) return

  const elements = containerEl.querySelectorAll('[data-animate="hero-reveal"]')
  gsap.from(elements, {
    y: 30,
    opacity: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power3.out',
    delay: 0.3,
  })
}

export function initParallax() {
  const orbs = document.querySelectorAll('.gradient-orb')
  orbs.forEach(orb => {
    gsap.to(orb, {
      y: () => ScrollTrigger.maxScroll(window) * 0.05,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
    })
  })
}
