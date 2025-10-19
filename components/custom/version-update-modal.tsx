/**
 * Version Update Modal
 *
 * Displays a modal to notify users when a new version of the app is available.
 * Provides options to reload immediately or dismiss (with reminder).
 */

"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefreshCw } from "lucide-react";

type VersionUpdateModalProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onReload: () => void;
  onDismiss?: () => void;
  version?: string;
};

export function VersionUpdateModal({
  open,
  onOpenChange,
  onReload,
  onDismiss,
  version,
}: VersionUpdateModalProps) {
  const handleReload = () => {
    onReload();
  };

  const handleDismiss = () => {
    onDismiss?.();
    onOpenChange?.(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <RefreshCw className="h-5 w-5 text-blue-500" />
            </div>
            <AlertDialogTitle className="text-left">
              New Version Available
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            A new version of the application is available.{" "}
            {version && (
              <span className="font-medium text-foreground">
                Version {version}
              </span>
            )}
            <br />
            <br />
            Please reload the page to get the latest updates and improvements.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDismiss}>
            Remind me later
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReload}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
