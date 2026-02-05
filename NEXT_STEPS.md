# 🚀 Next Steps - After Installation

**Current Status**: Dependencies installing...

---

## ✅ Step 1: Verify Installation Complete

Wait for both installations to finish. You'll see:

**Backend**:
```
Packages: +XXX
Progress: resolved XXX, downloaded XXX, added XXX, done
```

**Frontend**:
```
Packages: +XXX  
Progress: resolved XXX, downloaded XXX, added XXX, done
```

---

## 📦 Step 2: Setup PostgreSQL

### Option A: Already Installed?

Check if PostgreSQL is running:
```bash
psql --version
```

If installed, skip to "Create Database" below.

### Option B: Install PostgreSQL

1. **Download**: https://www.postgresql.org/download/windows/
2. **Install** with these settings:
   - Port: `5432`
   - Password: Choose and **remember it**!
   - Locale: Default
3. **Verify**: Open pgAdmin (comes with PostgreSQL)

### Create Database

**Using pgAdmin**:
1. Open pgAdmin
2. Connect to PostgreSQL
3. Right-click "Databases" → Create → Database
4. Name: `kenels_lms`
5. Save

**OR using Command Line**:
```bash
psql -U postgres
CREATE DATABASE kenels_lms;
\q
```

---

## ⚙️ Step 3: Configure Environment

1. **Copy environment file**:
```bash
cd backend
copy .env.example .env
```

2. **Edit `.env`** file:
   - Open `backend/.env` in your editor
   - Find: `DATABASE_URL="postgresql://postgres:password@localhost:5432/kenels_lms?schema=public"`
   - Replace `password` with your PostgreSQL password
   - Save file

Example:
```env
DATABASE_URL="postgresql://postgres:MyPass123@localhost:5432/kenels_lms?schema=public"
```

---

## 🗄️ Step 4: Setup Database Tables

```bash
cd C:\Users\DenisMakokha\CascadeProjects\kenels-lms\backend

# Generate Prisma Client
pnpm prisma:generate

# Create tables (run migrations)
pnpm prisma migrate dev --name init

# Seed test users
pnpm prisma:seed
```

**Expected Output**:
```
✅ Admin user created: admin@example.com
✅ Credit Officer created: officer@example.com
✅ Finance Officer created: finance@example.com
✅ Test Client created: client@example.com

🎉 Seeding completed!
```

---

## 🚀 Step 5: Start Development Servers

### Terminal 1: Backend

```bash
cd C:\Users\DenisMakokha\CascadeProjects\kenels-lms\backend
pnpm dev
```

**Wait for**:
```
🚀 Kenels Bureau LMS API is running!

📍 API: http://localhost:3000/api/v1
📚 Docs: http://localhost:3000/api/docs
🌍 Environment: development
```

### Terminal 2: Frontend

Open a **new terminal**:

```bash
cd C:\Users\DenisMakokha\CascadeProjects\kenels-lms\frontend
pnpm dev
```

**Wait for**:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## 🧪 Step 6: Test Authentication

### Option A: Using Swagger UI (Easiest)

1. Open browser: http://localhost:3000/api/docs
2. Find `POST /auth/login`
3. Click "Try it out"
4. Use credentials:
   ```json
   {
     "email": "admin@example.com",
     "password": "<ADMIN_PASSWORD>"
   }
   ```
5. Click "Execute"
6. Copy the `accessToken` from response
7. Click "Authorize" button at top
8. Paste token and authorize
9. Try `GET /auth/me` endpoint

### Option B: Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"<ADMIN_PASSWORD>\"}"

# Copy the accessToken from response, then:
curl -X GET http://localhost:3000/api/v1/auth/me ^
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] PostgreSQL installed and running
- [ ] Database `kenels_lms` created
- [ ] Backend dependencies installed (check `backend/node_modules/` exists)
- [ ] Frontend dependencies installed (check `frontend/node_modules/` exists)
- [ ] `.env` file configured with correct password
- [ ] Prisma Client generated
- [ ] Database tables created (20 tables)
- [ ] Test users seeded (4 users)
- [ ] Backend running on http://localhost:3000
- [ ] Frontend running on http://localhost:5173
- [ ] Swagger docs accessible
- [ ] Can login with test credentials
- [ ] Can access protected endpoints

---

## 🎯 Test Credentials

```
Admin User:
  Email: admin@example.com
  Password: <SET_DURING_SEEDING>
  Role: ADMIN

Credit Officer:
  Email: officer@example.com
  Password: <SET_DURING_SEEDING>
  Role: CREDIT_OFFICER

Finance Officer:
  Email: finance@example.com
  Password: <SET_DURING_SEEDING>
  Role: FINANCE_OFFICER

Test Client:
  Email: client@example.com
  Password: <SET_DURING_SEEDING>
  Role: CLIENT
```

---

## 🔧 Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"

**Solution**:
```bash
cd backend
pnpm prisma:generate
```

### Issue: "Can't reach database server"

**Solutions**:
1. Check PostgreSQL is running (open pgAdmin or Services)
2. Verify password in `.env` is correct
3. Ensure database `kenels_lms` exists
4. Check port 5432 is not blocked

### Issue: "Port 3000 already in use"

**Solution**:
```bash
# Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Prisma migration fails

**Solution**:
```bash
cd backend
pnpm prisma migrate reset
pnpm prisma migrate dev --name init
```

---

## 📚 Documentation Reference

- **Setup Guide**: `SETUP_WITHOUT_DOCKER.md`
- **Phase 1 Details**: `PHASE_1_COMPLETE.md`
- **Project Plan**: `PROJECT_MASTER_PLAN.md`
- **Implementation Roadmap**: `IMPLEMENTATION_ROADMAP.md`

---

## 🎉 What's Next?

Once everything is working:

1. **Explore the API**
   - Try all auth endpoints in Swagger
   - Test role-based access
   - Try creating/updating users (Admin only)

2. **Review the Code**
   - Check `backend/src/auth/` - Authentication logic
   - Check `backend/src/users/` - User management
   - Check `backend/prisma/schema.prisma` - Database schema

3. **Start Phase 2**
   - Build Client Management module
   - Add document upload
   - Implement KYC workflow

---

## ⏱️ Estimated Time

- PostgreSQL Setup: 10 minutes
- Database Configuration: 5 minutes
- Database Migration: 2 minutes
- Testing: 10 minutes

**Total**: ~30 minutes

---

## 📞 Need Help?

If you encounter issues:

1. Check the error message carefully
2. Verify PostgreSQL is running
3. Check `.env` configuration
4. Review `SETUP_WITHOUT_DOCKER.md`
5. Check terminal output for errors

---

**Current Step**: Wait for installations to complete  
**Next Step**: Setup PostgreSQL database  
**Status**: Ready to proceed once installations finish

---

*Kenels Bureau LMS - Next Steps Guide* 🚀
