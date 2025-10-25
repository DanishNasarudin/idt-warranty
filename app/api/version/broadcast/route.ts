/**
 * Broadcast Version Update API
 *
 * Manually triggers a version update broadcast to all connected Socket.IO clients.
 * Useful for testing or triggering immediate notifications after deployment.
 *
 * POST /api/version/broadcast
 *
 * Requires authentication.
 */

import { getVersionInfo } from "@/lib/utils/app-version";
import { emitToAll } from "@/lib/utils/socket-emitter";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current version info
    const versionInfo = getVersionInfo();

    // Broadcast to all connected clients via Socket.IO
    await emitToAll("app-version-updated", versionInfo);

    console.log(`[Version Broadcast] Sent to all connected Socket.IO clients`);

    return NextResponse.json({
      success: true,
      message: "Version update broadcast sent",
      versionInfo,
    });
  } catch (error) {
    console.error("[Version Broadcast] Error:", error);
    return NextResponse.json(
      { error: "Failed to broadcast version update" },
      { status: 500 }
    );
  }
}
