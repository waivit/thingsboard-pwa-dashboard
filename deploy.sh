#!/bin/bash
# Deployment script: pull latest code and rebuild/republish the containerized static site
set -e

DEPLOY_DIR="/opt/dashboard-pwa"

echo "[deploy] Pulling latest code..."
cd "$DEPLOY_DIR"
git pull origin main

export COMMIT_SHA=$(git rev-parse --short HEAD)
echo "[deploy] Building and publishing via docker compose ($COMMIT_SHA)..."
docker compose -f docker-compose.pwa.yml up -d --build

echo "[deploy] Done."
