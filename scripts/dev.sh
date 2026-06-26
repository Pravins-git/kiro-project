#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting AI Career Intelligence Platform in development mode..."
echo ""

# Check if shared package is built
if [ ! -d "packages/shared/dist" ]; then
  echo "🔨 Building shared package first..."
  pnpm build:shared
  echo ""
fi

echo "Starting server on http://localhost:4000"
echo "Starting client on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services."
echo ""

# Start both client and server in parallel
pnpm dev
