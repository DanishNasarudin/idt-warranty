/**
 * Version Check Hook
 *
 * Manages version checking for the application.
 * - Polls the version API at regular intervals
 * - Only checks when user hasn't navigated (stays on same page)
 * - Handles both SSE updates and polling fallback
 * - Tracks session duration to optimize resource usage
 */

"use client";

import { isVersionDifferent } from "@/lib/utils/app-version";
import { useCallback, useEffect, useRef, useState } from "react";
import { SSEMessage } from "../types/realtime";

type VersionInfo = {
  version: string;
  buildTimestamp: string;
  commitHash?: string;
};

type UseVersionCheckOptions = {
  /**
   * How often to poll for version updates (milliseconds)
   * @default 300000 (5 minutes)
   */
  pollInterval?: number;

  /**
   * Whether to enable version checking
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when new version is detected
   */
  onVersionUpdate?: (newVersion: VersionInfo) => void;

  /**
   * Whether to use SSE for real-time version updates
   * Falls back to polling if SSE is not available
   * @default true
   */
  useSSE?: boolean;
};

export function useVersionCheck({
  pollInterval = 300000, // 5 minutes
  enabled = true,
  onVersionUpdate,
  useSSE = true,
}: UseVersionCheckOptions = {}) {
  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(
    null
  );
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const lastCheckRef = useRef<number>(0);

  // Track page visibility to pause checks when user is away
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Store callback in ref to avoid re-establishing connections
  const onVersionUpdateRef = useRef(onVersionUpdate);

  useEffect(() => {
    onVersionUpdateRef.current = onVersionUpdate;
  }, [onVersionUpdate]);

  /**
   * Fetch current version from API
   */
  const checkVersion = useCallback(async () => {
    if (!enabled || isChecking) return;

    try {
      setIsChecking(true);
      lastCheckRef.current = Date.now();

      const response = await fetch("/api/version", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch version");
      }

      const newVersion: VersionInfo = await response.json();

      // If this is the first check, just store the version
      if (!currentVersion) {
        setCurrentVersion(newVersion);
        console.log("[Version Check] Initial version:", newVersion);
        return;
      }

      // Check if version has changed
      if (
        isVersionDifferent(
          currentVersion.buildTimestamp,
          newVersion.buildTimestamp
        )
      ) {
        console.log("[Version Check] New version detected:", newVersion);
        setHasUpdate(true);
        setCurrentVersion(newVersion);
        onVersionUpdateRef.current?.(newVersion);
      }
    } catch (error) {
      console.error("[Version Check] Error checking version:", error);
    } finally {
      setIsChecking(false);
    }
  }, [enabled, currentVersion, isChecking]);

  /**
   * Handle SSE messages for version updates
   */
  const handleSSEMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);

        if (message.type === "app-version-updated") {
          const newVersion = message.data;
          console.log("[Version Check] SSE version update:", newVersion);

          if (
            currentVersion &&
            isVersionDifferent(
              currentVersion.buildTimestamp,
              newVersion.buildTimestamp
            )
          ) {
            setHasUpdate(true);
            setCurrentVersion(newVersion);
            onVersionUpdateRef.current?.(newVersion);
          }
        }
      } catch (error) {
        console.error("[Version Check] Error handling SSE message:", error);
      }
    },
    [currentVersion]
  );

  /**
   * Connect to SSE for real-time updates
   */
  const connectSSE = useCallback(() => {
    if (!useSSE || !enabled || eventSourceRef.current) return;

    try {
      // Use the existing warranty updates SSE endpoint
      // This is more efficient than creating a separate endpoint
      const eventSource = new EventSource(
        `/api/sse/warranty-updates?branchId=0`
      );

      eventSource.addEventListener("message", handleSSEMessage);

      eventSource.addEventListener("error", (error) => {
        console.error("[Version Check] SSE error:", error);
        // Don't automatically reconnect - let polling handle it
        eventSource.close();
        eventSourceRef.current = null;
      });

      eventSourceRef.current = eventSource;
      console.log("[Version Check] SSE connected");
    } catch (error) {
      console.error("[Version Check] Failed to connect SSE:", error);
    }
  }, [useSSE, enabled, handleSSEMessage]);

  /**
   * Disconnect SSE
   */
  const disconnectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      console.log("[Version Check] SSE disconnected");
    }
  }, []);

  /**
   * Handle page visibility changes
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  /**
   * Initial version check
   */
  useEffect(() => {
    if (enabled) {
      checkVersion();
    }
  }, [enabled]); // Only run on mount and when enabled changes

  /**
   * Set up polling
   */
  useEffect(() => {
    if (!enabled || !isPageVisible) {
      return;
    }

    // Start polling
    pollIntervalRef.current = setInterval(() => {
      checkVersion();
    }, pollInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [enabled, isPageVisible, pollInterval, checkVersion]);

  /**
   * Set up SSE connection (optional)
   * Note: In production, you might want to only connect SSE when user is authenticated
   * and already has a warranty SSE connection
   */
  useEffect(() => {
    if (enabled && useSSE && isPageVisible) {
      // Delay SSE connection to avoid initial overhead
      const timeout = setTimeout(() => {
        connectSSE();
      }, 2000);

      return () => {
        clearTimeout(timeout);
        disconnectSSE();
      };
    } else {
      disconnectSSE();
    }
  }, [enabled, useSSE, isPageVisible, connectSSE, disconnectSSE]);

  /**
   * Calculate session duration in minutes
   */
  const getSessionDuration = useCallback(() => {
    return Math.floor((Date.now() - sessionStartRef.current) / 60000);
  }, []);

  return {
    currentVersion,
    hasUpdate,
    isChecking,
    checkVersion,
    sessionDuration: getSessionDuration(),
    isPageVisible,
  };
}
