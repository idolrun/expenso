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

# Dummy build-time env vars so Next.js does not crash during static analysis.
# Real values are injected at runtime via docker-compose env_file.
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV BETTER_AUTH_SECRET=build-time-placeholder-secret-32chars!!
ENV NEXT_PUBLIC_APP_URL=https://expenso.idolrun.com
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

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

# Prisma CLI and engine binaries — required for migrate deploy at startup
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/engines-version ./node_modules/@prisma/engines-version
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/fetch-engine ./node_modules/@prisma/fetch-engine
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/get-platform ./node_modules/@prisma/get-platform

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
