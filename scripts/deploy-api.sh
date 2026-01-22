#!/bin/bash
# Kenels LMS - API Deployment Script
# Run this on the VPS to deploy the backend API with migrations

set -e  # Exit on any error

# Configuration - Update these paths as needed
API_DIR="${API_DIR:-/home/kenelsapi/public_html}"
BACKEND_DIR="$API_DIR/backend"
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

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    if [ -f "$BACKEND_DIR/.env" ]; then
        export $(grep -v '^#' "$BACKEND_DIR/.env" | xargs)
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL is not set. Please set it in .env or as environment variable."
        exit 1
    fi
fi

log "=========================================="
log "Starting Kenels API Deployment"
log "=========================================="

# Navigate to project directory
cd "$API_DIR" || { error "Cannot access $API_DIR"; exit 1; }

# Step 1: Pull latest code
log "📥 Pulling latest code from GitHub..."
git fetch origin main
git reset --hard origin/main

# Step 2: Navigate to backend
cd "$BACKEND_DIR" || { error "Cannot access $BACKEND_DIR"; exit 1; }

# Step 3: Check migration status BEFORE
log "📋 Checking migration status (before)..."
MIGRATION_STATUS_BEFORE=$(npx prisma migrate status 2>&1) || true
echo "$MIGRATION_STATUS_BEFORE"

# Check if there are pending migrations
if echo "$MIGRATION_STATUS_BEFORE" | grep -q "Following migration"; then
    PENDING_MIGRATIONS=true
    warn "⚠️ Pending migrations detected"
else
    PENDING_MIGRATIONS=false
    log "✅ No pending migrations"
fi

# Step 4: Install dependencies
log "📦 Installing dependencies..."
npm ci --production=false

# Step 5: Generate Prisma client
log "🗄️ Generating Prisma client..."
npx prisma generate

# Step 6: Run migrations (only if pending)
if [ "$PENDING_MIGRATIONS" = true ]; then
    log "🔄 Running database migrations..."
    
    # Try to deploy migrations, handle P3005 error (non-baselined DB)
    MIGRATE_OUTPUT=$(npx prisma migrate deploy 2>&1) || {
        if echo "$MIGRATE_OUTPUT" | grep -q "P3005"; then
            warn "⚠️ Database not baselined. Attempting to baseline existing migrations..."
            
            # Get list of migration folders and mark them as applied
            for migration in $(ls -1 prisma/migrations/ | grep -E '^[0-9]+' | sort); do
                log "  Marking $migration as applied..."
                npx prisma migrate resolve --applied "$migration" 2>/dev/null || true
            done
            
            # Try deploy again
            log "🔄 Retrying migration deploy..."
            npx prisma migrate deploy || {
                error "❌ Migration failed even after baselining"
                exit 1
            }
        else
            echo "$MIGRATE_OUTPUT"
            error "❌ Migration failed"
            exit 1
        fi
    }
    
    log "📋 Checking migration status (after)..."
    npx prisma migrate status
else
    log "⏭️ Skipping migrations (none pending)"
fi

# Step 7: Build application
log "🔨 Building application..."
npm run build

# Step 8: Restart PM2
log "🚀 Restarting application..."
if pm2 describe kenels-api > /dev/null 2>&1; then
    pm2 restart kenels-api
    log "✅ Restarted existing PM2 process"
else
    pm2 start dist/main.js --name kenels-api
    pm2 save
    log "✅ Started new PM2 process"
fi

# Step 9: Health check
log "🏥 Running health check..."
sleep 3
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    log "✅ API is healthy!"
else
    warn "⚠️ Health check failed - API may still be starting"
fi

log "=========================================="
log "✅ Deployment complete!"
log "=========================================="

# Show PM2 status
pm2 status
