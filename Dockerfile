# syntax=docker/dockerfile:1

# ═══════════════════════════════════════════════════════════════════════════════
# Stage 1 — Builder
# ═══════════════════════════════════════════════════════════════════════════════
FROM node:22-alpine AS builder

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependency manifests first for optimal layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies (devDependencies are required for the build)
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY . .

# Copy prisma/ directory explicitly
COPY prisma/ prisma/

# Generate Prisma client for the target platform binary
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"
RUN pnpm run db:generate

# Debug: list what Prisma packages actually exist in node_modules
RUN echo "=== Prisma packages in node_modules ===" && \
    ls /app/node_modules/@prisma/ && \
    echo "=== Prisma CLI binary ===" && \
    ls /app/node_modules/.bin/prisma && \
    echo "=== Prisma build ===" && \
    ls /app/node_modules/prisma/

# Dummy build-time values only — real secrets are injected at runtime via docker-compose env_file.
# Using ARG for secrets avoids Docker security scanner warnings; they are passed through to ENV
# only because Next.js build reads them at compile time.
ARG BETTER_AUTH_SECRET="build-time-dummy-secret-not-used"
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG NEXT_PUBLIC_APP_URL="https://expenso.idolrun.com"

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    DATABASE_URL=${DATABASE_URL} \
    BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Build Next.js production app (requires output: 'standalone' in next.config.ts)
RUN pnpm run build

# ═══════════════════════════════════════════════════════════════════════════════
# Stage 2 — Runner (production)
# ═══════════════════════════════════════════════════════════════════════════════
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1 \
    PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Create non-root user and group
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy Next.js standalone output + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema for runtime migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Prisma CLI and client — copy entire @prisma scope (Prisma 7 bundles engines inside prisma/)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy startup script
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Ensure entire /app is owned by nextjs:nodejs
RUN chown -R nextjs:nodejs /app

# Run as non-root
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["./docker-entrypoint.sh"]
