# TF2 management

Approved direction: extend the existing Nuxt control room, retain SourceBans as the punishment database and Pterodactyl as the server runtime. Do not restart game servers during implementation or verification.

## Access

Reuse Steam OpenID. Exchange an existing verified player session for an admin session only when SteamID64 is explicitly configured in ADMIN_STEAM_IDS. Check that allowlist on every authenticated request. Existing password login remains a recovery path for existing website controls; moderation and server operations require Steam owner identity. Keep CSRF and origin checks. Never infer owner permission from public player styling or SourceMod flags.

## Moderation

Read the existing sb_ tables in the application's shared database through a dedicated repository. Normalize Steam2, Steam3 and Steam64 identities. List/search bans and comms, create bans/mutes/gags/silences, revoke punishments with a reason, and kick connected players. Attribute changes to the matching SourceBans admin. SourceBans records are authoritative; issue live enforcement through private RCON using credentials already in sb_servers. Show database persistence separately from live-delivery errors. No automatic retry of ambiguous kicks. Reconcile persistent punishments explicitly after delivery failures. Use a durable operation ID to prevent duplicate submissions; audit mutations before side effects. Do not delete punishment history.

## Server operations

Map only configured SourceBans IDs to Pterodactyl server identifiers. Use the Client API through Nuxt, keeping credentials private. Provide resource status, an explicit console command form, power actions, backup list/create, and a config file browser. Restrict editing to TF2 config roots, reject traversal, and limit text size. Read/hash the current file before saving, reject stale edits, save a Pterodactyl copy before writing, and return the backup filename for rollback. Saving does not execute configs. Console and power actions require a separate review in the UI. No automatic restart or map change.

## UI and verification

Two pages within the existing visual system: Moderation and Server operations. Expose missing configuration as actionable setup state, never fake successful integration. Verify authorization, input boundaries, RCON framing, duplicate actions, partial failures, and stale config writes with focused tests. Run existing lint/typecheck/tests/build. Browser verification uses read-only production calls and a local mock for destructive flows; never punish real players as a test.

## Deployment

Migration 004 adds operation tracking only; SourceBans owns its existing schema. New private settings: ADMIN_STEAM_IDS, PTERODACTYL_URL, PTERODACTYL_API_KEY, TF2_SERVER_MAP. API keys are created only for deployment and are stored in Coolify secrets. The SourceBans web upgrade is already complete; game plugin updates remain a maintenance task.
