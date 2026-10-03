import { test, expect } from '@playwright/test'

const ROUTES = [
  ['home', '/'],
  ['about', '/about'],
  ['service', '/services/revops'],
  ['post', '/blog/using-ai-to-build-your-first-outbound-pipeline'],
  ['engagements', '/engagements'],
]

for (const [name, path] of ROUTES) {
  test(`${name} renders unchanged`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' })
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, animations: 'disabled' })
  })
}

/* Behavioural checks. These are the interactions a bundling change is most
   likely to break, and the brief asks for them explicitly. */
test('method tabs switch panels', async ({ page }) => {
  await page.goto('/')
  // Scoped to #method: the FAQ tab row reuses the .method-tabs class.
  const tabs = page.locator('#method .method-tabs .mtab')
  await expect(tabs).toHaveCount(3)
  await tabs.nth(1).click()
  await expect(tabs.nth(1)).toHaveClass(/is-active/)
  await expect(page.locator('.mpanel.is-active')).toHaveCount(1)
})

test('faq accordion opens', async ({ page }) => {
  await page.goto('/')
  // Item 0 is open by default, so clicking it would close it. Use item 1.
  const items = page.locator('.faq-panel.is-active .faq-item')
  await items.nth(1).locator('button.faq-q').click()
  await expect(items.nth(1)).toHaveClass(/open/)
})

test('service faq accordion opens', async ({ page }) => {
  await page.goto('/services/revops')
  const first = page.locator('.faq-item').first()
  await first.locator('button.faq-q').click()
  await expect(first).toHaveClass(/open/)
  await expect(first.locator('.faq-a__in')).toBeVisible()
})

test('booking CTA reaches the booking section', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#book')).toHaveCount(1)
  await expect(page.locator('#cal-inline-booking')).toHaveCount(1)
})
