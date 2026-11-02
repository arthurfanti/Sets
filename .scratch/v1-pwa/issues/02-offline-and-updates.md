# Offline, install and update behaviour

Type: grilling
Status: resolved
Blocked by: 01

## Question

The app is used in a gym with bad signal, and it must not fail to open.

- `vite-plugin-pwa` with a Workbox precache, or a hand-written service worker? Weigh the plugin's generated manifest against owning ~40 lines we understand.
- What is precached: everything (small app), or app shell plus lazy chunks? What is the offline failure mode if a chunk is missing?
- How do updates land — silently on next open, or a prompt? What happens if a Session is active when a new version is ready?
- The `manifest.webmanifest` fields this implies (defer the visual identity itself to the identity ticket).

Answer with one update policy, stated as user-visible behaviour: what the Lifter sees the day after a release.

## Answer

**`vite-plugin-pwa` with `generateSW` (Workbox).** The plugin generates the precache manifest from the build and provides the update plumbing; there are no runtime caching rules to express, so `injectManifest` or a hand-rolled worker would only hand us the stale-cache bugs that hand-rolled workers develop.

**Precache everything**, with `navigateFallback: 'index.html'` and **zero runtime caching rules** — the app makes no network requests at all. One completed first load makes the app permanently usable offline. HashRouter means the fallback never depends on server-side rewrite support either, which keeps ticket 03's choice of host unconstrained.

**Updates are prompted, never silent, and never mid-Session.** A muted banner reads "Nova versão disponível" with an "Atualizar" action; the waiting worker activates only on tap. While a Session is active the banner is suppressed entirely and appears only after **Finalizar** or **Descartar**. Every Set is already persisted, so a reload loses no data — but blanking the screen between Sets is the wrong second to choose. The waiting worker also makes the swap atomic, which is what prevents the old-index/new-chunk white screen after a deploy.

No ADR: the policy is a setting in one config file, reversible in a minute.
