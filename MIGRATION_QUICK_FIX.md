# 🔧 Migration Quick Fix Guide

## ⚡ TL;DR

**Problem**: Old migrations are broken  
**Solution**: Run one script  
**Time**: 2 minutes  

---

## 🎯 Quick Fix (Development)

### Windows
```powershell
cd backend
.\scripts\reset-and-migrate.ps1
```
Type `yes` when prompted.

### Linux/Mac
```bash
cd backend
chmod +x scripts/reset-and-migrate.sh
./scripts/reset-and-migrate.sh
```
Type `yes` when prompted.

### What It Does
1. ✅ Backs up old migrations
2. ✅ Deletes broken migrations
3. ✅ Resets database
4. ✅ Creates clean baseline
5. ✅ Generates Prisma client

---

## ✅ After Running

### Commit New Migrations
```bash
git add backend/prisma/migrations/
git add backend/.gitignore
git commit -m "fix: create clean baseline migration"
```

### Verify
```bash
# Check tables exist
npx prisma studio

# Start backend
npm run start:dev
```

---

## 🏭 Production

### New Database
```bash
npx prisma migrate deploy
npx prisma generate
```

### Existing Database
```bash
# 1. Backup first!
pg_dump kenels_lms > backup.sql

# 2. Deploy
npx prisma migrate deploy
```

---

## 📚 Full Documentation

- `MIGRATION_FIX_COMPLETE.md` - Complete details
- `backend/MIGRATION_GUIDE.md` - Best practices
- `backend/DEPRECATED_MIGRATIONS.md` - What's deprecated

---

## ❓ Issues?

### Script won't run (Windows)
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\reset-and-migrate.ps1
```

### Database connection error
Check `.env` file has correct `DATABASE_URL`

### Prisma client errors
```bash
npx prisma generate
```

---

**Status**: ✅ Migration fix ready to use!
