#!/bin/bash
set -e

echo "=== RENDER BUILD SCRIPT STARTING ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

echo ""
echo "=== Installing dependencies ==="
npm ci

echo ""
echo "=== Building TypeScript ==="
npm run build

echo ""
echo "=== Generating Prisma Client ==="
npx prisma generate

echo ""
echo "=== BUILD COMPLETE ==="
echo "Directory contents after build:"
ls -la

echo ""
echo "=== DIST FOLDER CONTENTS ==="
ls -la dist/

echo ""
echo "=== Verifying server.js exists ==="
if [ -f "dist/server.js" ]; then
    echo "✓ dist/server.js exists"
    echo "File size: $(wc -c < dist/server.js) bytes"
else
    echo "✗ ERROR: dist/server.js NOT FOUND!"
    exit 1
fi

echo ""
echo "=== Build script completed successfully ==="
