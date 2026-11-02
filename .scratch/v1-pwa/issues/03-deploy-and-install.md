# Deploy target and install path

Type: grilling
Status: resolved

## Question

Where does v1 live so it can be installed on a phone, and what does the install actually look like?

- Host: GitHub Pages, Vercel, Cloudflare Pages, Netlify, or something already paid for. Constraints: HTTPS is mandatory for a service worker, SPA fallback routing must work, and there is no server-side code.
- Does this repo get a `git remote` and a CI deploy, or a manual `npm run deploy`?
- The install path on the actual phone: iOS Safari "Add to Home Screen" versus Android Chrome install prompt. Confirm the Lifter's phone, because iOS has the stricter PWA behaviour and it drives `docs/adr/0002`'s consequences.
- Custom domain, or the host's default URL? Decide whether the URL matters to the Lifter.

Answer with the host, the deploy mechanism, and the exact install steps on the Lifter's device.

## Answer

**Host: Cloudflare Pages**, project `sets`, served at `sets.pages.dev`. Deploy is `npm run build && npx wrangler pages deploy dist --project-name sets`. Pages rather than Workers-with-static-assets: there is no server logic, so the `assets` binding and a `wrangler.toml` would be machinery for nothing. Credentials already exist on this machine (`~/.wrangler`), unlike Vercel, which had none.

**Remote and CI: GitHub.** `gh` gets installed and a repo created here; CI runs the same two commands on push. The manual command stays as the escape hatch for a deploy when CI is broken. Both paths must run the identical build — no `--prod`-only differences.

**Install path (iPhone):** Safari → Share → **Add to Home Screen**. This is not a preference, it is a durability requirement: WebKit's seven-day cap on script-writable storage applies to sites not installed, and Home Screen web apps are exempt because they run outside Safari with their own usage counter. Installing is also what makes the app open standalone, which is what 0002 assumed.

**Cache policy: hashes for assets, headers for the three entry points.** Vite already content-hashes `assets/*`, so those are safe to cache immutably forever. What cannot be hashed is `sw.js` — the browser re-fetches that exact URL to detect an update, so a hash in its name would only orphan the registration — and `index.html` and `manifest.webmanifest`, which are the only unhashed URLs that point at hashed bundles. So `_headers` ships alongside the build:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/sw.js
  Cache-Control: no-cache
/index.html
  Cache-Control: no-cache
/manifest.webmanifest
  Cache-Control: no-cache
```

Hashing alone would still leave a stale `sw.js` making 02's update prompt never fire; headers alone would re-download the whole bundle on every launch. Both are needed, and they solve different problems.

**Storage hardening this ticket adds** (recorded in `0001` and owned by ticket 13): call `navigator.storage.persist()` once on first run — Safari grants it by heuristic, including whether the app is a Home Screen web app, and persistent origins are excluded from least-recently-used eviction. Still unavoidable: deleting the Home Screen icon destroys the data store, and quota or system storage pressure can evict any origin. 13's About copy must state the icon-deletion hazard plainly.
