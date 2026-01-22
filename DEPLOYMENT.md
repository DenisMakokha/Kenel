# Kenels LMS Deployment Guide

## GitHub Actions CI/CD Setup

This project uses GitHub Actions for automated deployment. Three workflow files are configured:

### Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| Deploy API | `deploy-api.yml` | Push to `main` (backend changes) | Deploys NestJS API with migrations |
| Deploy App | `deploy-app.yml` | Push to `main` (frontend changes) | Builds & deploys React frontend |
| Deploy Full | `deploy-full.yml` | Manual trigger | Full stack deployment with options |

---

## GitHub Secrets Configuration

Navigate to: **GitHub → Settings → Secrets and variables → Actions**

### Required Secrets

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SSH_HOST` | `198.38.91.116` | Server IP address |
| `SSH_USER` | `deploy` | SSH username for deployment |
| `SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Full private SSH key content |
| `API_DIR` | `/home/kenelsapi/public_html` | Backend deployment directory |
| `APP_DIR` | `/home/kenelsapp/public_html` | Frontend deployment directory |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | PostgreSQL connection string |
| `VITE_API_URL` | `https://api.kenels.app` | API URL for frontend (optional) |

### Adding Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name and value

---

## Server Prerequisites

Before first deployment, ensure the server has:

### For API Server (`kenelsapi`)

```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 for process management
npm install -g pm2

# Git
sudo apt-get install -y git

# Clone repository (first time only)
cd /home/kenelsapi/public_html
git clone https://github.com/YOUR_USERNAME/kenels-lms.git .
git checkout main

# Initial setup
cd backend
npm install
npx prisma generate
DATABASE_URL="your_connection_string" npx prisma migrate deploy
npm run build
pm2 start dist/main.js --name kenels-api
pm2 save
pm2 startup
```

### For App Server (`kenelsapp`)

The frontend is static files - just ensure the web server (nginx/apache) is configured to serve from `APP_DIR`.

**Nginx example:**
```nginx
server {
    listen 80;
    server_name kenels.app;
    root /home/kenelsapp/public_html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Deployment Flow

### Automatic Deployment (on push to main)

#### Backend Deployment Pipeline (3 Stages)

When you push backend changes to `main`, the deployment runs in **3 safe stages**:

**Stage 1: Pre-Deploy (Validation)**
- ✅ Checks for pending migrations
- ✅ Validates Prisma schema syntax
- ✅ Outputs migration status

**Stage 2: Migrate (Only if needed)**
- ⚠️ Only runs if pending migrations detected
- 📋 Records migration state BEFORE applying
- 🔄 Applies only unrun migrations (`prisma migrate deploy`)
- 📋 Records migration state AFTER applying
- ✅ Logs all changes for audit trail

**Stage 3: Deploy (After migrations succeed)**
- 📥 Pulls latest code
- 📦 Installs dependencies
- 🔨 Builds application
- 🚀 Restarts PM2 process

#### How Migration Tracking Works

Prisma tracks migrations in the `_prisma_migrations` table:

| Column | Purpose |
|--------|---------|
| `id` | Unique migration ID |
| `migration_name` | e.g., `20241222_add_user_roles` |
| `started_at` | When migration started |
| `finished_at` | When migration completed |
| `applied_steps_count` | Number of SQL statements applied |

**Only unrun migrations are applied** - Prisma checks this table and skips already-applied migrations.

#### Frontend Deployment

When you push frontend changes to `main`:
- Build locally on GitHub runner
- SCP dist files to server

### Manual Full Deployment

1. Go to **Actions** tab in GitHub
2. Select **Deploy Full Stack**
3. Click **Run workflow**
4. Choose options:
   - Deploy API: ✓
   - Deploy Frontend App: ✓
   - Run database migrations: ✓

---

## Database Migrations

Migrations run automatically during API deployment using:

```bash
npx prisma migrate deploy
```

This command:
- Applies all pending migrations
- Is safe for production (doesn't reset data)
- Fails safely if migrations have issues

### Manual Migration (if needed)

```bash
ssh deploy@198.38.91.116
cd /home/kenelsapi/public_html/backend
DATABASE_URL="your_connection_string" npx prisma migrate deploy
```

---

## Environment Variables

### Backend (.env on server)

Create `/home/kenelsapi/public_html/backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kenels_lms"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# App
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGIN="https://kenels.app"
```

### Frontend (build-time via GitHub Secrets)

The `VITE_API_URL` secret is injected during build.

---

## Troubleshooting

### Check API Status
```bash
ssh deploy@198.38.91.116
pm2 status
pm2 logs kenels-api --lines 50
```

### Restart API
```bash
pm2 restart kenels-api
```

### Check Migration Status
```bash
cd /home/kenelsapi/public_html/backend
npx prisma migrate status
```

### Rollback Migration (manual)
```bash
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

---

## SSH Key Setup

Generate a deploy key (if not exists):

```bash
ssh-keygen -t ed25519 -C "deploy@kenels-lms" -f ~/.ssh/kenels_deploy
```

Add public key to server:
```bash
ssh-copy-id -i ~/.ssh/kenels_deploy.pub deploy@198.38.91.116
```

Add private key content to GitHub secret `SSH_KEY`.

---

## Checklist Before First Deploy

- [ ] GitHub repository created and code pushed
- [ ] All GitHub secrets configured
- [ ] SSH key added to server's `authorized_keys`
- [ ] Node.js 20.x installed on API server
- [ ] PM2 installed globally on API server
- [ ] PostgreSQL database created and accessible
- [ ] Initial `git clone` done on server
- [ ] Backend `.env` file created on server
- [ ] Nginx/Apache configured for frontend
- [ ] SSL certificates configured (recommended)
