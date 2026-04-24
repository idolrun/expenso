#!/bin/sh
set -e

URL="http://localhost:3001/api/health"
MAX_RETRIES=10
INTERVAL=6

i=0
while [ "$i" -lt "$MAX_RETRIES" ]; do
  i=$((i + 1))

  if wget -qO- "$URL" > /dev/null 2>&1; then
    echo "Service is healthy (attempt $i/$MAX_RETRIES)"
    exit 0
  fi

  echo "Health check attempt $i/$MAX_RETRIES failed, retrying in ${INTERVAL}s..."
  sleep "$INTERVAL"
done

echo "Service unhealthy after $MAX_RETRIES retries"
exit 1
