#!/bin/sh
set -e

echo "🚀 Starting application setup..."

# Ensure DATABASE_URL is set (default to SQLite file)
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, using default SQLite..."
  export DATABASE_URL="file:/app/data/prod.db"
fi

# Ensure data directory exists (volume may be empty on first run)
mkdir -p "$(dirname "$(echo "$DATABASE_URL" | sed 's/^file://')")" 2>/dev/null || mkdir -p /app/data

echo "📊 Running Prisma migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database with initial data..."
npm run db:seed || echo "⚠️  Seed script failed or already seeded, continuing..."

echo "✅ Database setup complete!"
echo "🌐 Starting Next.js server..."

# Run the Next.js server
exec node server.js
