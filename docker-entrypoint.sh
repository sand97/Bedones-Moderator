#!/bin/sh
set -e

echo "=== Moderateur Bedones - Docker Entrypoint ==="

# Fix permissions for data directory
if [ -d "/app/data" ]; then
    echo "Checking /app/data permissions..."

    # Get current owner
    current_owner=$(stat -c '%u' /app/data 2>/dev/null || stat -f '%u' /app/data)

    if [ "$current_owner" != "1001" ]; then
        echo "Fixing ownership of /app/data (current owner: $current_owner, expected: 1001)"
        chown -R nextjs:nodejs /app/data
    fi

    # Ensure directory is writable
    chmod -R 755 /app/data
    echo "Permissions fixed: $(ls -ld /app/data)"
else
    echo "Creating /app/data directory..."
    mkdir -p /app/data
    chown -R nextjs:nodejs /app/data
    chmod -R 755 /app/data
fi

# Switch to nextjs user and run the start script
echo "Switching to user 'nextjs' and starting application..."
exec su-exec nextjs /usr/local/bin/start.sh
