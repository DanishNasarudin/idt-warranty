#!/bin/bash
# Build script that automatically sets build timestamp
# This ensures each build has a unique, consistent timestamp

echo "🚀 Starting production build with automatic versioning..."

# Generate and set build timestamp
export NEXT_PUBLIC_BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
echo "📅 Build Timestamp: $NEXT_PUBLIC_BUILD_TIMESTAMP"

# Optional: Set commit hash if in git repo
if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
    export NEXT_PUBLIC_COMMIT_HASH=$(git rev-parse --short HEAD)
    echo "🔖 Commit Hash: $NEXT_PUBLIC_COMMIT_HASH"
fi

# Run the build
echo "🔨 Building application..."
npm run server-build

echo "✅ Build completed with automatic versioning!"
