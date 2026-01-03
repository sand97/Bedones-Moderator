#!/bin/sh
set -e

echo "Starting Moderateur Bedones..."

# Check if prisma directory exists
if [ ! -d "/app/prisma" ]; then
    echo "ERROR: /app/prisma directory not found!"
    ls -la /app/
    exit 1
fi

# Check if schema.prisma exists
if [ ! -f "/app/prisma/schema.prisma" ]; then
    echo "ERROR: /app/prisma/schema.prisma not found!"
    ls -la /app/prisma/
    exit 1
fi

echo "Prisma schema found at /app/prisma/schema.prisma"

# Run migrations (client already generated during build)
echo "Running database migrations..."
prisma migrate deploy --schema=/app/prisma/schema.prisma

# Start the Next.js server
echo "Starting Next.js server..."
exec node server.js
