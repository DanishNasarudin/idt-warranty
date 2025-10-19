/**
 * App Version Utility
 *
 * Generates and manages application version information.
 * The version is based on:
 * 1. package.json version (semantic versioning)
 * 2. Build timestamp (unique identifier per deployment)
 * 3. Optional: Git commit hash from environment variable
 */

import packageJson from "@/package.json";

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
  // Use environment variable if available (set during build)
  // Otherwise, use a compile-time constant
  return (
    process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ||
    process.env.BUILD_TIMESTAMP ||
    new Date().toISOString()
  );
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
