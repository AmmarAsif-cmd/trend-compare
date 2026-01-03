#!/bin/bash
# Quick script to run the manual migration for User/Subscription tables
# Usage: ./scripts/run-manual-migration.sh

echo "🚀 Running manual migration for User and Subscription tables..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in your .env file"
    exit 1
fi

# Run the migration SQL file
echo "📊 Executing migration SQL..."
psql "$DATABASE_URL" < prisma/migrations/manual_add_user_subscription.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Run 'npx prisma generate' to update Prisma Client"
    echo "2. Deploy your app to Vercel"
    echo "3. Add Stripe environment variables to Vercel"
else
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi
