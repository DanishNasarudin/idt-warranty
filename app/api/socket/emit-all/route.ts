/**
 * Socket.IO Emit All API Route
 * Allows server actions to broadcast Socket.IO events to all connected clients
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { event, data } = await request.json();

    // Get the Socket.IO server from the global scope
    const io = (global as any).io;

    if (!io) {
      return NextResponse.json(
        { error: "Socket.IO server not initialized" },
        { status: 500 }
      );
    }

    // Broadcast to all connected clients
    io.emit(event, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Socket Emit All API] Error:", error);
    return NextResponse.json(
      { error: "Failed to emit event" },
      { status: 500 }
    );
  }
}
