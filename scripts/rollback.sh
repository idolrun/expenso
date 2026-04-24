#!/bin/sh
set -e

TAG="${1:-backup}"
ENV_FILE=".env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found in $(pwd)"
  exit 1
fi

# Extract the current IMAGE_TAG value (handles optional quotes)
CURRENT_TAG=$(grep '^IMAGE_TAG=' "$ENV_FILE" | cut -d '=' -f 2- | sed 's/^["'\''"]//;s/["'\''"]$//')

echo "Initiating rollback: $CURRENT_TAG -> $TAG"

echo ">>> Stopping app container..."
docker compose stop app

echo ">>> Updating IMAGE_TAG to $TAG in $ENV_FILE..."
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=\"$TAG\"/" "$ENV_FILE"

echo ">>> Starting app with tag $TAG..."
docker compose up -d --no-deps app

echo ">>> Waiting for service to become healthy..."
if ./scripts/healthcheck.sh; then
  echo "Rollback successful. App is healthy on tag $TAG."
  exit 0
else
  echo "Rollback failed — app is unhealthy. Restoring previous tag $CURRENT_TAG..."
  sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=\"$CURRENT_TAG\"/" "$ENV_FILE"
  docker compose up -d --no-deps app
  exit 1
fi
