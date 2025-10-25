/**
 * Script to update the app version in the database
 *
 * This should be run after deployment to set the active version.
 * Can also be used to manually trigger version updates.
 */

import { PrismaClient } from "@/lib/generated/prisma";
import {
  getAppVersion,
  getBuildTimestamp,
  getCommitHash,
} from "@/lib/utils/app-version";

const prisma = new PrismaClient();

async function updateAppVersion() {
  try {
    console.log("📦 Updating app version in database...");

    const version = getAppVersion();
    const buildTimestamp = getBuildTimestamp();
    const commitHash = getCommitHash();

    console.log("Version:", version);
    console.log("Build Timestamp:", buildTimestamp);
    console.log("Commit Hash:", commitHash || "N/A");

    // Deactivate all previous versions
    await prisma.appVersion.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create or update the current version
    const appVersion = await prisma.appVersion.upsert({
      where: { buildTimestamp },
      update: {
        version,
        commitHash,
        isActive: true,
        deployedAt: new Date(),
      },
      create: {
        version,
        buildTimestamp,
        commitHash,
        isActive: true,
        deployedAt: new Date(),
      },
    });

    console.log("✅ App version updated successfully!");
    console.log("Active Version ID:", appVersion.id);

    // Broadcast version update via Socket.IO
    try {
      const { emitToAll } = await import("../utils/socket-emitter");
      await emitToAll("app-version-updated", {
        version: appVersion.version,
        buildTimestamp: appVersion.buildTimestamp,
        commitHash: appVersion.commitHash,
      });
      console.log("📡 Version update broadcasted via Socket.IO");
    } catch (broadcastError) {
      console.warn("⚠️ Failed to broadcast version update:", broadcastError);
      // Non-critical - polling will still detect the update
    }

    return appVersion;
  } catch (error) {
    console.error("❌ Failed to update app version:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  updateAppVersion()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { updateAppVersion };
