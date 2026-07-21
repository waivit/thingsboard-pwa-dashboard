#!/bin/bash
# Deployment script: pull latest code, build, and (re)publish the static site container
set -e

DEPLOY_DIR="/opt/dashboard-pwa"

echo "[deploy] Pulling latest code..."
cd "$DEPLOY_DIR"
git pull origin main

echo "[deploy] Installing dependencies..."
npm ci

echo "[deploy] Building..."
npm run build

echo "[deploy] Publishing via docker compose..."
docker compose -f docker-compose.pwa.yml up -d

echo "[deploy] Done."
