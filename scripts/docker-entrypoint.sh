#!/bin/sh
set -e

echo ">>> Node version: $(node --version)"
echo ">>> DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"
echo ">>> Running Prisma migrate deploy..."
if ./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma; then
  echo ">>> Migrations completed successfully"
else
  echo ">>> WARNING: Migrations failed with exit code $?"
  echo ">>> Continuing app startup — run migrations manually if needed"
fi
echo ">>> Starting Next.js on port ${PORT:-3000}..."
exec node server.js
