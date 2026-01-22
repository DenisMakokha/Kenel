# Kenels LMS - VPS Deployment Guide

Since GitHub Actions has billing issues, use these scripts to deploy directly on your VPS.

---

## Quick Start (First Time Setup)

### 1. SSH into your VPS

```bash
ssh deploy@198.38.91.116
```

### 2. Clone the repository

```bash
cd /home/kenelsapi/public_html
git clone https://github.com/DenisMakokha/Kenel.git .
```

### 3. Create backend .env file

```bash
cat > /home/kenelsapi/public_html/backend/.env << 'EOF'
DATABASE_URL="postgresql://user:password@localhost:5432/kenels_lms"
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=production
CORS_ORIGIN="https://kenels.app"
EOF
```

### 4. Make scripts executable

```bash
chmod +x /home/kenelsapi/public_html/scripts/*.sh
```

### 5. Run initial deployment

```bash
bash /home/kenelsapi/public_html/scripts/deploy-full.sh
```

---

## Deployment Scripts

| Script | Purpose |
|--------|---------|
| `scripts/deploy-api.sh` | Deploy backend API with migrations |
| `scripts/deploy-app.sh` | Deploy frontend application |
| `scripts/deploy-full.sh` | Deploy both API and frontend |
| `scripts/setup-auto-deploy.sh` | Set up automatic deployment via cron |

---

## Manual Deployment

### Deploy API only (with migrations)

```bash
cd /home/kenelsapi/public_html
bash scripts/deploy-api.sh
```

### Deploy Frontend only

```bash
cd /home/kenelsapi/public_html
bash scripts/deploy-app.sh
```

### Deploy Everything

```bash
cd /home/kenelsapi/public_html
bash scripts/deploy-full.sh
```

---

## Automatic Deployment (Cron-based)

Set up automatic deployment that checks for new commits every 5 minutes:

```bash
sudo bash /home/kenelsapi/public_html/scripts/setup-auto-deploy.sh
```

This will:
- Check GitHub for new commits every 5 minutes
- Automatically deploy when changes are detected
- Run migrations automatically
- Log all deployments to `/var/log/kenels-auto-deploy.log`

### View auto-deploy logs

```bash
tail -f /var/log/kenels-auto-deploy.log
```

### Change auto-deploy schedule

```bash
crontab -e
```

Common schedules:
- `*/5 * * * *` - Every 5 minutes
- `*/2 * * * *` - Every 2 minutes
- `0 * * * *` - Every hour
- `*/1 * * * *` - Every minute (not recommended)

---

## Database Migrations

Migrations run automatically during deployment. To run manually:

```bash
cd /home/kenelsapi/public_html/backend

# Check migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy

# View migration history (in database)
psql $DATABASE_URL -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;"
```

---

## PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs kenels-api

# Restart API
pm2 restart kenels-api

# Stop API
pm2 stop kenels-api

# Delete and recreate
pm2 delete kenels-api
pm2 start /home/kenelsapi/public_html/backend/dist/main.js --name kenels-api
pm2 save
```

---

## Troubleshooting

### API not starting

```bash
# Check logs
pm2 logs kenels-api --lines 50

# Check if port is in use
lsof -i :3000

# Try starting manually
cd /home/kenelsapi/public_html/backend
node dist/main.js
```

### Migration failed

```bash
cd /home/kenelsapi/public_html/backend

# Check status
npx prisma migrate status

# If stuck, resolve manually
npx prisma migrate resolve --applied MIGRATION_NAME
# or
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

### Frontend not updating

```bash
# Check nginx cache
sudo nginx -t
sudo systemctl reload nginx

# Clear browser cache or hard refresh (Ctrl+Shift+R)
```

---

## Server Requirements

- **Node.js 20.x**
- **PM2** (process manager)
- **PostgreSQL** (database)
- **Nginx** (web server for frontend)
- **Git**

### Install if missing

```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
npm install -g pm2

# Set PM2 to start on boot
pm2 startup
pm2 save
```
