/**
 * Socket.IO Emit API Route
 * Allows server actions to emit Socket.IO events
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { room, event, data, excludeSocketId } = await request.json();

    // Get the Socket.IO server from the global scope
    const io = (global as any).io;

    if (!io) {
      return NextResponse.json(
        { error: "Socket.IO server not initialized" },
        { status: 500 }
      );
    }

    // Emit to the room
    if (excludeSocketId) {
      io.to(room).except(excludeSocketId).emit(event, data);
    } else {
      io.to(room).emit(event, data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Socket Emit API] Error:", error);
    return NextResponse.json(
      { error: "Failed to emit event" },
      { status: 500 }
    );
  }
}
