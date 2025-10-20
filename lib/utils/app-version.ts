/**
 * App Version Utility
 *
 * Generates and manages application version information.
 * The version is based on:
 * 1. package.json version (semantic versioning)
 * 2. Build timestamp (unique identifier per deployment)
 * 3. Optional: Git commit hash from environment variable
 *
 * The build timestamp is automatically generated at build time via next.config.ts
 * and remains constant for the entire deployment lifecycle.
 */

import packageJson from "@/package.json";

// Cache the build timestamp to ensure consistency
let cachedBuildTimestamp: string | null = null;

/**
 * Get the current app version from package.json
 */
export function getAppVersion(): string {
  return packageJson.version;
}

/**
 * Generate a unique build timestamp
 * This is generated at build time and should be consistent across the deployment
 */
export function getBuildTimestamp(): string {
  // Return cached value if available (ensures consistency)
  if (cachedBuildTimestamp) {
    return cachedBuildTimestamp;
  }

  // Use environment variable set at build time
  // NEXT_PUBLIC_BUILD_TIMESTAMP is set in next.config.ts during build
  cachedBuildTimestamp =
    process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ||
    process.env.BUILD_TIMESTAMP ||
    new Date().toISOString();

  return cachedBuildTimestamp;
}

/**
 * Get git commit hash if available
 */
export function getCommitHash(): string | undefined {
  return process.env.NEXT_PUBLIC_COMMIT_HASH || process.env.COMMIT_HASH;
}

/**
 * Get complete version info
 */
export function getVersionInfo() {
  return {
    version: getAppVersion(),
    buildTimestamp: getBuildTimestamp(),
    commitHash: getCommitHash(),
  };
}

/**
 * Check if two build timestamps represent different versions
 */
export function isVersionDifferent(
  currentTimestamp: string,
  newTimestamp: string
): boolean {
  return currentTimestamp !== newTimestamp;
}
