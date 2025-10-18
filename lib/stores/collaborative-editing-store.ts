/**
 * Collaborative Editing Store
 *
 * Manages real-time collaborative editing of warranty cases with:
 * - Field locking to prevent concurrent edits
 * - Optimistic updates with rollback on error
 * - Debounced server updates
 * - Conflict resolution
 */

import { FieldLock } from "@/lib/types/realtime";
import { WarrantyCaseWithRelations } from "@/lib/types/warranty";
import { create } from "zustand";

type PendingUpdate = {
  caseId: number;
  field: string;
  value: any;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
};

type CollaborativeEditingState = {
  // Field locks from other users
  fieldLocks: Map<string, FieldLock>;

  // Fields currently being edited by this user
  editingFields: Map<string, { caseId: number; field: string }>;

  // Pending debounced updates
  pendingUpdates: Map<string, PendingUpdate>;

  // Local optimistic updates
  optimisticUpdates: Map<number, Partial<WarrantyCaseWithRelations>>;

  // Server data (source of truth)
  serverData: Map<number, WarrantyCaseWithRelations>;

  // Actions
  setFieldLock: (lock: FieldLock) => void;
  removeFieldLock: (caseId: number, field: string) => void;
  isFieldLocked: (
    caseId: number,
    field: string,
    currentUserId: string
  ) => FieldLock | null;

  startEditing: (caseId: number, field: string) => void;
  stopEditing: (caseId: number, field: string) => void;
  isEditing: (caseId: number, field: string) => boolean;

  scheduleUpdate: (
    caseId: number,
    field: string,
    value: any,
    onUpdate: (caseId: number, field: string, value: any) => Promise<void>,
    debounceMs?: number
  ) => void;
  cancelPendingUpdate: (caseId: number, field: string) => void;
  cancelAllPendingUpdates: () => void;

  setOptimisticUpdate: (
    caseId: number,
    updates: Partial<WarrantyCaseWithRelations>
  ) => void;
  clearOptimisticUpdate: (caseId: number, field?: string) => void;
  getOptimisticValue: (caseId: number, field: string) => any;

  setServerData: (caseId: number, data: WarrantyCaseWithRelations) => void;
  batchSetServerData: (cases: WarrantyCaseWithRelations[]) => void;
  updateServerData: (
    caseId: number,
    updates: Partial<WarrantyCaseWithRelations>
  ) => void;
  getServerData: (caseId: number) => WarrantyCaseWithRelations | undefined;

  getMergedData: (caseId: number) => WarrantyCaseWithRelations | undefined;

  // Get display value with optimistic updates merged (alias for getMergedData for clarity)
  getDisplayValue: (caseId: number) => Partial<WarrantyCaseWithRelations>;

  clearAll: () => void;
};

export const useCollaborativeEditingStore = create<CollaborativeEditingState>(
  (set, get) => ({
    fieldLocks: new Map(),
    editingFields: new Map(),
    pendingUpdates: new Map(),
    optimisticUpdates: new Map(),
    serverData: new Map(),

    setFieldLock: (lock) => {
      console.log("[Store] Setting field lock:", lock);
      set((state) => {
        const newLocks = new Map(state.fieldLocks);
        const key = `${lock.caseId}:${lock.field}`;
        newLocks.set(key, lock);
        console.log("[Store] Field locks after set:", newLocks.size, "locks");
        return { fieldLocks: newLocks };
      });
    },

    removeFieldLock: (caseId, field) => {
      console.log(
        `[Store] Removing field lock: case ${caseId}, field ${field}`
      );
      set((state) => {
        const newLocks = new Map(state.fieldLocks);
        const key = `${caseId}:${field}`;
        const deleted = newLocks.delete(key);
        console.log(
          `[Store] Lock deleted: ${deleted}, remaining: ${newLocks.size}`
        );
        return { fieldLocks: newLocks };
      });
    },

    isFieldLocked: (caseId, field, currentUserId) => {
      const key = `${caseId}:${field}`;
      const lock = get().fieldLocks.get(key);

      if (!lock) return null;

      // Check if lock has expired
      if (lock.expiresAt <= Date.now()) {
        get().removeFieldLock(caseId, field);
        return null;
      }

      // Check if it's locked by another user
      if (lock.userId !== currentUserId) {
        return lock;
      }

      return null;
    },

    startEditing: (caseId, field) => {
      set((state) => {
        const newEditing = new Map(state.editingFields);
        const key = `${caseId}:${field}`;
        newEditing.set(key, { caseId, field });
        return { editingFields: newEditing };
      });
    },

    stopEditing: (caseId, field) => {
      set((state) => {
        const newEditing = new Map(state.editingFields);
        const key = `${caseId}:${field}`;
        newEditing.delete(key);
        return { editingFields: newEditing };
      });
    },

    isEditing: (caseId, field) => {
      const key = `${caseId}:${field}`;
      return get().editingFields.has(key);
    },

    scheduleUpdate: (caseId, field, value, onUpdate, debounceMs = 1000) => {
      const key = `${caseId}:${field}`;
      const state = get();

      // Cancel existing pending update
      const existingUpdate = state.pendingUpdates.get(key);
      if (existingUpdate) {
        clearTimeout(existingUpdate.timeoutId);
      }

      // Apply optimistic update immediately
      state.setOptimisticUpdate(caseId, { [field]: value });

      // Schedule debounced server update
      const timeoutId = setTimeout(async () => {
        try {
          await onUpdate(caseId, field, value);
          // Clear optimistic update after successful server update
          state.clearOptimisticUpdate(caseId, field);

          // Remove from pending updates
          set((state) => {
            const newPending = new Map(state.pendingUpdates);
            newPending.delete(key);
            return { pendingUpdates: newPending };
          });
        } catch (error) {
          console.error("Failed to update field:", error);
          // Revert optimistic update on error
          state.clearOptimisticUpdate(caseId, field);

          // Remove from pending updates
          set((state) => {
            const newPending = new Map(state.pendingUpdates);
            newPending.delete(key);
            return { pendingUpdates: newPending };
          });
        }
      }, debounceMs);

      // Store pending update
      set((state) => {
        const newPending = new Map(state.pendingUpdates);
        newPending.set(key, {
          caseId,
          field,
          value,
          timestamp: Date.now(),
          timeoutId,
        });
        return { pendingUpdates: newPending };
      });
    },

    cancelPendingUpdate: (caseId, field) => {
      const key = `${caseId}:${field}`;
      const update = get().pendingUpdates.get(key);

      if (update) {
        clearTimeout(update.timeoutId);
        set((state) => {
          const newPending = new Map(state.pendingUpdates);
          newPending.delete(key);
          return { pendingUpdates: newPending };
        });
      }
    },

    cancelAllPendingUpdates: () => {
      get().pendingUpdates.forEach((update) => {
        clearTimeout(update.timeoutId);
      });
      set({ pendingUpdates: new Map() });
    },

    setOptimisticUpdate: (caseId, updates) => {
      set((state) => {
        const newOptimistic = new Map(state.optimisticUpdates);
        const existing = newOptimistic.get(caseId) || {};
        newOptimistic.set(caseId, { ...existing, ...updates });
        return { optimisticUpdates: newOptimistic };
      });
    },

    clearOptimisticUpdate: (caseId, field?) => {
      set((state) => {
        const newOptimistic = new Map(state.optimisticUpdates);

        if (field) {
          const existing = newOptimistic.get(caseId);
          if (existing) {
            const rest = { ...existing };
            delete (rest as any)[field];
            if (Object.keys(rest).length === 0) {
              newOptimistic.delete(caseId);
            } else {
              newOptimistic.set(caseId, rest);
            }
          }
        } else {
          newOptimistic.delete(caseId);
        }

        return { optimisticUpdates: newOptimistic };
      });
    },

    getOptimisticValue: (caseId, field) => {
      const updates = get().optimisticUpdates.get(caseId);
      return updates ? (updates as any)[field] : undefined;
    },

    setServerData: (caseId, data) => {
      set((state) => {
        const newServerData = new Map(state.serverData);
        newServerData.set(caseId, data);
        return { serverData: newServerData };
      });
    },

    batchSetServerData: (cases) => {
      set((state) => {
        const newServerData = new Map(state.serverData);
        cases.forEach((case_) => {
          newServerData.set(case_.id, case_);
        });
        return { serverData: newServerData };
      });
    },

    updateServerData: (caseId, updates) => {
      set((state) => {
        const newServerData = new Map(state.serverData);
        const existing = newServerData.get(caseId);

        if (existing) {
          newServerData.set(caseId, { ...existing, ...updates });
        }

        return { serverData: newServerData };
      });
    },

    getServerData: (caseId) => {
      return get().serverData.get(caseId);
    },

    getMergedData: (caseId) => {
      const serverData = get().serverData.get(caseId);
      const optimisticUpdates = get().optimisticUpdates.get(caseId);

      if (!serverData) return undefined;

      if (!optimisticUpdates) return serverData;

      // Merge server data with optimistic updates
      return { ...serverData, ...optimisticUpdates };
    },

    getDisplayValue: (caseId) => {
      // Return optimistic updates only (to be merged with case data in component)
      return get().optimisticUpdates.get(caseId) || {};
    },

    clearAll: () => {
      // Cancel all pending updates
      get().cancelAllPendingUpdates();

      set({
        fieldLocks: new Map(),
        editingFields: new Map(),
        pendingUpdates: new Map(),
        optimisticUpdates: new Map(),
        serverData: new Map(),
      });
    },
  })
);
