#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# Blue/Green Deployment Script  (system nginx variant)
# ═══════════════════════════════════════════════════════════════════════════════
# Usage: ./scripts/deploy-bluegreen.sh <image-digest>
# Example: ./scripts/deploy-bluegreen.sh sha256:abc123...
#
# Architecture:
#   - System nginx on the VPS (not in Docker)
#   - Blue container → host port 3000  (127.0.0.1:3000)
#   - Green container → host port 3001 (127.0.0.1:3001)
#   - Nginx config:  set $active_upstream blue|green;
#
# Flow:
#   1. Detect current active color from nginx config
#   2. Target = opposite color
#   3. Pull & start target container with new digest
#   4. Health check target on its localhost port
#   5. If healthy → update nginx → reload (zero downtime)
#   6. If unhealthy → destroy target → keep active (no user impact)
#   7. Stop old container after grace period
# ═══════════════════════════════════════════════════════════════════════════════

COMPOSE_FILE="docker-compose.prod.yml"
STATE_FILE=".bluegreen.state"
NGINX_SITE="${NGINX_SITE_PATH:-/etc/nginx/sites-available/expenso}"
MAX_HEALTH_RETRIES=5
HEALTH_RETRY_DELAY=3
GRACE_PERIOD_SECS=10

cd "$(dirname "$0")/.."

# ── Parse arguments ───────────────────────────────────────────────────────────
NEW_DIGEST="${1:-}"
if [ -z "$NEW_DIGEST" ]; then
    echo "Usage: $0 <image-digest>"
    echo "Example: $0 sha256:abc123..."
    exit 1
fi

# ── Load shared defaults ─────────────────────────────────────────────────────
REGISTRY="${REGISTRY:-docker.io}"
IMAGE_NAME="${IMAGE_NAME:-devidolrun/expenso}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}@${NEW_DIGEST}"

# ── Detect current active color from nginx config ────────────────────────────
if [ ! -f "$NGINX_SITE" ]; then
    echo "ERROR: Nginx site config not found at $NGINX_SITE"
    echo "Set NGINX_SITE_PATH env var if your config is elsewhere."
    exit 1
fi

ACTIVE_COLOR=$(grep -oP 'set\s+\$active_upstream\s+\K\w+' "$NGINX_SITE" 2>/dev/null || true)

if [ -z "$ACTIVE_COLOR" ] || { [ "$ACTIVE_COLOR" != "blue" ] && [ "$ACTIVE_COLOR" != "green" ]; }; then
    echo "WARN: Could not detect active upstream from nginx config. Defaulting to blue."
    ACTIVE_COLOR="blue"
fi

# Determine target color
if [ "$ACTIVE_COLOR" = "blue" ]; then
    TARGET_COLOR="green"
    TARGET_PORT=3001
else
    TARGET_COLOR="blue"
    TARGET_PORT=3000
fi

echo "════════════════════════════════════════════════════════════════"
echo "  BLUE/GREEN DEPLOYMENT"
echo "  Active: $ACTIVE_COLOR  →  Target: $TARGET_COLOR (port $TARGET_PORT)"
echo "  Image:  $FULL_IMAGE"
echo "  Time:   $(date -Iseconds)"
echo "════════════════════════════════════════════════════════════════"

# ── Step 1: Stop & remove any existing target container ───────────────────────
echo ">>> [1/6] Cleaning up any existing $TARGET_COLOR container..."
docker compose -f "$COMPOSE_FILE" rm -sf "app-$TARGET_COLOR" 2>/dev/null || true

# ── Step 2: Pull & start target container ─────────────────────────────────────
echo ">>> [2/6] Pulling image for $TARGET_COLOR..."
export "${TARGET_COLOR^^}_IMAGE=$FULL_IMAGE"
docker compose -f "$COMPOSE_FILE" pull "app-$TARGET_COLOR"

echo ">>> [3/6] Starting $TARGET_COLOR container on port $TARGET_PORT..."
docker compose -f "$COMPOSE_FILE" up -d "app-$TARGET_COLOR"

# ── Step 3: Health check on target ────────────────────────────────────────────
echo ">>> [4/6] Running health checks on $TARGET_COLOR (localhost:$TARGET_PORT)..."
HEALTHY=false
for i in $(seq 1 $MAX_HEALTH_RETRIES); do
    echo ">>>   Attempt $i/$MAX_HEALTH_RETRIES..."

    # Use curl against the host-bound localhost port
    if curl -sf "http://127.0.0.1:$TARGET_PORT/api/health" >/dev/null 2>&1; then
        echo ">>>   $TARGET_COLOR responded with HTTP 200"
        HEALTHY=true
        break
    fi

    # Also check Docker-native health status for extra confidence
    DOCKER_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "expenso-$TARGET_COLOR" 2>/dev/null || echo "unknown")
    echo ">>>   Docker health status: $DOCKER_HEALTH"

    sleep "$HEALTH_RETRY_DELAY"
done

if [ "$HEALTHY" != "true" ]; then
    echo ""
    echo "ERROR: $TARGET_COLOR failed all health checks."
    echo ">>> Destroying $TARGET_COLOR container..."
    docker compose -f "$COMPOSE_FILE" rm -sf "app-$TARGET_COLOR" 2>/dev/null || true
    echo ">>> Kept $ACTIVE_COLOR running on port $([ "$ACTIVE_COLOR" = "blue" ] && echo 3000 || echo 3001)."
    echo ">>> NO traffic was switched. Users are unaffected."
    echo "════════════════════════════════════════════════════════════════"
    echo "  DEPLOYMENT FAILED — Rollback not needed (switch never happened)"
    echo "════════════════════════════════════════════════════════════════"
    exit 1
fi

# ── Step 4: Switch traffic (zero-downtime nginx reload) ───────────────────────
echo ">>> [5/6] Switching nginx from $ACTIVE_COLOR → $TARGET_COLOR..."
sudo sed -i "s/set\s*\\\$active_upstream\s\+\w\+;/set \$active_upstream $TARGET_COLOR;/g" "$NGINX_SITE"

# Validate nginx config before reloading
echo ">>> Testing nginx configuration..."
if ! sudo nginx -t; then
    echo "ERROR: Nginx config test failed. Reverting sed change..."
    sudo sed -i "s/set\s*\\\$active_upstream\s\+\w\+;/set \$active_upstream $ACTIVE_COLOR;/g" "$NGINX_SITE"
    docker compose -f "$COMPOSE_FILE" rm -sf "app-$TARGET_COLOR" 2>/dev/null || true
    exit 1
fi

echo ">>> Reloading nginx gracefully..."
sudo nginx -s reload

# ── Step 5: Grace period for connection drain ─────────────────────────────────
echo ">>> Waiting ${GRACE_PERIOD_SECS}s for connections to drain from $ACTIVE_COLOR..."
sleep "$GRACE_PERIOD_SECS"

# ── Step 6: Stop old container ────────────────────────────────────────────────
echo ">>> [6/6] Stopping previous $ACTIVE_COLOR container..."
docker compose -f "$COMPOSE_FILE" stop "app-$ACTIVE_COLOR" 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" rm -sf "app-$ACTIVE_COLOR" 2>/dev/null || true

# ── Update state ──────────────────────────────────────────────────────────────
cat > "$STATE_FILE" <<EOF
# Blue/Green state — managed by deploy-bluegreen.sh
ACTIVE_COLOR=$TARGET_COLOR
BLUE_DIGEST=$([ "$TARGET_COLOR" = "blue" ] && echo "$NEW_DIGEST" || echo "$BLUE_DIGEST")
GREEN_DIGEST=$([ "$TARGET_COLOR" = "green" ] && echo "$NEW_DIGEST" || echo "$GREEN_DIGEST")
LAST_DEPLOY=$(date -Iseconds)
EOF

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  DEPLOYMENT SUCCESSFUL"
echo "  Active color: $TARGET_COLOR  (port $TARGET_PORT)"
echo "  Digest:       $NEW_DIGEST"
echo "  Time:         $(date -Iseconds)"
echo "════════════════════════════════════════════════════════════════"
