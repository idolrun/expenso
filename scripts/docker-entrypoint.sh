#!/bin/sh
set -e

echo ">>> Node version: $(node --version)"
echo ">>> DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"
echo ">>> BETTER_AUTH_SECRET is set: $([ -n "$BETTER_AUTH_SECRET" ] && echo YES || echo NO)"
echo ">>> Starting Next.js on port ${PORT:-3000}..."

# Migrations intentionally do not run here. CI runs `prisma migrate deploy`
# before blue/green traffic switching.
exec node server.js
