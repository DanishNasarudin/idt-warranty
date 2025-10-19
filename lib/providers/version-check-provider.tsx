/**
 * Version Check Provider
 *
 * Wraps the application and manages version checking.
 * Shows a modal when a new version is detected.
 */

"use client";

import { VersionUpdateModal } from "@/components/custom/version-update-modal";
import { useVersionCheck } from "@/lib/hooks/use-version-check";
import { useCallback, useState } from "react";

type VersionCheckProviderProps = {
  children: React.ReactNode;
};

export function VersionCheckProvider({ children }: VersionCheckProviderProps) {
  const [showModal, setShowModal] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);

  const { currentVersion, hasUpdate } = useVersionCheck({
    pollInterval: 300000, // Check every 5 minutes
    enabled: true,
    onVersionUpdate: (newVersion) => {
      // Only show modal if user hasn't dismissed this specific version
      if (dismissedVersion !== newVersion.buildTimestamp) {
        setShowModal(true);
      }
    },
  });

  const handleReload = useCallback(() => {
    // Hard reload to ensure all resources are fresh
    window.location.reload();
  }, []);

  const handleDismiss = useCallback(() => {
    // Remember this version so we don't show the modal again for the same version
    if (currentVersion) {
      setDismissedVersion(currentVersion.buildTimestamp);
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
