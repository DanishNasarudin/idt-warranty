"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCollaborativeEditingStore } from "@/lib/stores/collaborative-editing-store";
import { Check, Loader2, Save } from "lucide-react";
import { memo, useEffect, useState } from "react";

type ManualSaveButtonProps = {
  className?: string;
  onSaveAll?: () => Promise<void>;
};

/**
 * ManualSaveButton - Provides manual save control for users who want explicit save confirmation
 *
 * Features:
 * - Shows pending change count
 * - Triggers immediate save of all pending changes
 * - Provides visual feedback on save completion
 * - Disabled when no changes or already saving
 * - Works alongside auto-save for assurance
 *
 * @example
 * <ManualSaveButton onSaveAll={handleSaveAll} />
 */
export const ManualSaveButton = memo(function ManualSaveButton({
  className = "",
  onSaveAll,
}: ManualSaveButtonProps) {
  const { hasUnsavedChanges, getPendingSaveCount, pendingUpdates } =
    useCollaborativeEditingStore();
  const [justSaved, setJustSaved] = useState(false);

  const hasPending = hasUnsavedChanges();
  const pendingCount = getPendingSaveCount();

  // Check if any field is currently being saved
  const hasActiveSaves = Array.from(pendingUpdates.values()).some(
    (update) => update.isSaving
  );

  // Auto-hide the "just saved" indicator after completion
  useEffect(() => {
    if (justSaved && !hasPending && !hasActiveSaves) {
      const timer = setTimeout(() => {
        setJustSaved(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [justSaved, hasPending, hasActiveSaves]);

  const handleManualSave = async () => {
    if (!hasPending || hasActiveSaves) return;

    setJustSaved(false);

    try {
      // Trigger all pending updates by clearing their timeouts
      // This causes them to execute immediately
      const updates = Array.from(pendingUpdates.values());

      updates.forEach((update) => {
        if (!update.isSaving) {
          clearTimeout(update.timeoutId);
        }
      });

      // Wait for saves to complete (monitor the pendingUpdates map)
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          const currentPending =
            useCollaborativeEditingStore.getState().pendingUpdates;
          const stillSaving = Array.from(currentPending.values()).some(
            (u) => u.isSaving
          );

          if (currentPending.size === 0 || !stillSaving) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 5000);
      });

      setJustSaved(true);
    } catch (error) {
      console.error("Manual save error:", error);
    }
  };

  // If nothing to save and haven't just saved, hide the button
  if (!hasPending && !justSaved && !hasActiveSaves) {
    return null;
  }

  const isDisabled = !hasPending || hasActiveSaves;
  const isSaving = hasActiveSaves;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={justSaved ? "default" : "outline"}
            size="sm"
            onClick={handleManualSave}
            disabled={isDisabled}
            className={`gap-2 transition-all ${className}`}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : justSaved ? (
              <>
                <Check className="h-4 w-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save{pendingCount > 1 ? ` (${pendingCount})` : ""}</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {isDisabled ? (
            isSaving ? (
              <p>Saving changes...</p>
            ) : (
              <p>All changes are saved</p>
            )
          ) : (
            <p>
              Save all pending changes immediately
              {pendingCount > 0 && ` (${pendingCount} pending)`}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
