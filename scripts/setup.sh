#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Setting up AI Career Intelligence Platform..."
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required. Install with: npm install -g pnpm"; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ is required. Current version: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v)"
echo "✅ pnpm $(pnpm -v)"
echo ""

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
  echo "   Edit .env with your configuration values."
else
  echo "✅ .env file already exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Build shared package
echo ""
echo "🔨 Building shared package..."
pnpm build:shared

# Setup husky git hooks
echo ""
echo "🐶 Setting up git hooks..."
pnpm prepare

echo ""
echo "✅ Setup complete! Available commands:"
echo "   pnpm dev        - Start development servers"
echo "   pnpm build      - Build all packages"
echo "   pnpm lint       - Run linting"
echo "   pnpm test       - Run tests"
echo "   docker compose up - Start with Docker"
echo ""
