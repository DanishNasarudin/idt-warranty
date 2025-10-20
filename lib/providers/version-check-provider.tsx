/**
 * Version Check Provider
 *
 * Wraps the application and manages version checking.
 * Shows a modal when a new version is detected.
 */

"use client";

import { VersionUpdateModal } from "@/components/custom/version-update-modal";
import { useVersionCheck } from "@/lib/hooks/use-version-check";
import { useCallback, useEffect, useState } from "react";

type VersionCheckProviderProps = {
  children: React.ReactNode;
};

/**
 * Get dismissed version from localStorage
 */
const getDismissedVersion = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem("dismissed-version");
  } catch (error) {
    console.error("[Version Check] Error reading dismissed version:", error);
    return null;
  }
};

/**
 * Save dismissed version to localStorage
 */
const saveDismissedVersion = (buildTimestamp: string) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("dismissed-version", buildTimestamp);
  } catch (error) {
    console.error("[Version Check] Error saving dismissed version:", error);
  }
};

/**
 * Clear dismissed version from localStorage
 */
const clearDismissedVersion = () => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("dismissed-version");
  } catch (error) {
    console.error("[Version Check] Error clearing dismissed version:", error);
  }
};

export function VersionCheckProvider({ children }: VersionCheckProviderProps) {
  const [showModal, setShowModal] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);

  // Load dismissed version from localStorage on mount
  useEffect(() => {
    const stored = getDismissedVersion();
    if (stored) {
      setDismissedVersion(stored);
      console.log("[Version Check] Loaded dismissed version:", stored);
    }
  }, []);

  const { currentVersion, hasUpdate } = useVersionCheck({
    pollInterval: 300000, // Check every 5 minutes
    enabled: true,
    onVersionUpdate: (newVersion) => {
      // Only show modal if user hasn't dismissed this specific version
      if (dismissedVersion !== newVersion.buildTimestamp) {
        console.log(
          "[Version Check] Showing modal for new version:",
          newVersion
        );
        setShowModal(true);
      } else {
        console.log(
          "[Version Check] Version was previously dismissed:",
          newVersion
        );
      }
    },
  });

  const handleReload = useCallback(() => {
    // Clear dismissed version when reloading
    clearDismissedVersion();
    // Hard reload to ensure all resources are fresh
    window.location.reload();
  }, []);

  const handleDismiss = useCallback(() => {
    // Remember this version so we don't show the modal again for the same version
    if (currentVersion) {
      setDismissedVersion(currentVersion.buildTimestamp);
      saveDismissedVersion(currentVersion.buildTimestamp);
      console.log(
        "[Version Check] Dismissed version:",
        currentVersion.buildTimestamp
      );
    }
    setShowModal(false);

    // Show the modal again after 10 minutes if user hasn't reloaded
    setTimeout(() => {
      setShowModal(true);
    }, 600000); // 10 minutes
  }, [currentVersion]);

  return (
    <>
      {children}
      <VersionUpdateModal
        open={showModal && hasUpdate}
        onOpenChange={setShowModal}
        onReload={handleReload}
        onDismiss={handleDismiss}
        version={currentVersion?.version}
      />
    </>
  );
}
