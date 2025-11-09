#!/bin/bash
set -e

echo "=== RENDER START SCRIPT ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Ensure we're in the project root
# Try multiple possible locations
if [ ! -f "package.json" ]; then
    echo "package.json not found in current directory, searching..."
    if [ -f "/opt/render/project/package.json" ]; then
        echo "Found package.json at /opt/render/project, changing directory..."
        cd /opt/render/project
    elif [ -f "../package.json" ]; then
        echo "Found package.json in parent directory, changing directory..."
        cd ..
    elif [ -f "../../package.json" ]; then
        echo "Found package.json two levels up, changing directory..."
        cd ../..
    fi
fi

echo ""
echo "Final working directory: $(pwd)"
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
    echo "Full path: $(pwd)/dist/server.js"
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
echo "Running: node dist/server.js from $(pwd)"
node dist/server.js
