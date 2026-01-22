# Deprecated Migrations

## ⚠️ WARNING: Old Migrations Are Deprecated

The migrations created before **November 27, 2024** are **DEPRECATED** and should not be used.

### Why?

During Phase 2 and Phase 3 development, we used `prisma db push` instead of proper migrations, which caused:
- Migration drift
- Inconsistent schema state
- Data loss risks
- Production deployment issues

### What Was Wrong?

**Old Migration**: `20251127121046_init`
- Created with incomplete schema
- Missing Phase 2 enhancements (documents, timeline)
- Missing Phase 3 enhancements (JSONB rules, audit logs)
- Caused drift errors

### Solution

We've created a **clean baseline migration** that includes:
- ✅ Complete Phase 1 (Auth & Users)
- ✅ Complete Phase 2 (Client Management + Documents + Timeline)
- ✅ Complete Phase 3A (Loan Products + Versions + Audit)
- ✅ All enums and indexes
- ✅ All foreign keys and constraints

### How to Fix

#### For Development (Safe - Will Delete Data)

```powershell
# Windows PowerShell
cd backend
.\scripts\reset-and-migrate.ps1
```

```bash
# Linux/Mac
cd backend
./scripts/reset-and-migrate.sh
```

This will:
1. Delete old migrations folder
2. Reset database
3. Create fresh baseline migration
4. Generate Prisma client

#### For Production (Careful!)

**Option 1: Fresh Database (Recommended for new deployments)**
```bash
# 1. Ensure DATABASE_URL points to new database
# 2. Run migrations
npx prisma migrate deploy

# 3. Generate client
npx prisma generate
```

**Option 2: Existing Database with Data**
```bash
# 1. Backup database
pg_dump your_database > backup_$(date +%Y%m%d).sql

# 2. Mark current state as baseline
npx prisma migrate resolve --applied 20251127121046_init

# 3. Create new migration for changes
npx prisma migrate dev --name fix_schema_drift

# 4. Review and test thoroughly before production
```

### Migration History

#### Deprecated Migrations (DO NOT USE)
- ❌ `20251127121046_init` - Incomplete, causes drift

#### Current Migrations (USE THESE)
- ✅ `[timestamp]_complete_schema_baseline` - Complete schema (to be created)

### Checklist Before Production

- [ ] Backup production database
- [ ] Test migration on staging
- [ ] Verify all tables exist
- [ ] Verify all data intact
- [ ] Test critical user flows
- [ ] Have rollback plan ready

### Emergency Rollback

If migration fails in production:

```bash
# 1. Restore from backup
psql your_database < backup_YYYYMMDD.sql

# 2. Investigate error
# 3. Fix migration
# 4. Test on staging
# 5. Retry
```

### Support

For migration issues:
1. Check `MIGRATION_GUIDE.md`
2. Review Prisma docs: https://www.prisma.io/docs/concepts/components/prisma-migrate
3. Check error logs
4. Test on dev/staging first

---

**Last Updated**: November 27, 2024  
**Status**: Old migrations deprecated, new baseline required
