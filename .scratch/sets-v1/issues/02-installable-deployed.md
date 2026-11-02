# 02: Installable and deployed

**What to build:** The same skeleton, reachable at a public URL and installable to the home screen, with cache headers correct and a pipeline that ships it. This is the ticket that proves the whole delivery path before any feature exists.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The app builds to static files and deploys to Cloudflare Pages project `sets`.
- [ ] Pushing to the default branch deploys the identical build; the manual CLI command still works as an escape hatch.
- [ ] Installed to the home screen on an iPhone, it launches standalone with no browser chrome, using the 192/512/maskable icons and the 180px touch icon.
- [ ] First load completes, then airplane mode plus a cold start still opens the app.
- [ ] Hashed assets are served immutable while the service worker, the HTML entry point and the manifest are served `no-cache`; a deployed change is detected on next launch rather than being served stale forever.
- [ ] The manifest declares standalone display, portrait orientation and the dark background and theme colours.
