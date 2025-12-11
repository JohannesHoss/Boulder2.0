#!/usr/bin/env bash
set -euo pipefail

# Ensure docker is in PATH (for non-interactive SSH sessions)
export PATH="/Applications/Docker.app/Contents/Resources/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

# Boulder Deployment Script
# Called by edge-deploy-dispatch from the infra repo
# Receives environment as first argument: pre (default) or main
#
# Deployment model:
# - pre: boulder-pre.varga.media + boulder-pre-api.varga.media (testing)
# - main: boulder.varga.media + boulder-api.varga.media (stable/production)
#
# Each environment has its own container set and SQLite database.
# This script is designed to work with two separate directories:
# - ~/apps/boulder-pre/ (for pre branch)
# - ~/apps/boulder-main/ (for main branch)

ENVIRONMENT="${1:-pre}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Validate environment
if [[ "$ENVIRONMENT" != "pre" && "$ENVIRONMENT" != "main" ]]; then
    echo "[deploy.sh] ERROR: Invalid environment '$ENVIRONMENT'. Use 'pre' or 'main'."
    exit 1
fi

echo "[deploy.sh] Deploying Boulder ($ENVIRONMENT)"
echo "[deploy.sh] Working directory: $SCRIPT_DIR"

cd "$SCRIPT_DIR"

# Set environment variables for docker-compose
export BOULDER_ENV="$ENVIRONMENT"
if [[ "$ENVIRONMENT" == "pre" ]]; then
    export BOULDER_FRONTEND_HOST="boulder-pre.varga.media"
    export BOULDER_API_HOST="boulder-pre-api.varga.media"
else
    export BOULDER_FRONTEND_HOST="boulder.varga.media"
    export BOULDER_API_HOST="boulder-api.varga.media"
fi

PROJECT_NAME="boulder-${ENVIRONMENT}"

echo "[deploy.sh] Environment: $ENVIRONMENT"
echo "[deploy.sh] Frontend host: $BOULDER_FRONTEND_HOST"
echo "[deploy.sh] API host: $BOULDER_API_HOST"
echo "[deploy.sh] Project name: $PROJECT_NAME"

# Build and start services
echo "[deploy.sh] Building and starting containers..."
docker compose -p "$PROJECT_NAME" up -d --build

# Wait for services to be ready
echo "[deploy.sh] Waiting for services to start..."
sleep 5

# Check container status
echo "[deploy.sh] Container status:"
docker compose -p "$PROJECT_NAME" ps

echo "[deploy.sh] Deployment complete!"
echo "[deploy.sh] Frontend: https://$BOULDER_FRONTEND_HOST"
echo "[deploy.sh] API: https://$BOULDER_API_HOST"
