#!/usr/bin/env node
/**
 * Set Build Timestamp Script
 *
 * This script generates a build timestamp and sets it as an environment variable.
 * It can be used in CI/CD pipelines or locally before building.
 *
 * Usage:
 *   tsx lib/scripts/set-build-timestamp.ts
 *   // Outputs: export NEXT_PUBLIC_BUILD_TIMESTAMP="2024-10-20T10:00:00.000Z"
 */

function setBuildTimestamp() {
  const timestamp = new Date().toISOString();

  // Output for shell sourcing
  console.log(`export NEXT_PUBLIC_BUILD_TIMESTAMP="${timestamp}"`);

  // Also log for information
  console.error(`[Build Timestamp] Set to: ${timestamp}`);
}

setBuildTimestamp();
