# Docker and Coolify deployment

The production topology uses two long-running containers built from the same repository:

- `web` runs the Nuxt/Nitro server on port 3000.
- `bot` runs the Discord gateway worker without exposing a port.
- `migrate` is an opt-in, one-shot service for database migrations.

All containers run on Node.js 24.20.0 as the unprivileged `node` user. Bun 1.4.1 performs deterministic installs and builds in the build stages only.

## Local Compose

Create an environment file and fill in the required credentials:

```bash
cp .env.example .env
docker compose --profile tools run --rm migrate
docker compose up --build -d web bot
docker compose ps
docker compose logs -f web bot
```

Stop the platform with `docker compose down`. No application-data volume is required because editable settings, server definitions, jobs, and worker state live in MySQL.

The web health check requests `/api/health`. The bot health check runs its bundled heartbeat checker, which fails when the database heartbeat is missing or stale.

## Coolify

1. Create a Docker Compose resource from this repository and use `docker-compose.yml`.
2. Add the variables from `.env.example` in Coolify. Keep `DB_PASSWORD`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `STEAM_API_KEY`, and `DISCORD_TOKEN` marked as secrets.
3. Expose only the `web` service and map your domain to container port 3000. Do not publish a port for `bot`.
4. Run the `migrate` service before the first deployment and whenever a release contains new migrations:

   ```bash
   docker compose --profile tools run --rm migrate
   ```

5. Start with Discord publishing disabled. In the admin console, configure the guild/channel, validate permissions, and then enable publishing.

Generate the session signing secret once with `openssl rand -hex 32`. Keep it stable across web-container restarts; changing it signs every administrator out.

Coolify builds the `web` and `worker` Docker targets directly from this repository using `docker-compose.yml`. GitHub Actions runs CI checks; it does not publish container images or trigger Coolify deployments.

## Required configuration

| Variable | Used by | Description |
| --- | --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | all | External MySQL connection |
| `ADMIN_PASSWORD` | web | Admin login password |
| `ADMIN_SESSION_SECRET` | web | At least 32 random bytes used to sign sessions |
| `DISCORD_TOKEN` | bot | Discord bot token; never editable in the UI |
| `STEAM_API_KEY` | web | Optional Steam Web API key |
| `PUBLIC_SITE_URL` | web | Canonical public origin |
| `PUBLIC_SERVER_IP` | web | Public fallback Steam connect address |
| `BOT_INSTANCE_ID` | bot | Optional stable worker identifier |
| `BOT_HEARTBEAT_STALE_SECONDS` | bot | Health-check staleness threshold, default 120 |
| `DISCORD_JOB_POLL_MS`, `DISCORD_CONFIG_POLL_MS` | bot | Job and configuration polling intervals |
| `DISCORD_HEARTBEAT_MS`, `DISCORD_JOB_LOCK_SECONDS` | bot | Runtime heartbeat and abandoned-job lock timing |

The Compose file explicitly maps shared variables to Nuxt's `NUXT_*` runtime overrides. This keeps secrets out of build output while giving the worker the same canonical database configuration.

## Updating and rollback

Before deploying, back up the affected MySQL tables and run the migration service. Deploy `web` and `bot` from the same release tag so their schemas and contracts agree.

For rollback, redeploy the previous immutable image tags. Database migrations are designed to be additive; do not manually reverse a migration unless its release notes include a tested rollback statement.

## Troubleshooting

```bash
docker compose ps
docker compose logs --tail=200 web
docker compose logs --tail=200 bot
docker compose --profile tools run --rm migrate
```

If `web` is unhealthy, verify the external database variables and `/api/health`. If `bot` is unhealthy, inspect its last log entry and confirm that migrations ran, the Discord token is present, and its heartbeat is being updated.
