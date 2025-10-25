/**
 * Socket.IO Emitter for Server Actions
 * Utility to emit Socket.IO events from server actions
 */

/**
 * Get Socket.IO server instance
 * Note: In Next.js server actions, we can't directly access the Socket.IO server
 * We need to make HTTP requests to a special API route that will handle the broadcasting
 */
export async function emitToRoom(
  room: string,
  event: string,
  data: any,
  excludeSocketId?: string
) {
  try {
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_APP_URL
        : "http://localhost:3000";

    await fetch(`${baseUrl}/api/socket/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room,
        event,
        data,
        excludeSocketId,
      }),
    });
  } catch (error) {
    console.error("[Socket Emitter] Failed to emit event:", error);
  }
}

export async function emitToBranch(
  branchId: number,
  event: string,
  data: any,
  excludeSocketId?: string
) {
  await emitToRoom(`branch-${branchId}`, event, data, excludeSocketId);
}

export async function emitToAll(event: string, data: any) {
  try {
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_APP_URL
        : "http://localhost:3000";

    await fetch(`${baseUrl}/api/socket/emit-all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        data,
      }),
    });
  } catch (error) {
    console.error("[Socket Emitter] Failed to emit global event:", error);
  }
}
