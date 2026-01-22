# Prisma Migrations

## ⚠️ Important: Migration Reset Required

The existing migration `20251127121046_init` is **DEPRECATED** and should be replaced with a clean baseline migration.

### Why?

During development, we used `prisma db push` which bypassed proper migration tracking, causing:
- Schema drift
- Incomplete migrations
- Production deployment issues

### What to Do

#### Development Environment

Run the migration reset script:

**Windows (PowerShell)**:
```powershell
cd backend
.\scripts\reset-and-migrate.ps1
```

**Linux/Mac (Bash)**:
```bash
cd backend
chmod +x scripts/reset-and-migrate.sh
./scripts/reset-and-migrate.sh
```

This will:
1. ✅ Backup old migrations to `migrations_backup_[timestamp]`
2. ✅ Delete old migrations
3. ✅ Reset database
4. ✅ Create clean baseline migration
5. ✅ Generate Prisma client

#### Production Environment

**For New Deployments**:
```bash
npx prisma migrate deploy
npx prisma generate
```

**For Existing Databases**:
1. Backup database first!
2. Review `DEPRECATED_MIGRATIONS.md`
3. Follow production migration guide

### Current Migration Status

- ❌ `20251127121046_init` - **DEPRECATED** (incomplete schema)
- ✅ `[timestamp]_complete_schema_baseline` - **USE THIS** (to be created)

### After Running Script

You should see:
```
prisma/
├── migrations/
│   ├── [timestamp]_complete_schema_baseline/
│   │   └── migration.sql
│   └── migration_lock.toml
├── migrations_backup_[timestamp]/  (old migrations)
└── schema.prisma
```

### Commit New Migrations

After running the script:
```bash
git add prisma/migrations/
git commit -m "chore: create clean baseline migration"
```

### Never Again!

From now on, always use:
```bash
# Create new migration
npx prisma migrate dev --name descriptive_name

# NOT this (only for dev prototyping)
npx prisma db push
```

### Documentation

- `../MIGRATION_GUIDE.md` - Complete migration documentation
- `../DEPRECATED_MIGRATIONS.md` - Deprecation details
- `../scripts/reset-and-migrate.*` - Automated scripts

---

**Last Updated**: November 27, 2024  
**Action Required**: Run migration reset script before production deployment
