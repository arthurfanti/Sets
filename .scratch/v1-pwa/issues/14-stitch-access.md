# Stitch access repaired

Type: task
Status: resolved

## Question

Nothing to decide — the Stitch MCP is unusable until its credential works. Every call, including a bare project list, fails with:

> Request is missing required authentication credential. Expected OAuth 2 access token, login cookie or other valid authentication credential.

The configured MCP entry sends `X-Goog-Api-Key` to `https://stitch.googleapis.com/mcp` through `mcp-remote`, which is the documented API-key path, so the wiring is right and the **key itself** is dead: revoked, expired, or no longer bound to a Stitch-enabled Google Cloud project.

The Lifter must, by hand:

1. Open the Stitch settings page → **API Keys** → **Create API Key**.
2. Replace the header value in `~/.config/opencode/opencode.json` under `mcp.stitch.command` — the `X-Goog-Api-Key:…` argument. Do not paste the key into a chat.
3. Restart OpenCode so the MCP process reconnects.

Alternative if a static key is unwanted: `npx @_davideast/stitch-mcp init`, choose OAuth, which installs a bundled gcloud and writes an MCP config using `Authorization: Bearer` plus `X-Goog-User-Project`. Costs more setup and needs a token refresh.

## Answer

Resolved when `list_projects` returns without error. Record which path was taken (new API key, or OAuth) and any new project id or config detail later tickets need.

## Answer

The `X-Goog-Api-Key` credential in `~/.config/opencode/opencode.json` was replaced with a working Stitch key. Verified: `list_projects` returns the account's projects with no authentication error, so the remote MCP is usable again. No project id or config shape changed — the API-key path stayed.
