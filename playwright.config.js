import { defineConfig, devices } from '@playwright/test'

/* Visual and behavioural regression for performance work. Not part of the build.
   Run: npm run test:visual            (compares against committed snapshots)
        npm run test:visual -- -u      (updates the baseline) */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: process.env.BASE || 'http://localhost:3000' },
  expect: {
    // A lossy image re-encode shifts a few pixels; anything structural is far larger.
    toHaveScreenshot: { maxDiffPixelRatio: 0.002, threshold: 0.2 },
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
})
