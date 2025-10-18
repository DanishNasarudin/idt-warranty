"use client";

import {
  acquireFieldLock,
  releaseFieldLock,
} from "@/app/(warranty)/branch/[id]/lock-actions";
import { useCollaborativeEditingStore } from "@/lib/stores/collaborative-editing-store";
import { useWarrantyCaseStore } from "@/lib/stores/warranty-case-store";
import {
  WarrantyCaseUpdate,
  WarrantyCaseWithRelations,
} from "@/lib/types/warranty";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRealtimeUpdates } from "./use-realtime-updates";

type SavingStatus = "idle" | "saving" | "saved" | "synced";

// Constant for fade-out timing (in milliseconds)
const FADE_OUT_DELAY = 2000;

type UseWarrantySyncOptions = {
  branchId: number;
  userId: string | null;
  initialCases: WarrantyCaseWithRelations[];
  onUpdateCase: (caseId: number, updates: WarrantyCaseUpdate) => Promise<void>;
  enabled?: boolean;
};

type UseWarrantySyncReturn = {
  // Saving status
  savingStatus: SavingStatus;
  fadeOut: boolean;

  // Connection status
  isConnected: boolean;
  connectionError: string | null;

  // Handlers
  handleUpdateWithDebounce: (
    caseId: number,
    field: string,
    value: any
  ) => Promise<void>;
  handleAcquireFieldLock: (caseId: number, field: string) => Promise<boolean>;
  handleReleaseFieldLock: (caseId: number, field: string) => Promise<void>;
};

export function useWarrantySync({
  branchId,
  userId,
  initialCases,
  onUpdateCase,
  enabled = true,
}: UseWarrantySyncOptions): UseWarrantySyncReturn {
  const [savingStatus, setSavingStatus] = useState<SavingStatus>("synced");
  const [fadeOut, setFadeOut] = useState(false);
  const initializedRef = useRef(false);

  const {
    setServerData,
    batchSetServerData,
    updateServerData,
    scheduleUpdate,
    startEditing,
    stopEditing,
    clearAll,
    pendingUpdates,
  } = useCollaborativeEditingStore();

  const { handleRemoteUpdate } = useWarrantyCaseStore();

  // Monitor pending updates to show saving status
  useEffect(() => {
    if (pendingUpdates.size > 0) {
      setSavingStatus("saving");
      setFadeOut(false);
    } else if (savingStatus === "saving") {
      // Changed from saving to idle, show saved status
      setSavingStatus("saved");
      setFadeOut(false);
    }
  }, [pendingUpdates.size, savingStatus]);

  // Handle "saved" status fade-out and transition to "synced"
  useEffect(() => {
    if (savingStatus === "saved") {
      // Fade out after FADE_OUT_DELAY, then change to synced after fade completes
      const fadeTimeout = setTimeout(() => {
        setFadeOut(true);
      }, FADE_OUT_DELAY);

      const syncTimeout = setTimeout(() => {
        setSavingStatus("synced");
        setFadeOut(false);
      }, FADE_OUT_DELAY + 500); // FADE_OUT_DELAY + 0.5s fade animation

      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(syncTimeout);
      };
    }
  }, [savingStatus]);

  // Handle "synced" status fade-out
  useEffect(() => {
    if (savingStatus === "synced") {
      // Fade out after FADE_OUT_DELAY
      const syncFadeTimeout = setTimeout(() => {
        setFadeOut(true);
      }, FADE_OUT_DELAY);

      return () => clearTimeout(syncFadeTimeout);
    }
  }, [savingStatus]);

  // Initialize server data only once (batched to prevent multiple renders)
  useEffect(() => {
    if (!initializedRef.current && initialCases.length > 0) {
      batchSetServerData(initialCases);
      initializedRef.current = true;
    }
  }, [initialCases, batchSetServerData]);

  // Handle real-time updates from other users
  const handleCaseUpdate = useCallback(
    (caseId: number, updates: Record<string, any>) => {
      console.log(
        `[Real-time] Case ${caseId} updated by another user`,
        updates
      );

      // Update both stores
      updateServerData(caseId, updates);
      handleRemoteUpdate(caseId, updates);
    },
    [updateServerData, handleRemoteUpdate]
  );

  // Sync a single case with server data
  const syncCase = useCallback(
    (caseId: number, serverCase: WarrantyCaseWithRelations) => {
      // Get the current optimistic updates for this case
      const optimisticUpdates = useCollaborativeEditingStore
        .getState()
        .optimisticUpdates.get(caseId);

      // If no optimistic updates, just update with server data
      if (!optimisticUpdates || Object.keys(optimisticUpdates).length === 0) {
        console.log(
          `[Sync] No local changes for case ${caseId}, updating with server data`
        );
        setServerData(caseId, serverCase);
        handleRemoteUpdate(caseId, serverCase);
        return;
      }

      // If there are optimistic updates, we need to merge carefully
      // Only overwrite fields that are not currently being edited
      const editingFields =
        useCollaborativeEditingStore.getState().editingFields;
      const fieldsBeingEdited = Array.from(editingFields.values())
        .filter((edit) => edit.caseId === caseId)
        .map((edit) => edit.field);

      console.log(
        `[Sync] Case ${caseId} has local changes in fields:`,
        Object.keys(optimisticUpdates),
        `Currently editing:`,
        fieldsBeingEdited
      );

      // Create merged data: server data + optimistic updates for edited fields
      const mergedData: Partial<WarrantyCaseWithRelations> = {
        ...serverCase,
      };

      // Keep optimistic updates for fields currently being edited
      fieldsBeingEdited.forEach((field) => {
        if (optimisticUpdates[field as keyof typeof optimisticUpdates]) {
          (mergedData as any)[field] =
            optimisticUpdates[field as keyof typeof optimisticUpdates];
        }
      });

      console.log(`[Sync] Syncing case ${caseId} with merged data`);

      // Update stores with merged data
      setServerData(caseId, serverCase); // Server data stays pure
      handleRemoteUpdate(caseId, mergedData); // UI shows merged data
    },
    [setServerData, handleRemoteUpdate]
  );

  // Handle sync requests
  const handleSyncRequired = useCallback(
    async (caseId: number) => {
      console.log("[Sync] Sync required for case:", caseId);

      try {
        // -1 indicates full sync (all cases)
        if (caseId === -1) {
          console.log(
            `[Sync] Full sync - syncing all ${initialCases.length} cases`
          );

          // Sync all visible cases
          initialCases.forEach((serverCase) => {
            syncCase(serverCase.id, serverCase);
          });

          console.log("[Sync] Full sync completed");
          return;
        }

        // Individual case sync
        const serverCase = initialCases.find((c) => c.id === caseId);

        if (!serverCase) {
          console.warn(`[Sync] Case ${caseId} not found in server data`);
          return;
        }

        syncCase(caseId, serverCase);
      } catch (error) {
        console.error(`[Sync] Failed to sync:`, error);
      }
    },
    [initialCases, syncCase]
  );

  // Set up real-time updates
  const { isConnected, connectionError } = useRealtimeUpdates({
    branchId,
    userId: userId || "",
    onCaseUpdate: handleCaseUpdate,
    onSyncRequired: handleSyncRequired,
    syncIntervalMs: 60000, // 1 minute
    enabled: enabled && !!userId,
  });

  // Show connection error
  useEffect(() => {
    if (connectionError) {
      toast.error(connectionError);
    }
  }, [connectionError]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  // Handle field lock acquire
  const handleAcquireFieldLock = useCallback(
    async (caseId: number, field: string) => {
      if (!userId) return false;

      try {
        const result = await acquireFieldLock(caseId, field, branchId);

        if (!result.success && result.existingLock) {
          toast.warning(
            `This field is being edited by ${result.existingLock.userName}`
          );
          return false;
        }

        startEditing(caseId, field);
        return result.success;
      } catch (error) {
        console.error("Failed to acquire lock:", error);
        return false;
      }
    },
    [userId, branchId, startEditing]
  );

  // Handle field lock release
  const handleReleaseFieldLock = useCallback(
    async (caseId: number, field: string) => {
      if (!userId) return;

      try {
        await releaseFieldLock(caseId, field, branchId);
        stopEditing(caseId, field);
      } catch (error) {
        console.error("Failed to release lock:", error);
      }
    },
    [userId, branchId, stopEditing]
  );

  // Handle updates with debouncing and optimistic UI
  const handleUpdateWithDebounce = useCallback(
    async (caseId: number, field: string, value: any) => {
      if (!userId) return;

      // Schedule debounced update
      scheduleUpdate(
        caseId,
        field,
        value,
        async (caseId, field, value) => {
          try {
            await onUpdateCase(caseId, { [field]: value });
          } catch (error) {
            toast.error("Failed to save changes. Please try again.");
            throw error;
          }
        },
        1000 // 1 second debounce
      );
    },
    [userId, scheduleUpdate, onUpdateCase]
  );

  return {
    savingStatus,
    fadeOut,
    isConnected,
    connectionError,
    handleUpdateWithDebounce,
    handleAcquireFieldLock,
    handleReleaseFieldLock,
  };
}
