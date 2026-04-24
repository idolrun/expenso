#!/bin/sh
set -e

URL="http://localhost:3000/api/health"
MAX_RETRIES=10
INTERVAL=6

i=0
while [ "$i" -lt "$MAX_RETRIES" ]; do
  i=$((i + 1))

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo "000")
  if [ "$STATUS" -eq 200 ]; then
    echo "Health check passed (attempt $i)"
    exit 0
  fi

  echo "Attempt $i failed (status: $STATUS), retrying in ${INTERVAL}s..."
  sleep "$INTERVAL"
done

echo "Service unhealthy after $MAX_RETRIES retries"
exit 1
