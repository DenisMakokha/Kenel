# Database Migration Guide

## Current Issue
We've been using `prisma db push` which bypasses migration history and can cause data loss. For production, we need proper migrations.

## Solution: Create Baseline Migration

### Step 1: Reset Migration History (Dev Only)
```bash
# Delete existing migrations folder
rm -rf prisma/migrations

# Create initial migration from current schema
npx prisma migrate dev --name init_baseline --create-only
```

### Step 2: Review Generated Migration
The migration file will be in `prisma/migrations/[timestamp]_init_baseline/migration.sql`

### Step 3: Apply Migration
```bash
npx prisma migrate dev
```

### Step 4: For Production
```bash
# Deploy migrations without prompts
npx prisma migrate deploy
```

## Migration Best Practices

### 1. Always Create Migrations
```bash
# Don't use: prisma db push (dev only, no history)
# Use: prisma migrate dev --name descriptive_name
```

### 2. Test Migrations
```bash
# Create migration without applying
npx prisma migrate dev --create-only --name my_change

# Review the SQL
# Edit if needed
# Then apply
npx prisma migrate dev
```

### 3. Handle Data Transformations
For complex changes (like Phase 2 & 3), create custom migration:

```sql
-- Example: Transform old column-based rules to JSONB
UPDATE loan_product_versions
SET rules = jsonb_build_object(
  'terms', jsonb_build_object(
    'min_principal', min_amount,
    'max_principal', max_amount,
    -- ... etc
  )
)
WHERE rules IS NULL;
```

## Current Schema State

### Phase 1: Auth & Users
- users
- refresh_tokens

### Phase 2: Client Management
- clients
- client_next_of_kin
- client_referees
- client_documents
- client_kyc_events

### Phase 3: Loan Products
- loan_products
- loan_product_versions
- loan_product_audit_logs

## Recommended: Create Clean Migration

Since we're in development, let's create a single baseline migration that represents the current state.

### Commands:
```bash
# 1. Backup current data (if any important data exists)
pg_dump kenels_lms > backup.sql

# 2. Drop all tables
npx prisma migrate reset --force

# 3. Create fresh migration
npx prisma migrate dev --name complete_schema_v1

# 4. Restore data if needed
psql kenels_lms < backup.sql
```

## For Production Deployment

### First Time:
```bash
# 1. Ensure DATABASE_URL is set
# 2. Run migrations
npx prisma migrate deploy

# 3. Generate Prisma Client
npx prisma generate
```

### Subsequent Deployments:
```bash
# Always run before starting the app
npx prisma migrate deploy
```

## Migration Checklist

Before deploying to production:
- [ ] All migrations tested locally
- [ ] Migration files committed to git
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Database credentials secured
- [ ] Migration tested on staging
- [ ] Downtime window planned (if needed)

## Common Issues & Solutions

### Issue: "Migration failed to apply"
**Solution**: Check the migration SQL for syntax errors or conflicts

### Issue: "Database schema is not in sync"
**Solution**: 
```bash
# Dev: Reset and recreate
npx prisma migrate reset

# Prod: Never reset! Fix forward with new migration
```

### Issue: "Drift detected"
**Solution**: Create a new migration to align schema
```bash
npx prisma migrate dev --name fix_drift
```

## Emergency: Production Migration Failed

1. **Don't panic**
2. Check error logs
3. Rollback if possible:
   ```sql
   -- Manually revert the migration
   -- Or restore from backup
   ```
4. Fix the migration
5. Test thoroughly
6. Redeploy

## Contact
For migration issues, check:
- Prisma docs: https://www.prisma.io/docs/concepts/components/prisma-migrate
- This project's migration history in `prisma/migrations/`
