#!/bin/bash

# 🚀 SAFE DEPLOYMENT SCRIPT
# Ensures correct repository and account before deploying

set -e  # Exit on any error

echo "🔍 Verifying deployment configuration..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Check correct GitHub account
CURRENT_ACCOUNT=$(gh auth status 2>&1 | grep "Active account" | head -1 | awk '{print $3}' || echo "none")
if [ "$CURRENT_ACCOUNT" != "frontand-app" ]; then
    echo "❌ Wrong GitHub account: $CURRENT_ACCOUNT"
    echo "🔄 Switching to frontand-app account..."
    gh auth switch --user frontand-app
fi

# Check correct repository
CURRENT_REMOTE=$(git remote get-url origin)
CORRECT_REMOTE="https://github.com/frontand-app/frontand-app-v1-230725.git"

if [ "$CURRENT_REMOTE" != "$CORRECT_REMOTE" ]; then
    echo "❌ Wrong repository: $CURRENT_REMOTE"
    echo "🔄 Updating to correct repository..."
    git remote set-url origin "$CORRECT_REMOTE"
fi

# Remove any .vercel config to prevent CLI confusion
if [ -d ".vercel" ]; then
    echo "🧹 Removing .vercel directory to prevent CLI confusion..."
    rm -rf .vercel
fi

# Test build locally
echo "🔨 Testing build locally..."
npm run build

# Check git status
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Uncommitted changes detected. Please commit first:"
    git status --short
    exit 1
fi

# Deploy
echo "🚀 Deploying to production..."
echo "📤 Pushing to: $CORRECT_REMOTE"
git push origin main

echo "✅ Deployment initiated!"
echo "🌐 Check https://frontand.app in 1-3 minutes"
echo "📊 Monitor deployment at: https://vercel.com/frontand-tech-persons-projects/frontand-app-v1-230725"