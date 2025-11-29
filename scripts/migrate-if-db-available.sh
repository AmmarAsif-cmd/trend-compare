#!/bin/bash
# Only run migration if DATABASE_URL is set (production environment)
if [ -n "$DATABASE_URL" ]; then
  echo "📊 DATABASE_URL found - running migration..."
  npx prisma migrate deploy
  echo "✅ Migration complete!"
else
  echo "⚠️  DATABASE_URL not set - skipping migration (will run at runtime)"
fi
