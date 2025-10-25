/**
 * Version Check Hook
 *
 * Manages version checking for the application.
 * - Polls the version API at regular intervals
 * - Only checks when user hasn't navigated (stays on same page)
 * - Uses Socket.IO for real-time updates instead of SSE
 * - Tracks session duration to optimize resource usage
 */

"use client";

import { isVersionDifferent } from "@/lib/utils/app-version";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "../providers/socket-provider";

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
};

export function useVersionCheck({
  pollInterval = 300000, // 5 minutes
  enabled = true,
  onVersionUpdate,
}: UseVersionCheckOptions = {}) {
  const { socket, isConnected } = useSocket();
  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(
    null
  );
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
   * Load last known version from localStorage
   */
  const getStoredVersion = useCallback((): VersionInfo | null => {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem("app-version");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("[Version Check] Error reading localStorage:", error);
      return null;
    }
  }, []);

  /**
   * Save version to localStorage
   */
  const saveStoredVersion = useCallback((version: VersionInfo) => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("app-version", JSON.stringify(version));
    } catch (error) {
      console.error("[Version Check] Error writing to localStorage:", error);
    }
  }, []);

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

      // If this is the first check, check against stored version first
      if (!currentVersion) {
        const storedVersion = getStoredVersion();

        // If we have a stored version and it's different from server version
        if (
          storedVersion &&
          isVersionDifferent(
            storedVersion.buildTimestamp,
            newVersion.buildTimestamp
          )
        ) {
          console.log(
            "[Version Check] New version detected on initial load:",
            newVersion
          );
          setHasUpdate(true);
          setCurrentVersion(newVersion);
          saveStoredVersion(newVersion);
          onVersionUpdateRef.current?.(newVersion);
        } else {
          // First load or same version - just store it
          setCurrentVersion(newVersion);
          saveStoredVersion(newVersion);
          console.log("[Version Check] Initial version:", newVersion);
        }
        return;
      }

      // Check if version has changed from current version
      if (
        isVersionDifferent(
          currentVersion.buildTimestamp,
          newVersion.buildTimestamp
        )
      ) {
        console.log("[Version Check] New version detected:", newVersion);
        setHasUpdate(true);
        setCurrentVersion(newVersion);
        saveStoredVersion(newVersion);
        onVersionUpdateRef.current?.(newVersion);
      }
    } catch (error) {
      console.error("[Version Check] Error checking version:", error);
    } finally {
      setIsChecking(false);
    }
  }, [
    enabled,
    currentVersion,
    isChecking,
    getStoredVersion,
    saveStoredVersion,
  ]);

  /**
   * Handle Socket.IO version update messages
   */
  useEffect(() => {
    if (!socket || !enabled || !isConnected) {
      return;
    }

    const handleVersionUpdate = (data: VersionInfo) => {
      console.log("[Version Check] Socket.IO version update:", data);

      if (
        currentVersion &&
        isVersionDifferent(currentVersion.buildTimestamp, data.buildTimestamp)
      ) {
        setHasUpdate(true);
        setCurrentVersion(data);
        saveStoredVersion(data);
        onVersionUpdateRef.current?.(data);
      }
    };

    // Listen for version updates from Socket.IO
    socket.on("app-version-updated", handleVersionUpdate);

    console.log("[Version Check] Listening for Socket.IO version updates");

    return () => {
      socket.off("app-version-updated", handleVersionUpdate);
    };
  }, [socket, enabled, isConnected, currentVersion, saveStoredVersion]);

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
