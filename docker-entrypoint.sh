#!/bin/sh
set -e

echo "🚀 Starting application setup..."

# Ensure DATABASE_URL is set (default to SQLite file)
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, using default SQLite..."
  export DATABASE_URL="file:/app/data/prod.db"
fi

DB_FILE="$(dirname "$(echo "$DATABASE_URL" | sed 's/^file://')")"

# Ensure data directory exists (volume may be empty on first run)
mkdir -p "$DB_FILE" 2>/dev/null || mkdir -p /app/data

FIRST_RUN=0

# Detect first run: database file does not exist yet, or exists but has no tables
if [ ! -f "$DB_FILE/prod.db" ]; then
  FIRST_RUN=1
  echo "ℹ️  Database file not found — first run detected."
else
  # Check if the User table exists (core table created by the first migration)
  TABLE_COUNT=$(echo "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='User';" | npx prisma db execute --stdin 2>/dev/null; echo "")
  if [ "$TABLE_COUNT" = "0" ]; then
    FIRST_RUN=1
    echo "ℹ️  Database is empty — first run detected."
  else
    echo "ℹ️  Existing database detected — skipping initial setup."
  fi
fi

if [ "$FIRST_RUN" = "1" ]; then
  echo "📊 Running Prisma migrations (first run only)..."
  npx prisma migrate deploy

  echo "🌱 Seeding database (admin account only)..."
  npm run db:seed:prod
else
  # Apply pending migrations safely (idempotent — no-op if already up to date)
  echo "📊 Checking for pending migrations..."
  npx prisma migrate deploy
fi

echo "✅ Database setup complete!"
echo "🌐 Starting Next.js server..."

# Run the Next.js server
exec node server.js
