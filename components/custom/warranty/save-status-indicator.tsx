"use client";

import { useCollaborativeEditingStore } from "@/lib/stores/collaborative-editing-store";
import { Check, CloudUpload, Loader2 } from "lucide-react";
import { memo, useEffect, useState } from "react";

type SaveStatusIndicatorProps = {
  caseId?: number; // Optional: show status for specific case
  className?: string;
};

/**
 * SaveStatusIndicator - Visual feedback for auto-save status
 *
 * Shows different states:
 * - "Saving..." when changes are being saved
 * - "Saved" briefly after successful save
 * - "Synced" when all changes are saved
 * - Hidden when no changes or fully synced
 *
 * @example
 * // Show status for all cases
 * <SaveStatusIndicator />
 *
 * @example
 * // Show status for specific case
 * <SaveStatusIndicator caseId={123} />
 */
export const SaveStatusIndicator = memo(function SaveStatusIndicator({
  caseId,
  className = "",
}: SaveStatusIndicatorProps) {
  const { pendingUpdates, hasUnsavedChanges, getPendingSaveCount } =
    useCollaborativeEditingStore();

  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "synced">(
    "synced"
  );
  const [fadeOut, setFadeOut] = useState(false);

  // Check if there are any saves in progress
  const isSaving = Array.from(pendingUpdates.values()).some((update) => {
    if (caseId !== undefined) {
      return update.caseId === caseId && update.isSaving;
    }
    return update.isSaving;
  });

  // Check if there are pending changes
  const hasPending =
    caseId !== undefined ? hasUnsavedChanges(caseId) : hasUnsavedChanges();

  // Get count for display
  const pendingCount = getPendingSaveCount();

  useEffect(() => {
    if (isSaving) {
      setStatus("saving");
      setFadeOut(false);
    } else if (hasPending && status === "saving") {
      // Still has pending changes, stay in saving
      setStatus("saving");
    } else if (!hasPending && status === "saving") {
      // Just finished saving
      setStatus("saved");
      setFadeOut(false);

      // Transition to synced after showing "saved" briefly
      const timer = setTimeout(() => {
        setStatus("synced");

        // Fade out after showing synced
        const fadeTimer = setTimeout(() => {
          setFadeOut(true);
        }, 2000);

        return () => clearTimeout(fadeTimer);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isSaving, hasPending, status]);

  // Don't show if synced and faded out
  if (status === "synced" && fadeOut) {
    return null;
  }

  // Don't show if nothing to display
  if (status === "idle") {
    return null;
  }

  return (
    <div
      className={`
        flex items-center gap-2 text-sm transition-opacity duration-500
        ${fadeOut ? "opacity-0" : "opacity-100"}
        ${className}
      `}
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-blue-600 dark:text-blue-400">
            Saving{pendingCount > 1 ? ` (${pendingCount})` : ""}...
          </span>
        </>
      )}

      {status === "saved" && (
        <>
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-green-600 dark:text-green-400">Saved!</span>
        </>
      )}

      {status === "synced" && (
        <>
          <CloudUpload className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-gray-500 dark:text-gray-400">
            All changes synced
          </span>
        </>
      )}
    </div>
  );
});
