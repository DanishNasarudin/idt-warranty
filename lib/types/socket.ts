/**
 * Socket.IO Type Definitions
 * Types for real-time WebSocket communication
 */

import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

/**
 * Socket.IO Event Types
 */
export type SocketEvents = {
  // Connection events
  "connection-established": { userId: string; branchId: number };
  "client-version": { clientVersion: string };
  "version-check": { serverVersion: string };
  "refresh-client": { message?: string };

  // Room management
  "join-branch": { branchId: number };
  "leave-branch": { branchId: number };

  // Field locking
  "field-lock-request": {
    caseId: number;
    field: string;
    branchId: number;
  };
  "field-lock-acquired": {
    caseId: number;
    field: string;
    userId: string;
    userName: string;
    expiresAt: number;
  };
  "field-lock-failed": {
    caseId: number;
    field: string;
    lockedBy: string;
  };
  "field-lock-release": {
    caseId: number;
    field: string;
    branchId: number;
  };
  "field-lock-released": {
    caseId: number;
    field: string;
  };

  // Case updates
  "case-update": {
    caseId: number;
    updates: Record<string, any>;
    branchId: number;
  };
  "case-updated": {
    caseId: number;
    updates: Record<string, any>;
    userId: string;
  };

  // Sync
  "sync-required": { caseId: number };
  "revalidate-data": void;
  "receive-revalidate": void;

  // Editing state
  "editing-cell": {
    rowId: string;
    columnId: string;
    isEditing: boolean;
  };
  "cell-isediting": {
    rowId: string;
    columnId: string;
    isEditing: boolean;
  };

  // Changes
  "send-changes": {
    rowId: string;
    id: string;
    newValue: any;
  };
  "receive-changes": {
    rowId: string;
    id: string;
    newValue: any;
  };

  // Cleanup
  "clear-client": { activeSocket?: string };
};

/**
 * Field Lock Information
 */
export type FieldLock = {
  caseId: number;
  field: string;
  userId: string;
  userName: string;
  timestamp: number;
  expiresAt: number;
};

/**
 * Socket Connection Info
 */
export type SocketConnection = {
  socketId: string;
  userId: string;
  userName: string;
  branchId: number;
  lastHeartbeat: number;
};
