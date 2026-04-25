#!/bin/sh

echo ">>> Node version: $(node --version)"
echo ">>> DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"
echo ">>> Running Prisma migrate deploy..."

if PRISMA_DISABLE_WARNINGS=1 \
   DATABASE_URL="$DATABASE_URL" \
   prisma migrate deploy \
   --schema=./prisma/schema.prisma; then
  echo ">>> Migrations completed successfully"
else
  MIGRATION_EXIT=$?
  echo ">>> WARNING: Migrations failed with exit code $MIGRATION_EXIT"
  echo ">>> Continuing app startup — check logs and run migrations manually if needed"
fi

echo ">>> Starting Next.js on port ${PORT:-3000}..."
exec node server.js
