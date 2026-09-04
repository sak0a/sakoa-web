# syntax=docker/dockerfile:1.10

ARG BUN_VERSION=1.4.1
ARG NODE_VERSION=24.20.0

FROM oven/bun:${BUN_VERSION}-slim AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM dependencies AS builder
COPY . .
ENV NODE_ENV=production \
    NUXT_TELEMETRY_DISABLED=1
RUN bun run build:web
RUN bun run build:services

FROM oven/bun:${BUN_VERSION}-slim AS production-dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NODE_OPTIONS=--enable-source-maps

FROM runtime AS web
ENV NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000
COPY --chown=node:node --from=builder /app/.output ./.output
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(response => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"]
CMD ["node", ".output/server/index.mjs"]

FROM runtime AS worker
COPY --chown=node:node --from=production-dependencies /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/.output/services ./.output/services
USER node
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD ["node", ".output/services/bot/healthcheck.mjs"]
CMD ["node", ".output/services/bot/index.mjs"]

FROM worker AS migrate
HEALTHCHECK NONE
CMD ["node", ".output/services/database/migrate.mjs"]
