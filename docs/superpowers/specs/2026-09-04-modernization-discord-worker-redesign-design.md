# Dodgeball Platform Modernization and Discord Worker Design

Date: 2026-09-04
Status: Approved for implementation planning

## 1. Purpose

Modernize the existing saka's Dodgeball Server website into a secure, maintainable platform that combines the public TF2 community site, its administration console, and the useful server-status functionality from the sibling `db-discord-bot` project.

The result will be one repository with two independently operated services:

- A Nuxt web application for public pages, APIs, and administration.
- A Discord worker for the long-lived Discord gateway connection and server-status publishing.

Both services will share typed domain code and durable MySQL-backed configuration. They will deploy together through Docker Compose and be suitable for Coolify.

This project does not absorb the separate whitelist website. Whitelist applications, whitelist status, Discord whitelist panels, role synchronization, and whitelist database access are removed from scope and from the migrated bot.

## 2. Goals

- Upgrade all retained dependencies to current stable releases and adapt code for breaking changes.
- Standardize production on Node.js 24 LTS and a pinned Bun release.
- Preserve and verify all retained public features.
- Replace insecure or fragile admin, persistence, cache, and server-query patterns.
- Redesign the public and admin experiences using the approved Precision Arena direction.
- Migrate the Discord server-status publisher into this repository as a separate worker.
- Configure and operate the Discord worker from the secured admin website.
- Replace Plesk-specific deployment with deterministic Docker Compose deployment.
- Add automated testing, type checking, linting, dependency auditing, and container health checks.

## 3. Non-goals

- Hosting or implementing the TF2 game server or SourceMod plugins.
- Migrating `whitelist.sakoa.xyz` into this application.
- Retaining any whitelist or Discord role-sync functionality.
- Adding a general-purpose Discord moderation or ticket bot.
- Storing or editing secrets through the admin UI.
- Supporting Plesk, Passenger, or the legacy direct-server deployment workflows.
- Preserving the current website's exact visual appearance.

## 4. Delivery strategy

Implementation will be phased so every stage remains buildable and reviewable:

1. Establish tests, safe admin authentication, and migration foundations.
2. Upgrade the runtime, framework, dependencies, build configuration, and deployment assets.
3. Consolidate database access, configuration persistence, caching, and error contracts.
4. Remove obsolete features and redesign the public and admin interfaces.
5. Migrate the Discord status publisher as a typed worker using shared services.
6. Add Discord administration, operational telemetry, and manual actions.
7. Complete browser, visual, integration, Docker, and optional live smoke testing.

Focused branches and pull requests may be used for these phases. Each phase must be merged only after its relevant verification passes. Existing user changes in the worktree must be preserved and reconciled rather than overwritten.

## 5. Target architecture

### 5.1 Nuxt web service

The Nuxt service owns:

- Public pages and SEO metadata.
- Public APIs for server status, seasons, leaderboards, player profiles, donors, and sanitized settings.
- Admin login, authorization, UI, and APIs.
- Validation and persistence of editable site and bot settings.
- Creation and inspection of durable bot jobs.
- Read-only display of Discord worker health and results.

The Nuxt request lifecycle must never instantiate a Discord gateway client.

### 5.2 Discord worker

The Discord worker owns:

- One long-lived Discord.js client.
- Registration and handling of `/server-status` and administrator-only `/refresh-server-status` commands.
- Scheduled publishing or editing of TF2 server-status embeds.
- Claiming and executing durable jobs created through the admin UI.
- Periodic configuration-version checks and safe configuration reloads.
- Runtime heartbeat, last-success, last-error, and connection-state reporting.
- Graceful shutdown and interval cleanup.

The worker exposes no network port. Its database heartbeat is the authoritative health signal for Nuxt and Coolify; container process health is checked locally without a network listener.

### 5.3 Shared application layer

Framework-independent modules will provide:

- Validated application and Discord settings schemas.
- MySQL pool creation and repositories.
- Canonical TF2 server definitions.
- GameDig query normalization and cache coordination.
- Discord status-view models and embed construction.
- SteamID parsing and conversion.
- Season calculations.
- Structured error and logging primitives.

Nuxt-specific APIs and Discord-specific event handlers remain thin adapters around these modules.

### 5.4 External systems

- MySQL stores existing player/donation data and new application control data.
- Discord receives status messages and slash-command interactions.
- TF2 servers are queried with GameDig.
- Steam profiles are fetched only when a Steam API key is configured.
- The external whitelist site remains independent and is not called by the worker.

## 6. Data and persistence

### 6.1 Existing data

Existing player statistics, seasonal tables, donor users, and donation records remain compatible. Donor mutations involving multiple statements must run in transactions. List and detail operations must avoid N+1 query patterns.

All database/table selection will be derived from validated configuration and controlled season utilities. Application SQL must not hardcode the `dodgeball` or `tf2whitelist` schema names.

### 6.2 New application tables

Numbered SQL migrations will establish:

- `app_migrations`: string migration ID as the primary key plus application timestamp.
- `app_settings`: singleton ID, JSON payload, unsigned revision, update timestamp, and updater identifier.
- `game_servers`: string server ID primary key, display name, host, port, location, connect URL, enabled flag, display order, Discord publication flag, and update metadata.
- `discord_bot_settings`: singleton ID, enabled and publishing flags, guild/status-channel IDs, safe interval, embed options, revision, and update metadata.
- `discord_bot_jobs`: numeric primary key, constrained job type/status, JSON payload/result, attempt counters, availability/lock/completion timestamps, lock owner, and sanitized error fields. An index on status plus availability supports atomic claims.
- `discord_bot_runtime`: singleton ID, connection state, bot identity, heartbeat, loaded revision, command-registration state, latest successful publication, and sanitized latest error.
- `discord_status_messages`: game-server ID primary key, channel/message IDs, latest publication timestamp, and latest normalized content hash.
- `admin_audit_events`: numeric primary key, actor/session fingerprint, action, target, outcome, timestamp, and sanitized JSON metadata. An index on timestamp supports bounded retention and recent-activity queries.

### 6.3 Configuration migration

Current `server/data/settings.json` and `server/data/servers.json` values will seed the database once. The migration will be idempotent and will not overwrite records already managed in MySQL. A backup copy or documented export path will be retained before the JSON files cease to be authoritative.

`server/data` will no longer be published at `/data`, and build scripts will no longer copy donor, server, or settings data into public output.

### 6.4 Migration execution

Database changes run explicitly through `bun run db:migrate`. This command is intended for local setup and a Coolify pre-deployment step. Normal web and worker startup do not silently apply schema mutations.

## 7. Security design

### 7.1 Secrets

These values remain runtime environment variables and are never returned by an API or written to editable settings:

- Database host, port, user, password, and database name.
- Admin password and admin session-signing secret.
- Discord bot token.
- Steam API key.

The admin UI may show only configured/not-configured state for secrets.

### 7.2 Admin sessions

The existing forgeable constant-value cookie is replaced with signed, expiring, HTTP-only sessions. Cookies use `Secure` in production and strict same-site policy. Login compares credentials safely, is rate-limited, and does not reveal whether a secret is configured beyond an operational configuration error.

All admin APIs use one centralized authorization helper. All admin pages use one route middleware. Mutating requests require a CSRF token and same-origin validation. Logout invalidates the browser session. Security-sensitive and state-changing actions create sanitized audit events.

The signed-session design does not depend on database availability, ensuring an authenticated administrator can still reach database diagnostics during an outage.

### 7.3 Discord controls

Bot settings accept validated Discord guild and status-channel snowflake identifiers. The token cannot be modified through the browser. Before enabling publication, the worker validates guild membership, channel type, and required permissions. Destructive channel clearing is not supported.

## 8. Retained public features

- Immediate live server status with online, checking, offline, and degraded states.
- Current map, capacity, players, scores, session durations, location, and Steam connect links when available.
- Seasonal leaderboard with season selection, ascending/descending ordering, and sorting by points, top speed, playtime, kills, or deaths.
- Player search by name and supported SteamID formats, with disambiguation for multiple matches.
- Player detail display with rank, points, kills, deaths, K/D, playtime, top speed, deflections, Steam identity, and activity dates.
- Donation goal, supported payment links, reward information, terms, and opt-in donor recognition.
- Public Discord invite and maintenance page.
- Responsive navigation, accessible interaction states, metadata, sitemap, and optimized images.

Failures must never display invented production players, donors, or statistics. Stale real data may be shown with a timestamp and explicit stale status.

## 9. Streamlined administration

The redesigned admin console includes:

- Overview: server, database, and Discord worker health plus recent audited activity.
- Donors: donor metadata, visibility, expiry, and transactional donation history management.
- Servers: canonical server configuration, ordering, enabled state, query diagnostics, and Discord publication settings.
- Database: status, connection testing, and safe reconnection/configuration reload behavior.
- Discord Bot: editable non-secret settings, configured-secret indicators, connection identity, permission checks, heartbeat, last update/error, status-embed preview, queued manual publish, and command-registration state.
- Settings: maintenance, seasons, donation methods, public Discord invite, hero/public content, and consolidated operational cache intervals.
- Cache: one simplified view for useful cache inspection and targeted refresh.

Navigation uses a responsive sidebar on desktop and an accessible compact pattern on mobile.

## 10. Removed functionality

The overhaul removes:

- Admin browser performance scoring and reports.
- The performance composable and dormant performance-monitor component.
- Host/system-information APIs and modal.
- The unprotected debug endpoint.
- Legacy file management and localStorage password handling.
- Legacy JSON donor administration.
- Duplicate cache controls.
- The public test-images page.
- The disabled rule-based website chatbot and duplicate AI utility implementations.
- Fake player and donor fallbacks.
- Whitelist panel, request-role interaction, whitelist queries, role synchronization, and related bot commands/logging.
- Discord status-channel clearing and broad deletion of bot messages.
- Duplicate bot entrypoints, file-based Discord message IDs, and unused bot dependencies.
- Plesk workflows, Passenger assumptions, obsolete CI/build scripts, and stale deployment documentation.

Unused components and utilities discovered during final import analysis may also be removed when their lack of consumers is proven by search and a successful build.

## 11. Discord status functionality

### 11.1 Editable settings

The admin UI controls:

- Worker enabled state.
- Guild ID and status channel ID.
- Status publishing enabled state and update interval within safe limits.
- Embed heading, accent color, optional content text, and whether player names are displayed.
- Which canonical game servers are published and their order.

Environment-only secret status appears as a boolean indicator.

### 11.2 Message behavior

Each enabled server has at most one managed status message in the configured channel. Durable database state records its Discord message ID. If a message is missing, the worker recreates it. If the stored ID is stale, the worker may search only for messages authored by itself with an explicit managed marker; it never deletes unrelated content.

Publishing uses shared normalized server-status data. Overlapping refreshes are prevented. Discord and GameDig rate or timeout failures use bounded backoff and preserve the last successful message when possible.

### 11.3 Admin jobs

Admin actions create durable jobs instead of calling the Discord client directly. Initial job types are:

- Publish or refresh all configured server messages.
- Publish or refresh one configured server message.
- Validate Discord connection, guild, channel, and permissions.
- Register or refresh supported slash commands.

A worker atomically claims one eligible job, records attempts and lock time, completes it with sanitized results, or schedules a bounded retry. Abandoned locks expire safely. Job processing is idempotent wherever Discord semantics permit.

## 12. User interface direction

The approved direction is **Precision Arena**.

### 12.1 Public experience

- Dark editorial esports identity using near-black surfaces and focused violet accents.
- Strong, compact display typography for major moments, with highly readable text elsewhere.
- Live server state appears in or directly beside the hero, before long marketing copy.
- The primary action is joining an available server; leaderboard and Discord are secondary.
- Seasonal leaders and donation progress receive strong but distinct visual hierarchy.
- Decoration remains restrained so live data, names, and status signals carry the experience.

### 12.2 Admin experience

- Calm, dense operational layout rather than a marketing aesthetic.
- Desktop sidebar with clear active state; compact accessible navigation on smaller screens.
- Health, last-update times, degraded states, and consequences of actions are explicit.
- Forms are grouped by domain with validation adjacent to fields.
- Risky operations require confirmation and never rely on ambiguous icon-only controls.
- The same typography, spacing, status colors, and component primitives support both public and admin interfaces.

### 12.3 Accessibility and responsiveness

- Keyboard access and visible focus for every interactive element.
- Semantic landmarks, labels, table alternatives, modal focus management, and reduced-motion support.
- Status is communicated through text/icons in addition to color.
- No essential action or statistic is removed on mobile; layouts reflow instead of becoming horizontally unusable.

## 13. Runtime and dependency migration

- Production runs on Node.js 24 LTS meeting the selected Nuxt engine requirement.
- Bun is pinned and is the only package manager; obsolete lockfiles are removed.
- Nuxt, Vue, Vue Router, TypeScript, MySQL, Discord.js, GameDig, GSAP, and Nuxt Image move to current stable compatible releases.
- Tailwind CSS 4 uses its supported Vite integration; the older Nuxt Tailwind module is removed.
- Nuxt 2 TypeScript support, unused direct transitive dependencies, direct prerelease IPX, unused bot HTTP clients, and unused tooling are removed.
- Stale Vite `manualChunks`, deprecated CSS minification, invalid experimental flags, and unnecessary Nitro dependency inlining are removed or migrated.
- Runtime configuration uses empty safe defaults and standard `NUXT_*` runtime overrides so secrets are not baked into build artifacts.

Every upgrade group must pass type checking, tests, build, dependency audit, and relevant UI verification before the next group proceeds.

## 14. Docker Compose and Coolify

Docker Compose defines:

- `web`: the Nuxt application with the only public port and an application health endpoint.
- `bot`: the private Discord worker, monitored through process state and its MySQL heartbeat.
- `migrate`: a one-shot Compose profile using the same application image and runtime environment.

MySQL remains external and is configured through runtime variables. Containers use non-root users, deterministic frozen installs, health checks that do not assume unavailable system packages, restart policies suitable for long-running services, and graceful termination.

No mutable application configuration is written into the image source tree. The deployment docs describe local Compose usage, Coolify service setup, migration execution, environment variables, health checks, and rollback.

## 15. Error handling and observability

- API responses use consistent success, data, error-code, and sanitized-message contracts.
- Expected validation and not-found cases receive appropriate HTTP status codes.
- Public degraded responses are honest and may include last-known-real-data timestamps.
- Server queries use in-flight deduplication, bounded timeouts, sensible polling intervals, and stale-while-refresh behavior without caching a transient checking state for long periods.
- Web and worker logs are structured for container stdout/stderr and redact secrets.
- Worker runtime state exposes heartbeat, identity, configuration revision, last successful publish, last error category, and job counts to authenticated administrators.
- Detailed internal exceptions and filesystem/network metadata are not exposed to public clients.

## 16. Testing and acceptance criteria

### 16.1 Automated tests

- Unit tests cover settings validation, SteamID handling, seasons, signed sessions, CSRF behavior, server-status normalization, Discord embed generation, job locking, retries, and configuration reloads.
- API integration tests run against an isolated MySQL test database and cover migrations, donor transactions, admin authorization, settings, servers, bot jobs, and degraded states.
- Discord API behavior is mocked in routine tests; CI never requires a live token or posts messages.
- Browser tests cover admin login/navigation, donor management, settings updates, server configuration, Discord controls, player search, leaderboard sorting, responsive navigation, and maintenance mode.
- Visual regression checks cover approved Precision Arena public and admin layouts at representative desktop and mobile viewports.

### 16.2 Build and security gates

- Strict type checking passes without transient package installation.
- Linting and all automated tests pass.
- Production web and worker builds succeed from a frozen lockfile.
- Dependency audit contains no known high or critical vulnerabilities in the shipped dependency graph, except an explicitly documented upstream issue with no safe available fix.
- Docker services become healthy, stop gracefully, and restart without duplicating Discord status messages.
- Public output contains no donor data files, internal settings files, credentials, or source `.env` files.

### 16.3 Optional live verification

When the user provides a designated test guild/channel and environment configuration, a final live smoke test validates bot login, permissions, command registration, initial status publication, message updates, and admin-triggered refresh. Without live credentials, mocked Discord coverage and startup validation are required, and live publication remains disabled.

## 17. Rollout and rollback

- Export current JSON configuration before database import.
- Back up affected MySQL tables before applying production migrations.
- Apply migrations before starting the new web and worker versions.
- Deploy with the Discord worker disabled, validate web/admin/database behavior, then validate Discord permissions and enable publishing.
- Keep the prior deployable image tag available for rollback.
- Database migrations favor additive changes during rollout. Destructive cleanup of obsolete files/tables occurs only after the replacement path is verified and is separately documented.

## 18. Definition of done

The project is complete when all retained features operate through the redesigned interfaces, obsolete scope is removed, dependencies and runtimes are current and secure, admin authentication and data handling are hardened, the Discord status worker is configurable and observable through the admin site, Docker Compose runs both services cleanly for Coolify, documentation matches reality, and all required acceptance gates pass.
