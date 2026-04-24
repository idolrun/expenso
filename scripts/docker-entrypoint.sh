#!/bin/sh
set -e

echo ">>> DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"
echo ">>> Running Prisma migrate deploy..."
# Use locally installed prisma binary — copied into standalone output by Dockerfile
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma
else
  echo ">>> Warning: local prisma binary not found, skipping migrations"
  echo ">>> Run migrations manually: docker compose exec app ./node_modules/.bin/prisma migrate deploy"
fi
echo ">>> Starting Next.js on port $PORT..."
exec node server.js
