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

# Prevent concurrent runs
if [ -f "$LOCK_FILE" ]; then
    exit 0
fi

touch "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

cd "$API_DIR" || exit 1

# Fetch latest from remote
git fetch origin main --quiet

# Check if there are new commits
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "[$(date)] New commits detected, deploying..." >> "$LOG_FILE"
    
    # Run deployment
    bash "$API_DIR/scripts/deploy-full.sh" >> "$LOG_FILE" 2>&1
    
    echo "[$(date)] Deployment complete" >> "$LOG_FILE"
else
    # Uncomment below line to log when no updates found
    # echo "[$(date)] No updates" >> "$LOG_FILE"
    :
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
