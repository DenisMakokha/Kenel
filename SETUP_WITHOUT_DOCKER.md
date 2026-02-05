# 🚀 Setup Without Docker - Local PostgreSQL

**For Windows machines without Docker**

---

## 📋 Prerequisites

### 1. Install PostgreSQL Locally

**Download PostgreSQL 15+**:
- Visit: https://www.postgresql.org/download/windows/
- Download the installer
- Run installer and follow these settings:
  - Port: `5432` (default)
  - Password: Choose a strong password (remember this!)
  - Locale: Default

**Verify Installation**:
```bash
# Check PostgreSQL is running
psql --version
```

### 2. Create Database

**Option A: Using pgAdmin** (comes with PostgreSQL):
1. Open pgAdmin
2. Connect to PostgreSQL server
3. Right-click "Databases" → Create → Database
4. Name: `kenels_lms`
5. Click Save

**Option B: Using Command Line**:
```bash
# Open Command Prompt or PowerShell
psql -U postgres

# In psql prompt:
CREATE DATABASE kenels_lms;
\q
```

---

## ⚙️ Environment Configuration

Update your `.env` file with local PostgreSQL connection:

```env
# Database - Update with your PostgreSQL password
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/kenels_lms?schema=public"

# JWT Secrets
JWT_SECRET="kenels-jwt-secret-change-in-production-2024"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="kenels-refresh-secret-change-in-production-2024"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Application
NODE_ENV="development"
PORT=3000
API_PREFIX="api/v1"
FRONTEND_URL="http://localhost:5173"

# CORS
CORS_ORIGIN="http://localhost:5173"
CORS_CREDENTIALS="true"

# File Upload
STORAGE_TYPE="local"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL="debug"
LOG_FORMAT="json"

# Encryption (for PII fields)
ENCRYPTION_KEY="kenels-encryption-key-32-chars"
ENCRYPTION_ALGORITHM="aes-256-gcm"
```

**Important**: Replace `YOUR_PASSWORD` with your actual PostgreSQL password!

---

## 📦 Install Dependencies

### Backend

```bash
cd C:\Users\DenisMakokha\CascadeProjects\kenels-lms\backend

# Install all dependencies
pnpm install

# This will install:
# - NestJS framework
# - Prisma ORM
# - Passport.js & JWT
# - Argon2 for password hashing
# - All other dependencies
```

### Frontend

```bash
cd C:\Users\DenisMakokha\CascadeProjects\kenels-lms\frontend

# Install all dependencies
pnpm install

# This will install:
# - React 18
# - Vite
# - Tailwind CSS
# - Shadcn/UI
# - TanStack Query
# - All other dependencies
```

---

## 🗄️ Database Setup

```bash
cd backend

# 1. Generate Prisma Client
pnpm prisma:generate

# 2. Create initial migration
pnpm prisma migrate dev --name init

# 3. Verify database
pnpm prisma studio
```

This will:
- Generate TypeScript types from your schema
- Create all 20 tables in PostgreSQL
- Open Prisma Studio to view your database

---

## 🌱 Seed Database

Create seed file with test users:

**File**: `backend/prisma/seed.ts`

```typescript
import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await argon2.hash('<ADMIN_PASSWORD>');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create credit officer
  const officerPassword = await argon2.hash('<CREDIT_OFFICER_PASSWORD>');
  const officer = await prisma.user.upsert({
    where: { email: 'officer@example.com' },
    update: {},
    create: {
      email: 'officer@example.com',
      password: officerPassword,
      firstName: 'Credit',
      lastName: 'Officer',
      role: UserRole.CREDIT_OFFICER,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ Credit Officer created:', officer.email);

  // Create finance officer
  const financePassword = await argon2.hash('<FINANCE_OFFICER_PASSWORD>');
  const finance = await prisma.user.upsert({
    where: { email: 'finance@example.com' },
    update: {},
    create: {
      email: 'finance@example.com',
      password: financePassword,
      firstName: 'Finance',
      lastName: 'Officer',
      role: UserRole.FINANCE_OFFICER,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ Finance Officer created:', finance.email);

  // Create test client
  const clientPassword = await argon2.hash('<CLIENT_PASSWORD>');
  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      password: clientPassword,
      firstName: 'Test',
      lastName: 'Client',
      role: UserRole.CLIENT,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ Test Client created:', client.email);

  console.log('\n🎉 Seeding completed!');
  console.log('\nTest Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:          admin@example.com / <ADMIN_PASSWORD>');
  console.log('Credit Officer: officer@example.com / <CREDIT_OFFICER_PASSWORD>');
  console.log('Finance:        finance@example.com / <FINANCE_OFFICER_PASSWORD>');
  console.log('Client:         client@example.com / <CLIENT_PASSWORD>');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run seed**:
```bash
pnpm prisma:seed
```

---

## 🚀 Start Development Servers

### Terminal 1: Backend

```bash
cd backend
pnpm dev
```

**Expected output**:
```
🚀 Kenels Bureau LMS API is running!

📍 API: http://localhost:3000/api/v1
📚 Docs: http://localhost:3000/api/docs
🌍 Environment: development
```

### Terminal 2: Frontend

```bash
cd frontend
pnpm dev
```

**Expected output**:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## ✅ Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `kenels_lms` created
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] `.env` file configured with correct password
- [ ] Prisma Client generated
- [ ] Migrations applied (20 tables created)
- [ ] Seed data created (4 test users)
- [ ] Backend server running on port 3000
- [ ] Frontend server running on port 5173
- [ ] Swagger docs accessible at http://localhost:3000/api/docs
- [ ] No errors in terminal

---

## 🧪 Test Authentication

### Using Swagger UI (Recommended)

1. Open http://localhost:3000/api/docs
2. Try the `/auth/login` endpoint
3. Use credentials: `admin@example.com` / `<ADMIN_PASSWORD>`
4. Copy the `accessToken` from response
5. Click "Authorize" button at top
6. Paste token and click "Authorize"
7. Try protected endpoints like `/auth/me`

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"<ADMIN_PASSWORD>\"}"

# Get current user (replace TOKEN with accessToken from login)
curl -X GET http://localhost:3000/api/v1/auth/me ^
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔧 Troubleshooting

### PostgreSQL Not Running

**Check service**:
```bash
# Windows Services
services.msc
# Look for "postgresql-x64-15" and ensure it's running
```

**Start service**:
```bash
# PowerShell (as Administrator)
Start-Service postgresql-x64-15
```

### Connection Error

**Error**: `Can't reach database server`

**Solution**:
1. Verify PostgreSQL is running
2. Check password in `.env` matches PostgreSQL password
3. Verify database `kenels_lms` exists
4. Check port 5432 is not blocked

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
cd backend
pnpm prisma:generate
```

---

## 📝 Daily Development Workflow

### Starting Work

```bash
# Terminal 1: Backend
cd backend
pnpm dev

# Terminal 2: Frontend
cd frontend
pnpm dev
```

### Stopping Work

- Press `Ctrl+C` in both terminals
- PostgreSQL keeps running in background (no need to stop)

---

## 🎯 Success Indicators

You're ready when:

✅ Backend runs without errors  
✅ Frontend loads successfully  
✅ Swagger docs accessible  
✅ Can login with test credentials  
✅ Protected routes work with token  
✅ Database has 20 tables  
✅ 4 test users exist  

---

## 📞 Need Help?

Common issues and solutions documented above. If you encounter other issues:

1. Check PostgreSQL is running
2. Verify `.env` configuration
3. Ensure all dependencies installed
4. Check terminal for error messages

---

**Setup Time**: ~15 minutes  
**Status**: Ready for development!

---

*Kenels Bureau LMS - Local Setup Complete* 🚀
