# Dodgeball Platform Modernization Implementation Plan

Design reference: `docs/superpowers/specs/2026-09-04-modernization-discord-worker-redesign-design.md`

## Delivery rules

- Preserve all pre-existing user changes and inspect overlapping diffs before editing.
- Keep every milestone buildable; do not defer compatibility repairs to the end.
- Use Bun as the sole package manager and commit only `bun.lock`.
- Keep secrets environment-only and never print their values in tests or diagnostics.
- Do not publish to Discord during automated tests.
- Run focused tests after each task and the full verification suite at each milestone.

## Milestone 1: Baseline, tests, and secure administration

### Task 1.1 — Record and verify the baseline

- Capture the current dirty-worktree file list and distinguish user edits from project changes.
- Run the existing type check and production build.
- Record current dependency-audit and runtime failures in the migration notes.
- Inventory imports before removing any dead component, composable, endpoint, or script.

Verification:

- `bun run type-check`
- `bun run build`
- `bun audit`

### Task 1.2 — Add the test and quality toolchain

- Add Vitest with Nuxt-compatible configuration for unit and server tests.
- Add Playwright for browser and visual tests.
- Add ESLint using Nuxt's supported configuration.
- Add deterministic scripts for lint, unit tests, integration tests, browser tests, type checking, and combined CI verification.
- Add initial smoke tests for public rendering and existing pure utilities.

Verification:

- `bun run lint`
- `bun run test:unit`
- `bun run type-check`

### Task 1.3 — Replace forgeable admin authentication

- Add a server-only signed-session utility using Web Crypto/Node crypto.
- Issue expiring HttpOnly, SameSite=Strict cookies with Secure enabled in production.
- Add CSRF token generation and verification for all mutating admin requests.
- Add same-origin validation and bounded login rate limiting.
- Centralize API authorization and remove repeated literal-cookie checks.
- Add global admin route middleware and remove page-local inconsistent checks.
- Update the admin composable to send CSRF headers and handle expiration consistently.
- Add security-focused unit and API tests.

Verification:

- Forged legacy cookies fail.
- Anonymous admin reads/writes fail.
- Authenticated reads succeed.
- Mutations without a valid CSRF token fail.
- Login, session expiry, and logout tests pass.

## Milestone 2: Runtime and dependency migration

### Task 2.1 — Standardize runtimes and package management

- Update `.nvmrc`, package engines, Docker base image, and documentation to Node.js 24 LTS.
- Pin the Bun version through `packageManager` and container/CI configuration.
- Remove `package-lock.json` where present in migrated bot material and keep only `bun.lock`.
- Replace transient tool installation with explicit development dependencies.

### Task 2.2 — Remove obsolete dependencies and build workarounds

- Remove `@nuxt/typescript-build`, direct `ipx`, unused `tsx`, and unused direct `defu`, `ofetch`, and `ufo` dependencies.
- Move GameDig into runtime dependencies.
- Remove stale Vite object-form `manualChunks`, deprecated CSS minification, obsolete experimental flags, and unnecessary Nitro inlining.
- Make Nuxt devtools development-only.

### Task 2.3 — Upgrade framework and runtime dependencies

- Upgrade Nuxt, Vue, Vue Router, Nuxt Image, MySQL, GameDig, GSAP, TypeScript, Vue TypeScript tooling, and Node types to their current mutually compatible stable releases.
- Run Nuxt's deduplication/upgrade process and repair changed APIs or generated types.
- Validate Nuxt Image behavior for local and remote images.

### Task 2.4 — Migrate Tailwind CSS 3 to 4

- Replace the legacy Nuxt Tailwind module with Tailwind's supported Vite integration.
- Convert CSS entry points and theme configuration to Tailwind 4 conventions.
- Update incompatible utilities and `@apply` usage.
- Remove redundant PostCSS/autoprefixer configuration and dependencies when no longer required.

Verification for milestone:

- Frozen install succeeds.
- Lint, unit tests, strict type check, and production build pass.
- Dependency audit has no unaccepted high or critical findings.
- Existing public/admin routes render without runtime errors.

## Milestone 3: Persistence and API foundations

### Task 3.1 — Add explicit database migrations

- Add the migration runner and `app_migrations` tracking.
- Add migrations for `app_settings`, `game_servers`, `discord_bot_settings`, `discord_bot_jobs`, `discord_bot_runtime`, `discord_status_messages`, and `admin_audit_events`.
- Add idempotent import of current JSON settings and server records.
- Add migration, status, and export/backup commands.

### Task 3.2 — Replace the global connection with repositories and pools

- Create validated runtime database configuration with consistent variable names.
- Introduce a MySQL pool with graceful shutdown and safe diagnostics.
- Add focused repositories for settings, servers, donors, bot settings/jobs/runtime, and audit events.
- Add transaction support and migrate donor writes to atomic transactions.
- Remove donor and player N+1 queries where batch/join queries apply.

### Task 3.3 — Consolidate settings and server state

- Make MySQL authoritative for site settings and canonical TF2 server definitions.
- Expose only sanitized public settings.
- Remove the `/data` public asset mapping and data-copy scripts.
- Remove runtime writes to built source files.
- Keep explicit safe defaults for first-run/degraded behavior without fake user data.

### Task 3.4 — Normalize API contracts and caching

- Introduce typed response/error helpers.
- Return correct HTTP validation, authorization, not-found, conflict, and service-unavailable statuses.
- Replace fake leaderboard/donor fallbacks with empty or stale-real-data responses.
- Add in-flight GameDig query deduplication and bounded timeouts.
- Replace two-second client polling with server-controlled refresh timing.
- Prevent transient `checking` state from being cached as stable data.

Verification for milestone:

- Migrations apply twice without duplicate effects.
- Repository integration tests pass against an isolated MySQL database.
- Transaction rollback preserves existing donor records on injected failure.
- Public artifacts contain no internal settings or donor files.

## Milestone 4: Remove obsolete scope

### Task 4.1 — Remove obsolete administration features

- Remove the performance page, composable, monitor component, and navigation entry.
- Remove system-information UI/API, debug API, and legacy file manager/API.
- Remove legacy JSON donor administration and its unused composable methods.
- Consolidate cache management into one admin surface.

### Task 4.2 — Remove unused public/development features

- Remove the test-images route.
- Remove the rule-based chatbot, duplicate AI utilities/data, and settings controls.
- Remove unused search/skeleton components only after proving they have no consumers.
- Remove fake production fixtures while retaining explicit test fixtures inside tests.

### Task 4.3 — Remove Plesk and obsolete deployment assets

- Delete Plesk workflows and Passenger assumptions.
- Delete obsolete CI build scripts and references to workflows that no longer exist.
- Update root documentation to describe the real platform and supported commands.

Verification:

- Import scan finds no references to deleted modules.
- Lint, tests, type check, and build pass.

## Milestone 5: Precision Arena redesign

### Task 5.1 — Establish the design system

- Define Precision Arena color, typography, spacing, radius, border, shadow, motion, and status tokens.
- Add accessible primitives for buttons, fields, validation, dialogs, notices, tables, tabs, status chips, and empty/loading/degraded states.
- Add reduced-motion and keyboard/focus behavior.

### Task 5.2 — Redesign the public experience

- Rebuild the header and hero around immediate live server status and a primary join action.
- Redesign server status, seasonal leaderboard, player search/detail, donations, reward information, donors, and maintenance state.
- Replace hardcoded Discord/payment/server links with sanitized settings.
- Preserve complete mobile functionality and accessible table/list alternatives.
- Update metadata, structured data, sitemap behavior, and responsive images.

### Task 5.3 — Redesign the admin shell and retained pages

- Replace the top navigation with a responsive sidebar/compact mobile navigation.
- Redesign dashboard, donor, server, database, settings, and cache pages.
- Add explicit action consequences, validation, confirmation, health timestamps, and audited outcomes.

Verification:

- Public and admin browser scenarios pass.
- Desktop/mobile visual snapshots match the approved direction.
- Keyboard-only and reduced-motion checks pass.
- No critical automated accessibility violations are reported on core routes.

## Milestone 6: Discord worker migration

### Task 6.1 — Create the typed worker boundary

- Add a typed ESM worker entrypoint with Discord.js lifecycle management.
- Reuse shared database, server-query, configuration, and logging modules.
- Add signal handling, graceful shutdown, bounded reconnect behavior, and heartbeat updates.
- Keep the Discord token environment-only.

### Task 6.2 — Implement safe status publication

- Generate embeds from canonical enabled server records and normalized status data.
- Store one managed message ID per server in MySQL.
- Edit existing messages, recreate missing messages, and identify owned messages with an explicit marker.
- Never clear a channel or delete unrelated messages.
- Prevent overlapping scheduled/manual refreshes and apply bounded retry/backoff.

### Task 6.3 — Add durable bot settings and jobs

- Poll setting revisions and apply safe updates without process restart.
- Atomically claim jobs with expiring locks and bounded attempts.
- Implement validate-configuration, publish-all, publish-one, and register-commands jobs.
- Persist sanitized job results and worker runtime state.

### Task 6.4 — Add slash commands

- Add `/server-status` for public on-demand status.
- Add administrator-only `/refresh-server-status`.
- Register commands idempotently for the configured guild.
- Avoid Message Content intent unless a retained feature demonstrably requires it.

Verification:

- Mock Discord tests cover reconnect, missing-message recovery, permissions, retries, idempotency, and graceful shutdown.
- Worker never creates duplicate managed messages in restart tests.
- Whitelist and role-sync imports, queries, commands, and configuration no longer exist.

## Milestone 7: Discord administration

### Task 7.1 — Add secured Discord APIs

- Add authenticated endpoints for sanitized settings, runtime health, message state, recent jobs, preview generation, and queued actions.
- Apply validation, CSRF, audit logging, and safe error contracts.

### Task 7.2 — Build the Discord Bot admin page

- Add configuration forms for enabled state, guild/channel IDs, interval, embed options, player-name display, and server publication/order.
- Display token configured state, connected bot identity, heartbeat freshness, permissions, loaded revision, latest publication, command-registration state, and recent errors/jobs.
- Add preview, validate, publish-all, publish-one, and register-command actions with confirmation and result feedback.

Verification:

- Browser tests cover configuration, validation failures, queued jobs, status updates, and stale worker health.
- API responses never include the bot token or raw secrets/errors.

## Milestone 8: Docker, Coolify, and final release verification

### Task 8.1 — Rebuild container definitions

- Create deterministic multi-stage images compatible with Node.js 24 and pinned Bun.
- Run web and bot as non-root users.
- Add web health endpoint and local worker health command.
- Define `web`, `bot`, and one-shot `migrate` Compose services/profiles.
- Configure external MySQL entirely at runtime.

### Task 8.2 — Update operational documentation

- Document local development, environment variables, migrations, tests, Docker Compose, Coolify setup, health checks, backups, activation order, and rollback.
- Document Discord application intents and required channel permissions.
- Document optional live smoke-test procedure.

### Task 8.3 — Complete final verification

- Run the complete clean-install CI suite.
- Render and inspect all public/admin routes at desktop and mobile sizes.
- Scan built artifacts for secrets and publicly copied data.
- Start Compose, apply migrations, test web/worker health, restart both services, and verify durable state.
- If designated Discord test credentials are provided, run the controlled live smoke test with publishing disabled by default afterward.

Final acceptance commands:

- `bun install --frozen-lockfile`
- `bun run lint`
- `bun run test`
- `bun run type-check`
- `bun run build`
- `bun audit`
- `docker compose build`
- `docker compose --profile migrate run --rm migrate`
- `docker compose up -d`
- Project-specific health and browser-test commands documented during implementation.
