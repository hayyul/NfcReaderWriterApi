#!/bin/bash
set -e

echo "=== RENDER START SCRIPT ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

echo ""
echo "=== Checking for dist folder ==="
if [ -d "dist" ]; then
    echo "✓ dist folder exists"
    echo "Contents:"
    ls -la dist/
else
    echo "✗ ERROR: dist folder NOT FOUND!"
    echo "Searching for dist folder..."
    find . -name "dist" -type d 2>/dev/null || echo "No dist folder found anywhere"
    exit 1
fi

echo ""
echo "=== Checking for dist/server.js ==="
if [ -f "dist/server.js" ]; then
    echo "✓ dist/server.js exists"
    echo "File size: $(wc -c < dist/server.js) bytes"
else
    echo "✗ ERROR: dist/server.js NOT FOUND!"
    echo "Files in dist:"
    ls -la dist/ || echo "Cannot list dist contents"
    exit 1
fi

echo ""
echo "=== Running database migrations ==="
npx prisma migrate deploy

echo ""
echo "=== Starting server ==="
node dist/server.js
