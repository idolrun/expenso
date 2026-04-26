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
# Prisma 7 breaking change: prisma.config.ts configures the datasource URL via
# env("DATABASE_URL"), so the CLI loads the config and requires the variable.
# We pass a dummy DATABASE_URL as an inline shell variable scoped to this RUN
# command only — it is NOT persisted as an image layer.
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm run db:generate

# NEXT_PUBLIC_APP_URL is the ONLY build-time var that must be inlined into the
# Next.js client bundle. All secrets (BETTER_AUTH_SECRET, DATABASE_URL) are
# injected at runtime via --env-file and must NOT appear as ARG or ENV.
ARG NEXT_PUBLIC_APP_URL="https://example.com"

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Build Next.js production app (requires output: 'standalone' in next.config.ts).
# BETTER_AUTH_SECRET is passed as a transient inline env var — it exists only
# for the duration of this RUN command and is NOT persisted in any image layer.
# The real secret is injected at container runtime via --env-file.
RUN BETTER_AUTH_SECRET="build-time-dummy-not-used-at-runtime" pnpm run build

# ═══════════════════════════════════════════════════════════════════════════════
# Stage 3 — App (production runtime)
#   Minimal image: only the compiled Next.js app + Prisma generated client.
#   NO Prisma CLI, NO schema, NO migrations, NO prisma.config.ts.
# ═══════════════════════════════════════════════════════════════════════════════
FROM node:22.15.0-alpine3.21 AS app

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# Patch Alpine OS packages to latest security fixes.
RUN apk upgrade --no-cache

# Create non-root user and group with fixed UID/GID (1001).
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy standalone Next.js output (self-contained, no node_modules needed).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy generated Prisma client (includes the query-engine binary for linux-musl).
COPY --from=builder --chown=nextjs:nodejs /app/src/generated/prisma ./src/generated/prisma

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

# ═══════════════════════════════════════════════════════════════════════════════
# Stage 4 — Migrate (dedicated migration runner)
#   Lightweight image with ONLY the Prisma CLI + schema + config.
#   Used for "prisma migrate deploy" during CI/CD — never runs in production.
#   Prisma is installed LOCALLY (not globally) so prisma.config.ts resolves
#   "prisma/config" imports correctly.
# ═══════════════════════════════════════════════════════════════════════════════
FROM node:22.15.0-alpine3.21 AS migrate

WORKDIR /app

ENV NODE_ENV=production

# Install prisma locally (NOT globally) so Node module resolution works
# for imports like: import { defineConfig } from "prisma/config"
#
# CRITICAL: prisma.config.ts imports "dotenv/config", so dotenv MUST be
# installed alongside prisma. Without it, migrate deploy crashes with:
#   Error: Cannot find module 'dotenv/config'
RUN npm install prisma@7.7.0 dotenv --no-package-lock --no-audit --no-fund && \
    npm cache clean --force

# Copy only what the Prisma CLI needs to run migrations.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

# Default command: deploy pending migrations.
# Override in CI if needed (e.g. for "prisma migrate status").
CMD ["./node_modules/.bin/prisma", "migrate", "deploy", "--schema=./prisma/schema.prisma"]
