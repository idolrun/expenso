#!/bin/sh
set -e

echo ">>> Node version: $(node --version)"
echo ">>> DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"
echo ">>> Starting Next.js on port ${PORT:-3000}..."

exec node server.js
