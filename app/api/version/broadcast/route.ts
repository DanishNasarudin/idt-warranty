/**
 * Broadcast Version Update API
 *
 * Manually triggers a version update broadcast to all connected SSE clients.
 * Useful for testing or triggering immediate notifications after deployment.
 *
 * POST /api/version/broadcast
 *
 * Requires authentication.
 */

import { getVersionInfo } from "@/lib/utils/app-version";
import { sseManager } from "@/lib/utils/sse-manager";
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

    // Broadcast to all connected clients
    const message = {
      type: "app-version-updated" as const,
      data: versionInfo,
    };

    sseManager.broadcastToAll(message);

    console.log(
      `[Version Broadcast] Sent to ${sseManager.getConnectionCount()} clients`
    );

    return NextResponse.json({
      success: true,
      message: "Version update broadcast sent",
      versionInfo,
      clientCount: sseManager.getConnectionCount(),
    });
  } catch (error) {
    console.error("[Version Broadcast] Error:", error);
    return NextResponse.json(
      { error: "Failed to broadcast version update" },
      { status: 500 }
    );
  }
}
