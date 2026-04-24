#!/bin/bash
set -euo pipefail

TAG="${1:-latest}"
ENV_FILE=".env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found in $(pwd)"
  exit 1
fi

# Extract the current IMAGE_TAG value (handles optional quotes)
CURRENT_TAG=$(grep '^IMAGE_TAG=' "$ENV_FILE" | cut -d '=' -f 2- | sed 's/^["'\''"]//;s/["'\''"]$//')

echo "Deploying image tag: $CURRENT_TAG -> $TAG"

echo ">>> Backing up current tag ($CURRENT_TAG)..."
echo "$CURRENT_TAG" > .previous_tag

echo ">>> Updating IMAGE_TAG to $TAG in $ENV_FILE..."
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=\"$TAG\"/" "$ENV_FILE"

echo ">>> Pulling image $TAG..."
docker compose pull app

echo ">>> Starting app with tag $TAG..."
docker compose up -d --no-deps --remove-orphans app

echo ">>> Waiting for service to become healthy..."
sleep 10
if bash scripts/healthcheck.sh; then
  echo "Deploy successful. App is healthy on tag $TAG."
  exit 0
else
  echo "Deploy failed — app is unhealthy. Restoring previous tag $CURRENT_TAG..."
  sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=\"$CURRENT_TAG\"/" "$ENV_FILE"
  docker compose up -d --no-deps app
  exit 1
fi
