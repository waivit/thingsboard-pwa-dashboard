#!/bin/bash
# Deployment script: pull latest code, build, and publish static files
set -e

DEPLOY_DIR="/opt/dashboard-pwa"
WEB_ROOT="/var/www/pwa_app"

echo "[deploy] Pulling latest code..."
cd "$DEPLOY_DIR"
git pull origin master

echo "[deploy] Installing dependencies..."
npm ci

echo "[deploy] Building..."
npm run build

echo "[deploy] Publishing to $WEB_ROOT..."
sudo cp -r dist/* "$WEB_ROOT/"

echo "[deploy] Done."
