#!/bin/bash
# Kenels LMS - Full Stack Deployment Script
# Run this on the VPS to deploy both API and Frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Kenels LMS - Full Stack Deployment"
echo "=========================================="

# Deploy API first
echo ""
echo ">>> Deploying API..."
bash "$SCRIPT_DIR/deploy-api.sh"

# Deploy Frontend
echo ""
echo ">>> Deploying Frontend..."
bash "$SCRIPT_DIR/deploy-app.sh"

echo ""
echo "=========================================="
echo "✅ Full stack deployment complete!"
echo "=========================================="
