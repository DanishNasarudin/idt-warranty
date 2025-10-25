/**
 * Socket.IO API Route
 * Initializes Socket.IO server for real-time collaborative editing
 *
 * This setup is based on Next.js Pages API pattern to integrate Socket.IO
 * with the Next.js server, allowing WebSocket connections in the same instance.
 */

import { NextApiResponseServerIO } from "@/lib/types/socket";
import { socketManager } from "@/lib/utils/socket-manager";
import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as SocketIOServer } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
  },
};

const serverVersion = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;

    const io = new SocketIOServer(httpServer, {
      path,
      addTrailingSlash: false,
      cors: {
        origin:
          process.env.NODE_ENV === "production"
            ? process.env.NEXT_PUBLIC_APP_URL
            : "http://localhost:3000",
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"], // Prefer WebSocket, fallback to polling
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    console.log("[Socket.IO] Server initialized");

    // Store the Socket.IO instance globally so it can be accessed from API routes
    (global as any).io = io;

    io.on("connection", (socket) => {
      console.log("[Socket.IO] Client connected:", socket.id);

      // Store client data
      let clientData = {
        id: socket.id,
        userId: "",
        userName: "",
        branchId: 0,
        data: {} as any,
      };

      // Handle connection establishment
      socket.on(
        "connection-established",
        (data: { userId: string; userName: string; branchId: number }) => {
          clientData.userId = data.userId;
          clientData.userName = data.userName;
          clientData.branchId = data.branchId;

          socketManager.addConnection({
            socketId: socket.id,
            userId: data.userId,
            userName: data.userName,
            branchId: data.branchId,
            lastHeartbeat: Date.now(),
          });

          console.log(
            `[Socket.IO] User connected: ${data.userName} (${data.userId}) to branch ${data.branchId}`
          );
        }
      );

      // Handle joining a branch room
      socket.on("join-branch", ({ branchId }: { branchId: number }) => {
        const room = `branch-${branchId}`;
        socket.join(room);
        console.log(`[Socket.IO] Socket ${socket.id} joined room ${room}`);
      });

      // Handle leaving a branch room
      socket.on("leave-branch", ({ branchId }: { branchId: number }) => {
        const room = `branch-${branchId}`;
        socket.leave(room);
        console.log(`[Socket.IO] Socket ${socket.id} left room ${room}`);
      });

      // Handle field lock request
      socket.on(
        "field-lock-request",
        ({
          caseId,
          field,
          branchId,
        }: {
          caseId: number;
          field: string;
          branchId: number;
        }) => {
          if (!clientData.userId || !clientData.userName) {
            console.warn("[Socket.IO] Lock request from unauthorized client");
            return;
          }

          const now = Date.now();
          const lockExpiry = now + 30000; // 30 seconds
          const acquired = socketManager.acquireFieldLock({
            caseId,
            field,
            userId: clientData.userId,
            userName: clientData.userName,
            timestamp: now,
            expiresAt: lockExpiry,
          });

          if (acquired) {
            // Notify requester
            socket.emit("field-lock-acquired", {
              caseId,
              field,
              userId: clientData.userId,
              userName: clientData.userName,
              expiresAt: lockExpiry,
            });

            // Broadcast to others in the branch
            socket.to(`branch-${branchId}`).emit("field-lock-acquired", {
              caseId,
              field,
              userId: clientData.userId,
              userName: clientData.userName,
              expiresAt: lockExpiry,
            });

            console.log(
              `[Socket.IO] Lock acquired: case ${caseId}, field ${field} by ${clientData.userName}`
            );
          } else {
            const existingLock = socketManager.getFieldLock(caseId, field);
            socket.emit("field-lock-failed", {
              caseId,
              field,
              lockedBy: existingLock?.userName || "Unknown user",
            });
          }
        }
      );

      // Handle field lock release
      socket.on(
        "field-lock-release",
        ({
          caseId,
          field,
          branchId,
        }: {
          caseId: number;
          field: string;
          branchId: number;
        }) => {
          if (!clientData.userId) {
            return;
          }

          const released = socketManager.releaseFieldLock(
            caseId,
            field,
            clientData.userId
          );

          if (released) {
            // Notify requester
            socket.emit("field-lock-released", { caseId, field });

            // Broadcast to others in the branch
            socket
              .to(`branch-${branchId}`)
              .emit("field-lock-released", { caseId, field });

            console.log(
              `[Socket.IO] Lock released: case ${caseId}, field ${field} by ${clientData.userName}`
            );
          }
        }
      );

      // Handle case updates
      socket.on(
        "case-update",
        ({
          caseId,
          updates,
          branchId,
        }: {
          caseId: number;
          updates: Record<string, any>;
          branchId: number;
        }) => {
          console.log(
            `[Socket.IO] Broadcasting case update for case ${caseId} to branch ${branchId}`
          );

          // Broadcast to others in the branch (excluding sender)
          socket.to(`branch-${branchId}`).emit("case-updated", {
            caseId,
            updates,
            userId: clientData.userId,
          });
        }
      );

      // Handle case created events (clients can notify server about newly created cases)
      socket.on(
        "case-created",
        ({ case: createdCase, branchId }: { case: any; branchId: number }) => {
          try {
            console.log(
              `[Socket.IO] Broadcasting new case creation to branch ${branchId}`
            );

            // Broadcast to others in the branch (excluding sender)
            socket.to(`branch-${branchId}`).emit("case-created", {
              case: createdCase,
              userId: clientData.userId,
            });
          } catch (err) {
            console.error("[Socket.IO] Failed to broadcast case-created:", err);
          }
        }
      );

      // Handle case deleted events (clients can notify server about deleted cases)
      socket.on(
        "case-deleted",
        ({
          caseId,
          branchId,
          serviceNo,
          customerName,
        }: {
          caseId: number;
          branchId: number;
          serviceNo?: string;
          customerName?: string;
        }) => {
          try {
            console.log(
              `[Socket.IO] Broadcasting case deletion to branch ${branchId}`
            );

            // Broadcast to others in the branch (excluding sender)
            socket.to(`branch-${branchId}`).emit("case-deleted", {
              caseId,
              serviceNo,
              customerName,
              userId: clientData.userId,
            });
          } catch (err) {
            console.error("[Socket.IO] Failed to broadcast case-deleted:", err);
          }
        }
      );

      // Handle editing cell state
      socket.on(
        "editing-cell",
        (data: { rowId: string; columnId: string; isEditing: boolean }) => {
          clientData.data = data;

          // Broadcast to others editing the same row
          socket.to(data.rowId).emit("cell-isediting", data);
        }
      );

      // Handle row-specific edits
      socket.on("create-edit", (rowId: string) => {
        socket.join(rowId);

        // Send current editing states for this row from other clients
        const connections = socketManager.getConnectionsByBranch(
          clientData.branchId
        );
        connections.forEach((conn: any) => {
          if (conn.socketId !== socket.id) {
            // Get socket for this connection
            const otherSocket = io.sockets.sockets.get(conn.socketId);
            if (otherSocket) {
              // Check if they have editing data for this row
              // This would need to be stored in socketManager if needed
            }
          }
        });
      });

      // Handle changes broadcasting
      socket.on(
        "send-changes",
        (data: { rowId: string; id: string; newValue: any }) => {
          socket.to(data.rowId).emit("receive-changes", data);
        }
      );

      // Handle revalidate data
      socket.on("revalidate-data", () => {
        socket.broadcast.emit("receive-revalidate");
      });

      // Handle clear client
      socket.on("clear-client", (data: { activeSocket?: string }) => {
        if (data.activeSocket) {
          const targetSocket = io.sockets.sockets.get(data.activeSocket);
          if (targetSocket) {
            // Release locks and cleanup
            socketManager.releaseAllUserLocks(clientData.userId);
          }
        }
      });

      // Version checking
      const versionCheckInterval = setInterval(() => {
        socket.emit("version-check", { serverVersion });
      }, 10000); // Every 10 seconds

      socket.on("client-version", (data: { clientVersion: string }) => {
        const { clientVersion } = data;
        if (clientVersion !== serverVersion) {
          socket.emit("refresh-client", {
            message: "Client version is outdated. Please refresh.",
          });
        }
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);

        // Release all locks held by this user
        if (clientData.userId) {
          socketManager.releaseAllUserLocks(clientData.userId);
          socketManager.removeConnection(socket.id);

          // Notify others if they were editing
          if (clientData.data && clientData.data.rowId) {
            socket.to(clientData.data.rowId).emit("cell-isediting", {
              rowId: clientData.data.rowId,
              columnId: clientData.data.columnId,
              isEditing: false,
            });
          }
        }

        clearInterval(versionCheckInterval);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log("[Socket.IO] Server already initialized");
  }

  res.end();
};

export default ioHandler;
