/**
 * SSE Route Handler for Real-time Updates
 * Endpoint: /api/sse/warranty-updates
 *
 * This route establishes a Server-Sent Events connection for real-time
 * collaborative editing of warranty cases.
 */

import { sseManager } from "@/lib/utils/sse-manager";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Authenticate the user
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get user details from Clerk
  const user = await currentUser();

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Get branch ID from query params
  const searchParams = request.nextUrl.searchParams;
  const branchId = searchParams.get("branchId");

  if (!branchId) {
    return new Response("Branch ID is required", { status: 400 });
  }

  const branchIdNum = parseInt(branchId);

  if (isNaN(branchIdNum)) {
    return new Response("Invalid branch ID", { status: 400 });
  }

  // Get user name from Clerk (first name + last name, or username, or email)
  const userName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username || user.emailAddresses[0]?.emailAddress || userId;

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add connection to manager
      sseManager.addConnection({
        userId,
        userName,
        branchId: branchIdNum,
        controller,
        lastHeartbeat: Date.now(),
      });

      // Send initial connection message
      const initialMessage = {
        type: "connection-established" as const,
        data: { userId, branchId: branchIdNum },
      };

      const data = `data: ${JSON.stringify(initialMessage)}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));

      // Send immediate heartbeat to prevent buffering (critical for Apache/Passenger)
      // This ensures data flows immediately and prevents proxy buffering
      const immediateHeartbeat = {
        type: "heartbeat" as const,
        data: { timestamp: Date.now() },
      };
      const heartbeatData = `data: ${JSON.stringify(immediateHeartbeat)}\n\n`;
      controller.enqueue(new TextEncoder().encode(heartbeatData));

      console.log(
        `[SSE] Connection established: ${userId} (branch: ${branchIdNum})`
      );
    },
    cancel() {
      // Remove connection when client disconnects
      sseManager.removeConnection(userId);
      console.log(`[SSE] Connection cancelled: ${userId}`);
    },
  });

  // Return SSE response with headers optimized for cPanel/Passenger/Apache
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering for nginx
      "X-Content-Type-Options": "nosniff", // Prevent MIME sniffing
      // Critical for Apache/cPanel to disable buffering
      "Transfer-Encoding": "chunked",
    },
  });
}
