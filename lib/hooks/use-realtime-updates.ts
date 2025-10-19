/**
 * Hook for managing SSE connection and real-time updates
 *
 * Features:
 * - Automatic connection/reconnection
 * - Handles disconnection gracefully
 * - Processes real-time updates from other users
 * - Periodic sync with server
 * - Prevents UI disruption during updates
 */

"use client";

import { SSEMessage } from "@/lib/types/realtime";
import { WarrantyCaseWithRelations } from "@/lib/types/warranty";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCollaborativeEditingStore } from "../stores/collaborative-editing-store";

type UseRealtimeUpdatesOptions = {
  branchId: number;
  userId: string;
  onCaseUpdate?: (caseId: number, updates: Record<string, any>) => void;
  onSyncRequired?: (caseId: number) => void;
  syncIntervalMs?: number; // Default: 60000 (1 minute)
  enabled?: boolean;
};

export function useRealtimeUpdates({
  branchId,
  userId,
  onCaseUpdate,
  onSyncRequired,
  syncIntervalMs = 60000,
  enabled = true,
}: UseRealtimeUpdatesOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 1000; // 1 second
  const connectionTimeout = 15000; // 15 seconds - if no data received, connection is stalled

  // Use refs to store callbacks to prevent reconnections when they change
  const onCaseUpdateRef = useRef(onCaseUpdate);
  const onSyncRequiredRef = useRef(onSyncRequired);

  // Update refs when callbacks change
  useEffect(() => {
    onCaseUpdateRef.current = onCaseUpdate;
  }, [onCaseUpdate]);

  useEffect(() => {
    onSyncRequiredRef.current = onSyncRequired;
  }, [onSyncRequired]);

  const { setFieldLock, removeFieldLock, updateServerData, isEditing } =
    useCollaborativeEditingStore();

  // Process SSE messages
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        // Clear connection timeout - we received data, connection is alive
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        const message: SSEMessage = JSON.parse(event.data);

        switch (message.type) {
          case "connection-established":
            console.log("[SSE] Connection established:", message.data);
            setIsConnected(true);
            setConnectionError(null);
            reconnectAttemptsRef.current = 0;
            break;

          case "field-locked":
            console.log("[SSE] Field locked:", message.data);
            setFieldLock(message.data);
            break;

          case "field-unlocked":
            console.log("[SSE] Field unlocked:", message.data);
            removeFieldLock(message.data.caseId, message.data.field);
            break;

          case "case-updated": {
            console.log("[SSE] Case updated:", message.data);
            const { caseId, updates } = message.data;

            // Only update fields that are not currently being edited
            const filteredUpdates: Record<string, any> = {};
            Object.entries(updates).forEach(([field, value]) => {
              const editing = isEditing(caseId, field);
              console.log(
                `[SSE] Field ${field}: editing=${editing}, value=`,
                value
              );
              if (!editing) {
                filteredUpdates[field] = value;
              } else {
                console.log(
                  `[SSE] Skipping field ${field} - currently being edited`
                );
              }
            });

            console.log("[SSE] Filtered updates:", filteredUpdates);

            // Update server data (but not optimistic updates)
            if (Object.keys(filteredUpdates).length > 0) {
              updateServerData(caseId, filteredUpdates);
              onCaseUpdateRef.current?.(caseId, filteredUpdates);
              console.log("[SSE] Applied updates to store");
            } else {
              console.log("[SSE] No updates applied - all fields being edited");
            }
            break;
          }

          case "sync-required":
            console.log("[SSE] Sync required:", message.data);
            onSyncRequiredRef.current?.(message.data.caseId);
            break;

          case "heartbeat":
            // Silent heartbeat
            break;

          default:
            console.warn("[SSE] Unknown message type:", message);
        }
      } catch (error) {
        console.error("[SSE] Failed to parse message:", error);
      }
    },
    [setFieldLock, removeFieldLock, updateServerData, isEditing]
  );

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (!enabled) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Clear any existing connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    try {
      const url = `/api/sse/warranty-updates?branchId=${branchId}`;
      const eventSource = new EventSource(url);

      eventSource.onmessage = handleMessage;

      eventSource.onopen = () => {
        console.log("[SSE] Connection opened");
        // Start connection timeout - if no message received within timeout, reconnect
        connectionTimeoutRef.current = setTimeout(() => {
          console.warn(
            "[SSE] Connection timeout - no data received, reconnecting..."
          );
          setIsConnected(false);
          setConnectionError("Connection stalled");
          eventSource.close();
          // Trigger reconnection
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            connect();
          }
        }, connectionTimeout);
      };

      eventSource.onerror = (error) => {
        console.error("[SSE] Connection error:", error);
        setIsConnected(false);
        setConnectionError("Connection lost");

        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay =
            baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          console.log(`[SSE] Reconnecting in ${delay}ms...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          setConnectionError("Failed to reconnect. Please refresh the page.");
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error("[SSE] Failed to create connection:", error);
      setConnectionError("Failed to establish connection");
    }
  }, [enabled, branchId, handleMessage, connectionTimeout]);

  // Disconnect from SSE endpoint
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Periodic sync to ensure data consistency
  const startPeriodicSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    syncIntervalRef.current = setInterval(() => {
      if (onSyncRequiredRef.current) {
        console.log("[SSE] Periodic sync triggered");
        onSyncRequiredRef.current(-1); // -1 indicates full sync
      }
    }, syncIntervalMs);
  }, [syncIntervalMs]);

  // Connect on mount, disconnect on unmount
  // Only reconnect when branchId or userId changes, not on every render
  useEffect(() => {
    if (enabled) {
      connect();
      startPeriodicSync();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, branchId, userId]); // Only depend on values that should trigger reconnection

  // Handle visibility change (page focus/blur)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, connection will be maintained
        console.log("[SSE] Page hidden");
      } else {
        // Page is visible again, reconnect if needed
        console.log("[SSE] Page visible");
        if (!isConnected) {
          connect();
        }
        // Trigger a sync when page becomes visible
        if (onSyncRequiredRef.current) {
          onSyncRequiredRef.current(-1);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isConnected]); // connect is stable due to useCallback memoization

  return {
    isConnected,
    connectionError,
    reconnect: connect,
    disconnect,
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
