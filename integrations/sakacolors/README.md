# Steam account deployment

The website implements the approved slide-out account panel. The COLORS change is required for safe two-way editing: the website increments `webRevision`, and the plugin refreshes connected players every five seconds while rejecting older cached writes.

## Deploy in order

1. Keep `PLAYER_COLOR_WRITES_ENABLED=false` while upgrading. Build/deploy the web application with its normal process and run `bun run db:migrate` (or `docker compose --profile tools run --rm migrate`) against the configured application database. Migration `003_player_accounts.sql` creates opaque login-state and session storage. It does not change game data.
2. Set `PUBLIC_SITE_URL` to the exact externally accessible HTTPS origin, without a path or query. In a prebuilt Nuxt deployment use `NUXT_PUBLIC_SITE_URL`; Compose maps this automatically. Steam returns to `/api/auth/steam/callback` on this origin. No Steam client secret or password is needed. The existing `STEAM_API_KEY` is optional for player names/avatars; Steam login does not depend on it.
3. Deploy `sakaCOLORS` version `26.9.11.1` to **every server sharing the colors database**. The edited source is in the sibling `saka-gg-sourcemod-plugins-init` repository. `web-revision.patch` carries the same changes for applying to its previous revision. Follow that repository's normal build process and existing migration requirements. Startup adds `webRevision INT NOT NULL DEFAULT 0` if absent, verifies its shape and fails closed if incompatible. If the plugin database account cannot ALTER, apply `web-revision.sql` during maintenance with a migration account first. The tables must remain InnoDB.
4. Confirm the website database connection points to the same schema as `sakacolors`, `sakaDONATE` and `sakastats`. Private donator reads require the current DONATE schema's `is_active` column. A missing integration produces an unavailable section, never fabricated benefits. Check plugin startup logs on every server.
5. Set `PLAYER_COLOR_WRITES_ENABLED=true` in Compose and recreate the web container. For other prebuilt deployments set `NUXT_PLAYER_COLOR_WRITES_ENABLED=true`. Keep the flag off if any old COLORS instance is still writing this database.
6. Perform a real Steam sign-in and check that the displayed identity/stats belong to that account. Test an active, permanent, revoked and expired donor. Change a tag/name/message color, confirm it appears in-game within about five seconds, then edit through `sm_scc`, finish a round, and reload the panel. Test while connected to each game server. An offline player sees saved settings on the next connection. Expiry and tier remain administrator-controlled.

## Behavior and limits

- Website mutations accept only the signed-in player's personal fields; they cannot set SteamID, tier, expiry, group ownership or staff privileges. Donator visibility on the public website has no bearing on eligibility.
- Each save checks eligibility and locks the color row in a transaction. The version token includes all personal fields and the web revision, so an intervening game or browser edit produces a reload prompt rather than silent data loss.
- A website revision wins over an older in-memory game edit. Once the plugin has refreshed it, normal in-game edits continue. The panel reads persisted game data; it does not claim game-server acknowledgement. Network outages can delay the refresh.
- Tags are plain text, at most 31 UTF-8 bytes. New colors use six-digit hex values; existing named colors can be retained. Group-default controls preserve the server's group behavior. The browser chat preview is approximate.
- Donation links use the existing support section. Clicking a link does not automatically grant or extend benefits; existing administrator/payment fulfillment remains authoritative.
- Private data uses no-store responses. Sessions expire after seven days and logout deletes the session. Login attempts expire after ten minutes. Expired records are removed in bounded batches during login. All state lives in MySQL, so multiple web instances share session/replay state.
- The login abuse bound uses the socket address, not untrusted forwarded headers. Behind a reverse proxy it is shared by that proxy (40 pending attempts per ten minutes); use an upstream rate limit for public deployments and tune this bound if legitimate peak traffic needs it.

## Rollback

Disable website color writes **before** restoring an older plugin. Leave `webRevision` in place; removing it while an updated plugin runs breaks its guarded queries. Application login tables can remain. Do not restore game data merely to remove this feature.

## Reproducible validation

Run `bun run verify` and `bun run test:e2e` in the website repository. Browser tests mock account responses and do not log into a real Steam account.

For the opt-in real-MySQL HTTP/concurrency tests, start a disposable database, then run:

```sh
docker run --rm -d --name saka-account-integration -p 127.0.0.1:33316:3306 -e MYSQL_ROOT_PASSWORD=local-account-tests -e MYSQL_DATABASE=account_tests mysql:8.4
# Wait until MySQL is ready, then:
ACCOUNT_TEST_DB_PORT=33316 bun run test -- tests/integration/player-accounts.test.js
docker stop saka-account-integration
```

The integration tests use fixed local-only test credentials/schema and a simulated Steam verification response. They exercise actual HTTP handlers and MySQL transactions, including cookie/session creation, one-use callbacks, CSRF, origin checks, logout, revocation and conflicting writes. Real Steam authentication and a running TF2 server are deployment checks, not claimed by these tests.
