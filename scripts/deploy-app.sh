#!/bin/bash
# Kenels LMS - Frontend App Deployment Script
# Run this on the VPS to deploy the frontend application

set -e  # Exit on any error

# Configuration - Update these paths as needed
APP_DIR="${APP_DIR:-/home/kenelsapp/public_html}"
REPO_DIR="${REPO_DIR:-/home/kenelsapi/public_html}"
FRONTEND_DIR="$REPO_DIR/frontend"
LOG_FILE="/var/log/kenels-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE" 2>/dev/null || true
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[ERROR] $1" >> "$LOG_FILE" 2>/dev/null || true
}

log "=========================================="
log "Starting Kenels Frontend Deployment"
log "=========================================="

# Navigate to repo directory
cd "$REPO_DIR" || { error "Cannot access $REPO_DIR"; exit 1; }

# Step 1: Pull latest code
log "📥 Pulling latest code from GitHub..."
git fetch origin main
git reset --hard origin/main

# Step 2: Navigate to frontend
cd "$FRONTEND_DIR" || { error "Cannot access $FRONTEND_DIR"; exit 1; }

# Step 3: Install dependencies
log "📦 Installing dependencies..."
npm ci

# Step 4: Build application
log "🔨 Building frontend application..."
npm run build

# Step 5: Copy to web directory
log "📂 Copying build files to $APP_DIR..."
rm -rf "$APP_DIR"/*
cp -r dist/* "$APP_DIR/"

# Step 6: Set permissions
log "🔐 Setting permissions..."
chmod -R 755 "$APP_DIR"

log "=========================================="
log "✅ Frontend deployment complete!"
log "=========================================="

# Show deployed files
ls -la "$APP_DIR"
