/**
 * Hook for managing Socket.IO connection and real-time updates
 *
 * Features:
 * - WebSocket connection with automatic reconnection
 * - Handles disconnection gracefully
 * - Processes real-time updates from other users
 * - Field locking with visual indicators
 * - Prevents UI disruption during updates
 */

"use client";

import { useSocket } from "@/lib/providers/socket-provider";
import { WarrantyCaseWithRelations } from "@/lib/types/warranty";
import { useCallback, useEffect, useRef } from "react";
import { useCollaborativeEditingStore } from "../stores/collaborative-editing-store";

type UseRealtimeUpdatesOptions = {
  branchId: number;
  userId: string;
  userName: string;
  onCaseUpdate?: (caseId: number, updates: Record<string, any>) => void;
  // originUserId is the user who created the case (if known)
  onCaseCreated?: (
    newCase: WarrantyCaseWithRelations,
    originUserId?: string
  ) => void;
  // serviceNo is optional and may be included for friendlier UI messages
  onCaseDeleted?: (
    caseId: number,
    originUserId?: string,
    serviceNo?: string,
    customerName?: string
  ) => void;
  onSyncRequired?: (caseId: number) => void;
  enabled?: boolean;
};

export function useRealtimeUpdates({
  branchId,
  userId,
  userName,
  onCaseUpdate,
  onCaseCreated,
  onCaseDeleted,
  onSyncRequired,
  enabled = true,
}: UseRealtimeUpdatesOptions) {
  const { socket, isConnected } = useSocket();

  // Use refs to store callbacks to prevent reconnections when they change
  const onCaseUpdateRef = useRef(onCaseUpdate);
  const onSyncRequiredRef = useRef(onSyncRequired);
  const hasJoinedRoomRef = useRef(false);
  const currentBranchRef = useRef<number | null>(null);

  // Keep created callback ref
  const onCaseCreatedRef = useRef<
    | ((newCase: WarrantyCaseWithRelations, originUserId?: string) => void)
    | undefined
  >(undefined);
  const onCaseDeletedRef = useRef<
    | ((
        caseId: number,
        originUserId?: string,
        serviceNo?: string,
        customerName?: string
      ) => void)
    | undefined
  >(undefined);

  // Update refs when callbacks change
  useEffect(() => {
    onCaseUpdateRef.current = onCaseUpdate;
  }, [onCaseUpdate]);

  useEffect(() => {
    onSyncRequiredRef.current = onSyncRequired;
  }, [onSyncRequired]);

  useEffect(() => {
    onCaseCreatedRef.current = onCaseCreated || undefined;
  }, [onCaseCreated]);

  useEffect(() => {
    onCaseDeletedRef.current = onCaseDeleted || undefined;
  }, [onCaseDeleted]);

  const { setFieldLock, removeFieldLock, updateServerData, isEditing } =
    useCollaborativeEditingStore();

  // Use refs for store actions/selectors to avoid effect re-registration
  // and stale closures when these functions change identity.
  const setFieldLockRef = useRef(setFieldLock);
  const removeFieldLockRef = useRef(removeFieldLock);
  const updateServerDataRef = useRef(updateServerData);
  const isEditingRef = useRef(isEditing);

  useEffect(() => {
    setFieldLockRef.current = setFieldLock;
  }, [setFieldLock]);

  useEffect(() => {
    removeFieldLockRef.current = removeFieldLock;
  }, [removeFieldLock]);

  useEffect(() => {
    updateServerDataRef.current = updateServerData;
  }, [updateServerData]);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  // Setup Socket.IO event listeners
  useEffect(() => {
    if (!socket || !enabled || !isConnected) {
      console.log("[Socket.IO] Not setting up listeners:", {
        hasSocket: !!socket,
        enabled,
        isConnected,
      });
      return;
    }

    console.log(
      "[Socket.IO] Setting up event listeners for branch:",
      branchId,
      "userId:",
      userId,
      "userName:",
      userName
    );

    // Only join room once per branch
    if (!hasJoinedRoomRef.current || currentBranchRef.current !== branchId) {
      // Leave old branch if switching
      if (
        currentBranchRef.current !== null &&
        currentBranchRef.current !== branchId
      ) {
        socket.emit("leave-branch", { branchId: currentBranchRef.current });
        console.log(
          "[Socket.IO] Left previous branch:",
          currentBranchRef.current
        );
      }

      // Join the branch room
      socket.emit("join-branch", { branchId });
      console.log(
        "[Socket.IO] Emitted join-branch event with branchId:",
        branchId
      );

      // Send connection establishment
      socket.emit("connection-established", { userId, userName, branchId });
      console.log("[Socket.IO] Emitted connection-established event:", {
        userId,
        userName,
        branchId,
      });

      hasJoinedRoomRef.current = true;
      currentBranchRef.current = branchId;
    }

    // Handle field lock acquired
    const handleFieldLockAcquired = (data: {
      caseId: number;
      field: string;
      userId: string;
      userName: string;
      expiresAt: number;
    }) => {
      console.log("[Socket.IO] Field lock acquired:", data);
      setFieldLockRef.current({ ...data, timestamp: Date.now() });
    };

    // Handle field lock released
    const handleFieldLockReleased = (data: {
      caseId: number;
      field: string;
    }) => {
      console.log("[Socket.IO] Field lock released:", data);
      removeFieldLockRef.current(data.caseId, data.field);
    };

    // Handle case updated
    const handleCaseUpdated = (data: {
      caseId: number;
      updates: Record<string, any>;
      userId: string;
    }) => {
      console.log("[Socket.IO] Case updated:", data);
      const { caseId, updates } = data;

      // Normalize updatedAt if it's a string (socket serializes Dates)
      if (data.updates && typeof data.updates.updatedAt === "string") {
        try {
          data.updates.updatedAt = new Date(data.updates.updatedAt);
        } catch (err) {
          // ignore
        }
      }

      // Only update fields that are not currently being edited
      const filteredUpdates: Record<string, any> = {};
      Object.entries(updates).forEach(([field, value]) => {
        const editing = isEditingRef.current(caseId, field);
        console.log(
          `[Socket.IO] Field ${field}: editing=${editing}, value=`,
          value
        );
        if (!editing) {
          filteredUpdates[field] = value;
        } else {
          console.log(
            `[Socket.IO] Skipping field ${field} - currently being edited`
          );
        }
      });

      console.log("[Socket.IO] Filtered updates:", filteredUpdates);

      // Update server data (but not optimistic updates)
      if (Object.keys(filteredUpdates).length > 0) {
        updateServerDataRef.current(caseId, filteredUpdates);
        onCaseUpdateRef.current?.(caseId, filteredUpdates);
        console.log("[Socket.IO] Applied updates to store");
      } else {
        console.log("[Socket.IO] No updates applied - all fields being edited");
      }
    };

    // Handle sync required
    const handleSyncRequired = (data: { caseId: number }) => {
      console.log("[Socket.IO] Sync required:", data);
      onSyncRequiredRef.current?.(data.caseId);
    };

    // Handle revalidate
    const handleReceiveRevalidate = () => {
      console.log("[Socket.IO] Revalidate received");
      onSyncRequiredRef.current?.(-1); // -1 indicates full sync
    };

    // Register event listeners
    socket.on("field-lock-acquired", handleFieldLockAcquired);
    socket.on("field-lock-released", handleFieldLockReleased);
    socket.on("case-updated", handleCaseUpdated);
    // Handle case created by other clients
    const handleCaseCreated = (data: { case: any; userId?: string }) => {
      try {
        console.log("[Socket.IO] Case created received:", data);
        const raw = data.case as any;
        const originUserId = data.userId;

        // Server and socket emitters serialize Dates to strings. Convert known date fields back to Date objects.
        const newCase: WarrantyCaseWithRelations = {
          ...raw,
          createdAt:
            raw.createdAt && typeof raw.createdAt === "string"
              ? new Date(raw.createdAt)
              : raw.createdAt,
          updatedAt:
            raw.updatedAt && typeof raw.updatedAt === "string"
              ? new Date(raw.updatedAt)
              : raw.updatedAt,
          purchaseDate:
            raw.purchaseDate && typeof raw.purchaseDate === "string"
              ? new Date(raw.purchaseDate)
              : raw.purchaseDate,
        } as WarrantyCaseWithRelations;

        // Update collaborative store server data for the new case
        // Import store lazily to avoid client/server mismatch
        import("@/lib/stores/collaborative-editing-store").then((mod) => {
          mod.useCollaborativeEditingStore
            .getState()
            .setServerData(newCase.id, newCase);
        });

        // Call provided callback so UI can insert the case into its list/state
        onCaseCreatedRef.current?.(newCase, originUserId);
      } catch (err) {
        console.error("[Socket.IO] Failed handling case-created:", err);
      }
    };

    socket.on("case-created", handleCaseCreated);
    // Handle case deleted by other clients
    const handleCaseDeleted = (data: {
      caseId: number;
      userId?: string;
      serviceNo?: string;
      customerName?: string;
    }) => {
      try {
        console.log("[Socket.IO] Case deleted received:", data);
        const caseId = data.caseId;
        const originUserId = data.userId;
        const serviceNo = data.serviceNo;
        const customerName = data.customerName;

        // Call provided callback so UI can remove the case from its list/state
        onCaseDeletedRef.current?.(
          caseId,
          originUserId,
          serviceNo,
          customerName
        );
      } catch (err) {
        console.error("[Socket.IO] Failed handling case-deleted:", err);
      }
    };

    socket.on("case-deleted", handleCaseDeleted);
    socket.on("sync-required", handleSyncRequired);
    socket.on("receive-revalidate", handleReceiveRevalidate);

    // Cleanup
    return () => {
      console.log("[Socket.IO] Cleaning up event listeners");
      socket.off("field-lock-acquired", handleFieldLockAcquired);
      socket.off("field-lock-released", handleFieldLockReleased);
      socket.off("case-updated", handleCaseUpdated);
      socket.off("case-created", handleCaseCreated);
      socket.off("case-deleted", handleCaseDeleted);
      socket.off("sync-required", handleSyncRequired);
      socket.off("receive-revalidate", handleReceiveRevalidate);

      // Leave the branch room only when component unmounts
      if (currentBranchRef.current !== null) {
        socket.emit("leave-branch", { branchId: currentBranchRef.current });
        console.log("[Socket.IO] Left branch:", currentBranchRef.current);
        hasJoinedRoomRef.current = false;
        currentBranchRef.current = null;
      }
    };
  }, [
    socket,
    enabled,
    isConnected,
    branchId,
    userId,
    userName,
    setFieldLock,
    removeFieldLock,
    updateServerData,
    isEditing,
  ]);

  // Handle visibility change (page focus/blur)
  useEffect(() => {
    if (!enabled || !socket) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("[Socket.IO] Page hidden");
      } else {
        console.log("[Socket.IO] Page visible");
        // Trigger a sync when page becomes visible
        if (isConnected && onSyncRequiredRef.current) {
          onSyncRequiredRef.current(-1);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, socket, isConnected]);

  return {
    isConnected,
    connectionError: null,
    reconnect: () => socket?.connect(),
    disconnect: () => socket?.disconnect(),
  };
}

/**
 * Hook for syncing warranty cases with server
 */
export function useSyncWarrantyCases(
  branchId: number,
  onSync: (cases: WarrantyCaseWithRelations[]) => void
) {
  const syncWithServer = useCallback(
    async (caseId?: number) => {
      try {
        // If caseId is provided, sync only that case
        // Otherwise, sync all cases for the branch
        const endpoint =
          caseId && caseId !== -1
            ? `/api/warranty-cases/${caseId}`
            : `/api/warranty-cases?branchId=${branchId}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error("Failed to sync with server");
        }

        const data = await response.json();

        if (caseId && caseId !== -1) {
          // Single case sync
          onSync([data]);
        } else {
          // Full sync
          onSync(data);
        }

        console.log("[Sync] Successfully synced with server");
      } catch (error) {
        console.error("[Sync] Failed to sync with server:", error);
      }
    },
    [branchId, onSync]
  );

  return { syncWithServer };
}
