# Stage 1 - builder
FROM node:18-bullseye-slim AS builder

WORKDIR /app

# Install OS-level build deps required by some native modules during install/build
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates python3 make g++ git \
  && rm -rf /var/lib/apt/lists/*

# Copy package manifests first for better cache usage
COPY package.json package-lock.json ./

# Install dependencies (use npm ci when lockfile present)
RUN npm ci --no-audit --prefer-offline

# Copy the rest of the source
COPY . .

# Build the Nuxt application (uses the "build" script from package.json)
RUN npm run build

# Stage 2 - production image
FROM node:18-bullseye-slim AS runner

WORKDIR /app

# Set NODE_ENV to production and default port
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy built output and production node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy data files as defaults for first-boot seeding
COPY --from=builder /app/server/data/ ./data-defaults/

# Create the persistent data directory (will be a volume mount point)
RUN mkdir -p ./server/data

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose application port
EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
