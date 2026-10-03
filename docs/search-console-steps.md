# Search Console and post-deploy steps

For you to do by hand after the `/content` to `/blog` move deploys. I cannot do any of these.

## Do immediately after deploy

1. **Confirm the redirects are live on production**, not just locally:
   ```
   curl -sI https://gtmx.run/content | grep -i '^HTTP\|^location'
   curl -sI https://gtmx.run/content/the-250k-mistake-hiring-us-vp-sales-too-early | grep -i '^HTTP\|^location'
   ```
   Both must be `301` with a `Location` pointing straight at the `/blog` URL. The second must go
   **directly** to `/blog/the-250k-mistake-hiring-vp-sales-first`, not via the old slug.

2. **Resubmit the sitemap** in Search Console: Indexing > Sitemaps > `https://gtmx.run/sitemap.xml`.
   It now lists `/blog` and the three posts at their new URLs, and no `/content` URL.

3. **URL Inspection** on three URLs, and request indexing for each:
   - `https://gtmx.run/blog`
   - `https://gtmx.run/blog/the-250k-mistake-hiring-vp-sales-first` (moved AND renamed)
   - `https://gtmx.run/book` (expect "Excluded by noindex tag" — that is correct and intended)

4. **Run the four verifiers against production**, which is the only way to test the CMS path:
   ```
   BASE=https://gtmx.run npm run verify:low
   BASE=https://gtmx.run npm run verify:medium
   BASE=https://gtmx.run npm run verify:entity
   BASE=https://gtmx.run npm run validate:schema
   ```
   Locally `DATABASE_URL` is empty, so blog posts render from the static seed and the Neon path is
   never exercised.

## Over the following weeks

5. **Page indexing report**: watch the old `/content/*` URLs move to "Page with redirect". That is the
   expected end state, not an error. Watch `/blog/*` enter "Indexed".
6. **Performance report**: compare `/blog/*` impressions against the `/content/*` baseline. A dip for a
   few weeks is normal after a move.
7. **Do not remove the redirects.** Keep them permanently.

## Link previews

8. **LinkedIn Post Inspector** (`https://www.linkedin.com/post-inspector/`) on `https://gtmx.run/blog`
   and one post. LinkedIn caches aggressively; the inspector forces a refresh.
9. **Draft a post on X** with a `/blog` URL and confirm the large card renders. All 18 routes carry
   `summary_large_image` with a verified 1200x630 image.

## Off-site links pointing at the old URLs

10. Update anything you control that links to `/content/*`: LinkedIn posts, newsletter archives, the
    company page, any directory listing. The 301s protect them, but a direct link is better than a
    redirect.

## IndexNow

11. The key file and script are in place and the script is **dry run by default**. To actually notify
    Bing, Yandex, Seznam and Naver after the move:
    ```
    npm run indexnow              # prints what it would send, sends nothing
    npm run indexnow -- --submit  # actually submits
    ```
    I have not run the submit form. Google does not participate in IndexNow.

## Before the partner alt text stays live

12. **Confirm each of the six partnerships is still current.** The alt text now states
    "GTMx is an official [Brand] partner" for Clay, Smartlead, Instantly, HeyReach, EmailBison and
    Trigify, on your confirmation of 2026-10-03. If any lapses, the alt must drop back to
    "[Brand] logo" and the visible "Official partners of:" label needs rewording.
