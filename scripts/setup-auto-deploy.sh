#!/bin/bash
# Kenels LMS - Auto-Deploy Setup Script
# Run this ONCE on the VPS to set up automatic deployment via cron

set -e

# Configuration
API_DIR="${API_DIR:-/home/kenelsapi/public_html}"
DEPLOY_SCRIPT="$API_DIR/scripts/deploy-full.sh"
CRON_SCHEDULE="${CRON_SCHEDULE:-*/5 * * * *}"  # Every 5 minutes by default

echo "=========================================="
echo "Kenels LMS - Auto-Deploy Setup"
echo "=========================================="

# Create a wrapper script that checks for updates
cat > /usr/local/bin/kenels-auto-deploy << 'SCRIPT'
#!/bin/bash
# Auto-deploy script - checks for new commits and deploys if found

API_DIR="/home/kenelsapi/public_html"
LOCK_FILE="/tmp/kenels-deploy.lock"
LOG_FILE="/var/log/kenels-auto-deploy.log"
MAX_LOG_SIZE=10485760  # 10MB

# Rotate log if too large
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null) -gt $MAX_LOG_SIZE ]; then
    mv "$LOG_FILE" "$LOG_FILE.old"
fi

# Prevent concurrent runs
if [ -f "$LOCK_FILE" ]; then
    # Check if lock is stale (older than 30 minutes)
    if [ $(find "$LOCK_FILE" -mmin +30 2>/dev/null | wc -l) -gt 0 ]; then
        echo "[$(date)] Removing stale lock file" >> "$LOG_FILE"
        rm -f "$LOCK_FILE"
    else
        exit 0
    fi
fi

touch "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

cd "$API_DIR" || exit 1

# Fetch latest from remote
git fetch origin main --quiet 2>> "$LOG_FILE"

# Check if there are new commits
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    echo "[$(date)] New commits detected" >> "$LOG_FILE"
    echo "  Local:  $LOCAL" >> "$LOG_FILE"
    echo "  Remote: $REMOTE" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    
    # Run deployment and capture exit code
    bash "$API_DIR/scripts/deploy-full.sh" >> "$LOG_FILE" 2>&1
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo "[$(date)] ✅ Deployment successful" >> "$LOG_FILE"
    else
        echo "[$(date)] ❌ Deployment FAILED with exit code $EXIT_CODE" >> "$LOG_FILE"
    fi
fi
SCRIPT

chmod +x /usr/local/bin/kenels-auto-deploy

echo "✅ Created /usr/local/bin/kenels-auto-deploy"

# Add to crontab
(crontab -l 2>/dev/null | grep -v "kenels-auto-deploy"; echo "$CRON_SCHEDULE /usr/local/bin/kenels-auto-deploy") | crontab -

echo "✅ Added cron job: $CRON_SCHEDULE"
echo ""
echo "Auto-deploy is now configured!"
echo ""
echo "The system will check for new commits every 5 minutes."
echo "When new commits are found, it will automatically:"
echo "  1. Pull the latest code"
echo "  2. Run database migrations"
echo "  3. Build and restart the API"
echo "  4. Build and deploy the frontend"
echo ""
echo "View logs: tail -f /var/log/kenels-auto-deploy.log"
echo "Manual deploy: bash $API_DIR/scripts/deploy-full.sh"
echo ""
echo "To change the schedule, edit crontab: crontab -e"
