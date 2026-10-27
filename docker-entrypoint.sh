#!/bin/sh
set -e

echo "🚀 Starting application setup..."

# Ensure DATABASE_URL is set (default to SQLite file)
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, using default SQLite..."
  export DATABASE_URL="file:./data/prod.db"
  mkdir -p ./data
fi

echo "📊 Running Prisma migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database with initial data..."
npm run db:seed || echo "⚠️  Seed script failed or already seeded, continuing..."

echo "✅ Database setup complete!"
echo "🌐 Starting Next.js server..."

# Run the Next.js server
exec node server.js
