#!/bin/bash

# Reset and Create Baseline Migration Script
# WARNING: This will delete all data! Only use in development.

echo "========================================="
echo "Database Reset & Baseline Migration"
echo "========================================="
echo ""
echo "This script will:"
echo "1. Delete old deprecated migrations"
echo "2. Delete ALL existing data"
echo "3. Drop all tables"
echo "4. Create fresh baseline migration"
echo ""
echo "⚠️  WARNING: This is DESTRUCTIVE!"
echo ""
read -p "Are you sure? (type 'yes' to continue): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Step 1: Backing up old migrations..."
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="prisma/migrations_backup_$timestamp"

if [ -d "prisma/migrations" ]; then
    mkdir -p "$backup_dir"
    cp -r prisma/migrations/* "$backup_dir/"
    echo "✓ Old migrations backed up to: $backup_dir"
fi

echo ""
echo "Step 2: Deleting old migrations..."
if [ -d "prisma/migrations" ]; then
    rm -rf prisma/migrations
    echo "✓ Old migrations deleted"
fi

echo ""
echo "Step 3: Resetting database..."
npx prisma migrate reset --force --skip-seed

echo ""
echo "Step 4: Creating baseline migration..."
npx prisma migrate dev --name complete_schema_baseline

echo ""
echo "Step 5: Generating Prisma Client..."
npx prisma generate

echo ""
echo "========================================="
echo "✅ Migration complete!"
echo "========================================="
echo ""
echo "What was done:"
echo "✓ Old migrations backed up to: $backup_dir"
echo "✓ Old migrations deleted"
echo "✓ Database reset"
echo "✓ New baseline migration created"
echo "✓ Prisma client generated"
echo ""
echo "Next steps:"
echo "1. Review the new migration in prisma/migrations/"
echo "2. Commit the new migration files to git"
echo "3. For production, use: npx prisma migrate deploy"
echo ""
echo "Note: Old migrations are in $backup_dir (can be deleted)"
echo ""
