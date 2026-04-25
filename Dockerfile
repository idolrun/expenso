# syntax=docker/dockerfile:1

# ═══════════════════════════════════════════════════════════════════════════════
# Stage 1 — Dependencies
#   Install all dependencies (including devDependencies) with optimal caching.
# ═══════════════════════════════════════════════════════════════════════════════
FROM node:22.15.0-alpine3.21 AS deps

# Pin pnpm to the exact version declared in package.json to prevent
# supply-chain drift (packageManager: "pnpm@10.8.0").
RUN corepack enable && corepack prepare pnpm@10.8.0 --activate

WORKDIR /app

# Copy dependency manifests first for optimal layer caching.
# If these files don't change, the install layer is cached.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Use BuildKit cache mount for pnpm store to speed up rebuilds.
# --frozen-lockfile guarantees reproducible installs.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ═══════════════════════════════════════════════════════════════════════════════
# Stage 2 — Builder
#   Generate Prisma client and build Next.js standalone output.
# ═══════════════════════════════════════════════════════════════════════════════
FROM node:22.15.0-alpine3.21 AS builder

RUN corepack enable && corepack prepare pnpm@10.8.0 --activate

WORKDIR /app

# Bring in dependencies from the deps stage (cached if lockfile unchanged).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy source code and Prisma schema.
# .dockerignore ensures secrets, .git, docs, and test files stay out.
COPY . .

# Generate Prisma client for the target platform binary.
# binaryTargets in schema.prisma already includes "linux-musl-openssl-3.0.x".
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"
RUN pnpm run db:generate

# Dummy build-time values ONLY — real secrets are injected at runtime.
# Using ARG prevents accidental leakage into the final image layers
# because ARGs are scoped to the build stage they are defined in.
ARG BETTER_AUTH_SECRET="build-time-dummy-secret-must-be-at-least-32-chars-long"
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG NEXT_PUBLIC_APP_URL="https://example.com"

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    DATABASE_URL=${DATABASE_URL} \
    BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Build Next.js production app (requires output: 'standalone' in next.config.ts).
RUN pnpm run build

# ═══════════════════════════════════════════════════════════════════════════════
# Stage 3 — Runner (production)
#   Minimal runtime image: only Node.js, global Prisma CLI, and the app.
# ═══════════════════════════════════════════════════════════════════════════════
FROM node:22.15.0-alpine3.21 AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1 \
    PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"

# Patch Alpine OS packages to latest security fixes, then install Prisma CLI.
# PRISMA_CLI_BINARY_TARGETS ensures the musl-compatible query engine is fetched.
RUN apk upgrade --no-cache && \
    npm install -g prisma@7.7.0 && \
    npm cache clean --force

# Create non-root user and group with fixed UID/GID (1001).
# Fixed IDs prevent permission mismatches between host and container.
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy standalone Next.js output (self-contained, no node_modules needed).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy generated Prisma client (includes the query-engine binary for linux-musl).
COPY --from=builder --chown=nextjs:nodejs /app/src/app/generated/prisma ./src/app/generated/prisma

# Copy Prisma schema, migrations, and config for CLI commands.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Copy startup script.
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Harden ownership — entire /app tree belongs to nextjs:nodejs.
RUN chown -R nextjs:nodejs /app

# Drop to non-root user. All runtime processes run unprivileged.
USER nextjs

EXPOSE 3000

# Lightweight healthcheck using busybox wget (included in alpine).
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["./docker-entrypoint.sh"]
