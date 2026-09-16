# TF2 control room

Pages: `/admin/moderation` and `/admin/operations`. Both use the existing admin visual system. Sign in through Steam from `/admin`; only `ADMIN_STEAM_IDS` can access the new backend routes. Password sessions continue to work for the previous website controls.

## Deployment

1. Set private Coolify environment variables: `ADMIN_STEAM_IDS` (comma-separated SteamID64), `PTERODACTYL_URL` (HTTPS), `PTERODACTYL_API_KEY` (Client API key, runtime only), and `TF2_SERVER_MAP` (JSON).
2. Current mapping: `{"2":"29fcc8a6","4":"e7ecd530"}`. SourceBans ID 2 is Main, ID 4 is Second.
3. Run migration `004_tf2_operations.sql` through the existing migration runner before serving the new pages. It adds one application table and does not alter SourceBans tables.
4. Deploy the web application. No game restart or plugin reload is needed.

The application uses the existing shared database and `sb_` prefix. The owner Steam identity must resolve to exactly one row in `sb_admins` to create/revoke punishments. New API routes never return RCON or Pterodactyl credentials. Scope the Pterodactyl key to the deployment host's egress IP. A Client key inherits its account's server permissions; use a dedicated Pterodactyl subuser if additional account isolation is needed later.

## Moderation behavior

- Steam2, Steam3 and Steam64 inputs normalize to one identity. Names are display data, never action targets.
- Ban, mute, gag and silence records use the existing SourceBans schema. Silence creates separate voice/chat records, and durations are stored in seconds.
- Database persistence precedes live enforcement. The response reports each server as `sent`, `not-connected`, or `unconfirmed`. `sent` means RCON accepted a command, not that plugin behavior was independently observed.
- Reconcile reads current database state before delivery. It can reapply an active punishment or remove a revoked/expired one; overlapping active records remain enforced.
- A kick rechecks the Steam identity against the live player list. It is not retried automatically.
- Every mutation gets a durable operation UUID. Repeating an already completed request returns its recorded result; an incomplete request is never blindly replayed. An interrupted process can leave `started` status; inspect current state before submitting a new action.
- Native SourceBans and game plugins can also write to the database. The panel's named lock serializes its own actions, not those external writers.
- Legacy IP bans remain managed by the official SourceBans panel. This control room creates Steam-based punishments and preserves all existing history.

## Files and operations

Editable roots are `/tf/cfg` and `/tf/addons/sourcemod/configs`. Supported file extensions are `.cfg`, `.txt`, `.ini`, and `.json`; the editor is limited to 256 KB. Simple quoted cvars get structured inputs alongside the raw editor and change preview.

Saving verifies the loaded SHA-256 revision, writes a hidden sibling backup, verifies that backup, rechecks the source revision, writes the file, and reads it back. Backups use `.saka-backup-<operation UUID>-<filename>` and remain accessible through Pterodactyl. The current editing session offers rollback; operation results also retain the backup path. Rollback itself backs up the file it replaces. Saving never executes a config or restarts a server.

Pterodactyl has no conditional file-write API. Another tool can still change a file between the final revision check and write; avoid concurrent edits during a save. Pterodactyl file access inherits its filesystem/symlink behavior.

Console commands are explicitly reviewed and sent to Pterodactyl; observe their output in its live console. Start/stop/restart requires typing the selected SourceBans server ID. Backup creation is asynchronous; refresh the list to see completion. Full server-backup restoration remains in Pterodactyl.

## Verification

Tests cover allowlist checks, Steam normalization, path validation, RCON packet splitting/auth failures/timeouts, SourceBans silence records and partial delivery, identity-based kicking, operation replay protection, config conflicts, verified backup ordering, and ambiguous writes. Browser flows can be exercised against isolated fixture responses without affecting real players.

SourceBans web panel is 2.0.3 / schema 810. Existing game plugins remain 1.8.0 until a planned maintenance window; the control room uses their existing RCON commands.
