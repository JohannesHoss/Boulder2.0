#!/usr/bin/env bash
set -euo pipefail

# Boulder Deployment Script
# Called by edge-deploy-dispatch from the infra repo
# Receives environment as first argument: prod (default)

ENVIRONMENT="${1:-prod}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[deploy.sh] Deploying Boulder (${ENVIRONMENT})"
echo "[deploy.sh] Working directory: ${SCRIPT_DIR}"

cd "${SCRIPT_DIR}"

# Boulder uses single docker-compose.yml for all environments
COMPOSE_FILES="-f docker-compose.yml"
PROJECT_NAME="boulder"

echo "[deploy.sh] Using ${ENVIRONMENT} environment configuration"

# Build and start services
echo "[deploy.sh] Building and starting containers..."
docker compose ${COMPOSE_FILES} -p "${PROJECT_NAME}" up -d --build

# Wait for services to be ready
echo "[deploy.sh] Waiting for services to start..."
sleep 5

# Check container status
echo "[deploy.sh] Container status:"
docker compose ${COMPOSE_FILES} -p "${PROJECT_NAME}" ps

echo "[deploy.sh] Deployment complete!"
echo "[deploy.sh] Frontend: https://boulder.varga.media"
echo "[deploy.sh] API: https://boulder-api.varga.media"
