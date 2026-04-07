# Stage 1 - builder
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package manifests first for better cache usage
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Build the Nuxt application
RUN bun run build

# Stage 2 - production image (Node 20 to run the Nitro output)
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy built output only (Nitro bundles all dependencies)
COPY --from=builder /app/.output ./.output

# Copy data files as defaults for first-boot seeding
COPY --from=builder /app/server/data/ ./data-defaults/

# Create the persistent data directory (volume mount point)
RUN mkdir -p ./server/data

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
