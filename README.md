# saka's Dodgeball Platform

The website and Discord status service for saka's Team Fortress 2 dodgeball community. The repository contains a Nuxt application for the public site and administration console, plus a separate Discord worker. Both services use the same external MySQL database.

## Features

- Live TF2 server status, player lists, maps, capacity, and Steam connect links
- Seasonal leaderboards, player search, and Steam profile data
- Donation goals, payment links, donor recognition, and donor administration
- Server, season, maintenance, cache, and database controls
- Discord status embeds, scheduled updates, slash commands, durable admin jobs, and worker health reporting
- Signed admin sessions, CSRF protection, rate limiting, and audit records
- Explicit, repeatable database migrations

## Requirements

- Node.js 24.20.0 (see `.nvmrc`)
- Bun 1.4.1
- MySQL 8 or a compatible MariaDB release
- Docker with Compose v2 for the recommended production setup

## Local development

```bash
cp .env.example .env
bun install --frozen-lockfile
bun run db:migrate
bun run dev
```

The web application is available at `http://localhost:3000`. Run the worker separately after configuring its database settings through the admin console and setting `DISCORD_TOKEN`:

```bash
bun run bot
```

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start Nuxt in development mode |
| `bun run build` | Build the web app, Discord worker, health check, and migration runner |
| `bun run start` | Run a built Nuxt server |
| `bun run bot` | Run the Discord worker from TypeScript source |
| `bun run bot:health` | Check the worker heartbeat in MySQL |
| `bun run db:migrate` | Apply pending numbered SQL migrations |
| `bun run lint` | Run the Nuxt-aware ESLint correctness gate |
| `bun run typecheck` | Type-check Nuxt, Vue, and service code |
| `bun run test` | Run the automated test suite with Vitest |
| `bun run test:e2e` | Run desktop/mobile Chromium smoke tests |
| `bun run audit` | Audit production dependencies |

Runtime values are documented in [.env.example](.env.example). Secrets must be supplied at runtime and must not be baked into an image or committed.

The numbered migrations add the platform control tables and seed the current site configuration. Existing gameplay statistics (`sakaStats` and seasonal tables) and donor tables remain the source for historical data; back them up before the first production migration.

## Discord application setup

Create a Discord application and bot, invite it with the `bot` and `applications.commands` scopes, and grant its status channel these permissions: View Channel, Send Messages, Embed Links, and Read Message History. The worker uses only the non-privileged Guilds intent.

Set `DISCORD_TOKEN` in the worker environment, run the migrations, then open **Admin → Discord bot**. Configure the guild and channel IDs, enable the worker, validate access, register commands, and only then enable scheduled publishing. The token is never returned to or editable from the website.

The worker provides `/server-status` for members and administrator-only `/refresh-server-status`. It edits only messages recorded as managed by this platform and does not clear channels.

## Deployment

Docker Compose defines the public `web` service, the private `bot` worker, and a one-shot `migrate` profile. MySQL is external. See [README.DOCKER.md](README.DOCKER.md) for local Docker and Coolify instructions.
