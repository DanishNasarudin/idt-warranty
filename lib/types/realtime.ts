/**
 * Real-time collaboration types for warranty case editing
 */

export type FieldLock = {
  caseId: number;
  field: string;
  userId: string;
  userName: string;
  timestamp: number;
  expiresAt: number; // Auto-expire after 30 seconds
};

export type WarrantyCaseUpdate = {
  caseId: number;
  field: string;
  value: any;
  userId: string;
  userName: string;
  timestamp: number;
  version?: number; // For optimistic concurrency control
};

export type SSEMessage =
  | {
      type: "field-locked";
      data: FieldLock;
    }
  | {
      type: "field-unlocked";
      data: { caseId: number; field: string; userId: string };
    }
  | {
      type: "field-updated";
      data: WarrantyCaseUpdate;
    }
  | {
      type: "case-updated";
      data: { caseId: number; updates: Record<string, any> };
    }
  | {
      type: "sync-required";
      data: { caseId: number };
    }
  | {
      type: "connection-established";
      data: { userId: string; branchId: number };
    }
  | {
      type: "heartbeat";
      data: { timestamp: number };
    }
  | {
      type: "case-transferred-out";
      data: { caseId: number; toBranchId: number; transferId: number };
    }
  | {
      type: "case-transferred-in";
      data: { caseId: number; fromBranchId: number; transferId: number };
    }
  | {
      type: "app-version-updated";
      data: {
        version: string;
        buildTimestamp: string;
        commitHash?: string;
      };
    };

export type SSEConnection = {
  userId: string;
  userName: string;
  branchId: number;
  controller: ReadableStreamDefaultController;
  lastHeartbeat: number;
};
