#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# Blue/Green Rollback Script  (system nginx variant)
# ═══════════════════════════════════════════════════════════════════════════════
# Usage: ./scripts/rollback-bluegreen.sh
#
# Flow:
#   1. Read current active color from .bluegreen.state
#   2. Determine previous color (the one that is NOT active)
#   3. Ensure previous container is running (restart from its last digest if needed)
#   4. Update nginx config to point back to previous color
#   5. Reload nginx (zero-downtime)
#   6. Update state file
# ═══════════════════════════════════════════════════════════════════════════════

COMPOSE_FILE="docker-compose.prod.yml"
STATE_FILE=".bluegreen.state"
NGINX_SITE="${NGINX_SITE_PATH:-/etc/nginx/sites-available/expenso}"

cd "$(dirname "$0")/.."

# ── Load state ────────────────────────────────────────────────────────────────
if [ ! -f "$STATE_FILE" ]; then
    echo "ERROR: State file $STATE_FILE not found. Cannot determine rollback target."
    exit 1
fi

# shellcheck source=/dev/null
source "$STATE_FILE"

if [ "$ACTIVE_COLOR" != "blue" ] && [ "$ACTIVE_COLOR" != "green" ]; then
    echo "ERROR: Invalid ACTIVE_COLOR in state file: $ACTIVE_COLOR"
    exit 1
fi

# Determine previous color
if [ "$ACTIVE_COLOR" = "blue" ]; then
    PREVIOUS_COLOR="green"
    PREVIOUS_DIGEST="${GREEN_DIGEST:-}"
    PREVIOUS_PORT=3001
else
    PREVIOUS_COLOR="blue"
    PREVIOUS_DIGEST="${BLUE_DIGEST:-}"
    PREVIOUS_PORT=3000
fi

if [ -z "$PREVIOUS_DIGEST" ]; then
    echo "ERROR: No digest recorded for $PREVIOUS_COLOR. Cannot rollback."
    exit 1
fi

REGISTRY="${REGISTRY:-docker.io}"
IMAGE_NAME="${IMAGE_NAME:-devidolrun/expenso}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}@${PREVIOUS_DIGEST}"

echo "════════════════════════════════════════════════════════════════"
echo "  BLUE/GREEN ROLLBACK"
echo "  Current active: $ACTIVE_COLOR"
echo "  Rolling back to: $PREVIOUS_COLOR (port $PREVIOUS_PORT)"
echo "  Digest: $PREVIOUS_DIGEST"
echo "  Time:   $(date -Iseconds)"
echo "════════════════════════════════════════════════════════════════"

# ── Ensure previous container is running ──────────────────────────────────────
echo ">>> Ensuring $PREVIOUS_COLOR container is available..."
export "${PREVIOUS_COLOR^^}_IMAGE=$FULL_IMAGE"

docker compose -f "$COMPOSE_FILE" up -d "app-$PREVIOUS_COLOR"

# Quick health check on previous container
echo ">>> Waiting for $PREVIOUS_COLOR to become healthy..."
for i in $(seq 1 10); do
    if curl -sf "http://127.0.0.1:$PREVIOUS_PORT/api/health" >/dev/null 2>&1; then
        echo ">>> $PREVIOUS_COLOR is responding on port $PREVIOUS_PORT"
        break
    fi
    DOCKER_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "expenso-$PREVIOUS_COLOR" 2>/dev/null || echo "unknown")
    echo ">>>   Attempt $i — Docker health: $DOCKER_HEALTH"
    sleep 3
done

# ── Switch nginx back ─────────────────────────────────────────────────────────
echo ">>> Switching nginx back to $PREVIOUS_COLOR..."
sudo sed -i "s/set\s*\\\$active_upstream\s\+\w\+;/set \$active_upstream $PREVIOUS_COLOR;/g" "$NGINX_SITE"

if ! sudo nginx -t; then
    echo "ERROR: Nginx config test failed after rollback change. Manual intervention required."
    exit 1
fi

sudo nginx -s reload

# ── Update state ──────────────────────────────────────────────────────────────
cat > "$STATE_FILE" <<EOF
# Blue/Green state — managed by deploy-bluegreen.sh / rollback-bluegreen.sh
ACTIVE_COLOR=$PREVIOUS_COLOR
BLUE_DIGEST=$BLUE_DIGEST
GREEN_DIGEST=$GREEN_DIGEST
LAST_ROLLBACK=$(date -Iseconds)
EOF

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ROLLBACK SUCCESSFUL"
echo "  Active color is now: $PREVIOUS_COLOR  (port $PREVIOUS_PORT)"
echo "  Time: $(date -Iseconds)"
echo "════════════════════════════════════════════════════════════════"
