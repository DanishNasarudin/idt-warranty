"use client";

import { deleteWarrantyCase } from "@/app/(warranty)/branch/[id]/actions";
import { getAvailableTransferBranches } from "@/app/(warranty)/branch/[id]/transfer-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCollaborativeEditingStore } from "@/lib/stores/collaborative-editing-store";
import { useWarrantyCaseStore } from "@/lib/stores/warranty-case-store";
import { BranchOption, WarrantyCaseWithRelations } from "@/lib/types/warranty";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  Check,
  Copy,
  History,
  Lock,
  MessageCircle,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageList } from "./image-list";
import { ImageUpload } from "./image-upload";
import { PrintPDFButton } from "./print-pdf-button";
import { SendEmailButton } from "./send-email-button";
import { TransferCaseDialog } from "./transfer-case-dialog";
import { TransferHistoryDialog } from "./transfer-history-dialog";

type ExpandableRowDetailsProps = {
  case_: WarrantyCaseWithRelations;
  onUpdate: (updates: Partial<WarrantyCaseWithRelations>) => void;
  onUpdateField?: (caseId: number, field: string, value: any) => Promise<void>;
  onAcquireFieldLock?: (caseId: number, field: string) => Promise<boolean>;
  onReleaseFieldLock?: (caseId: number, field: string) => Promise<void>;
  userId?: string;
  staffId?: number;
  isExpanded: boolean;
};

export function ExpandableRowDetails({
  case_,
  onUpdate,
  onUpdateField,
  onAcquireFieldLock,
  onReleaseFieldLock,
  userId = "",
  staffId,
  isExpanded,
}: ExpandableRowDetailsProps) {
  const [localData, setLocalData] = useState({
    customerEmail: case_.customerEmail || "",
    address: case_.address || "",
    purchaseDate: case_.purchaseDate
      ? new Date(case_.purchaseDate).toISOString().split("T")[0]
      : "",
    invoice: case_.invoice || "",
    receivedItems: case_.receivedItems || "",
    pin: case_.pin || "",
    issues: case_.issues || "",
    solutions: case_.solutions || "",
    statusDesc: case_.statusDesc || "",
    remarks: case_.remarks || "",
    cost: case_.cost?.toString() || "0",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<BranchOption[]>(
    []
  );
  const [imageRefreshTrigger, setImageRefreshTrigger] = useState(0);
  const deleteCase = useWarrantyCaseStore((state) => state.deleteCase);
  const { isFieldLocked } = useCollaborativeEditingStore();

  // Load available branches for transfer when row is expanded
  // This prevents unnecessary server action calls when row is collapsed
  useEffect(() => {
    if (!isExpanded) return; // Only load when row is expanded

    const loadBranches = async () => {
      try {
        const branches = await getAvailableTransferBranches(case_.branchId);
        setAvailableBranches(branches);
      } catch (error) {
        console.error("Failed to load branches:", error);
      }
    };
    loadBranches();
  }, [isExpanded, case_.branchId]); // Trigger when row expands

  // Sync local data with case_ prop changes (from real-time updates)
  // Update all fields from SSE/props, but preserve any field that currently has DOM focus
  useEffect(() => {
    // Check which field (if any) currently has DOM focus
    const activeElement = document.activeElement as HTMLElement;
    const activeFieldId = activeElement?.id;
    let currentlyFocusedField: string | null = null;

    if (activeFieldId?.startsWith(`${case_.id}-`)) {
      // Extract field name: "123-customerEmail" -> "customerEmail"
      currentlyFocusedField = activeFieldId.replace(`${case_.id}-`, "");
    }

    console.log("[ExpandableRow] SSE Update Received:", {
      caseId: case_.id,
      isExpanded,
      activeFieldId,
      currentlyFocusedField,
      activeElementTag: activeElement?.tagName,
    });

    // Update local data, but preserve the value of any field that has DOM focus
    setLocalData((prev) => {
      const newData = {
        customerEmail: case_.customerEmail || "",
        address: case_.address || "",
        purchaseDate: case_.purchaseDate
          ? new Date(case_.purchaseDate).toISOString().split("T")[0]
          : "",
        invoice: case_.invoice || "",
        receivedItems: case_.receivedItems || "",
        pin: case_.pin || "",
        issues: case_.issues || "",
        solutions: case_.solutions || "",
        statusDesc: case_.statusDesc || "",
        remarks: case_.remarks || "",
        cost: case_.cost?.toString() || "0",
      };

      // If a field has DOM focus right now, preserve its local value (don't overwrite while typing)
      if (
        currentlyFocusedField &&
        prev[currentlyFocusedField as keyof typeof prev] !== undefined
      ) {
        console.log(
          "[ExpandableRow] Preserving focused field:",
          currentlyFocusedField
        );
        return {
          ...newData,
          [currentlyFocusedField]:
            prev[currentlyFocusedField as keyof typeof prev],
        };
      }

      console.log("[ExpandableRow] Updating all fields from SSE");
      return newData;
    });
  }, [case_]);

  const handleChange = (field: string, value: string) => {
    // Only update local state - save happens on blur
    setLocalData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFocus = async (field: string) => {
    setFocusedField(field);

    // Try to acquire lock if locking is enabled
    if (onAcquireFieldLock) {
      const acquired = await onAcquireFieldLock(case_.id, field);
      if (!acquired) {
        // Lock acquisition failed, blur the field
        const element = document.getElementById(`${case_.id}-${field}`);
        if (element) {
          (element as HTMLInputElement | HTMLTextAreaElement).blur();
        }
        return;
      }
    }
  };

  const handleBlur = async (field: string) => {
    setFocusedField(null);

    const value = localData[field as keyof typeof localData];
    const currentValue = case_[field as keyof WarrantyCaseWithRelations];

    // Only save if value actually changed
    if (value !== (currentValue?.toString() || "")) {
      // Convert to appropriate type before saving
      let updateValue: any = value;

      if (field === "cost") {
        updateValue = parseFloat(value) || 0;
      } else if (field === "purchaseDate") {
        updateValue = value ? new Date(value) : null;
      }

      // Use onUpdateField if available for debounced updates with save status tracking
      // Otherwise fall back to immediate update
      if (onUpdateField) {
        await onUpdateField(case_.id, field, updateValue);
      } else {
        onUpdate({ [field]: updateValue });
      }
    }

    // Release lock if locking is enabled
    if (onReleaseFieldLock) {
      await onReleaseFieldLock(case_.id, field);
    }
  };

  const getFieldLockStatus = (field: string) => {
    if (!userId) return { isLocked: false, lockedBy: undefined };

    const lock = isFieldLocked(case_.id, field, userId);
    const status = {
      isLocked: lock !== null,
      lockedBy: lock?.userName,
    };

    // Debug logging
    if (lock) {
      console.log(`[Lock Status] Case ${case_.id}, Field ${field}:`, status);
    }

    return status;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWarrantyCase(case_.id, case_.branchId);
      deleteCase(case_.id);
      toast.success("Warranty case deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete warranty case");
      console.error("Error deleting warranty case:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = async (field: string, value: string) => {
    if (value) {
      try {
        await navigator.clipboard.writeText(value);
        setCopiedField(field);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopiedField(null), 2000);
      } catch (err) {
        toast.error("Failed to copy");
      }
    }
  };

  const fields = [
    { name: "customerEmail", label: "Customer Email", type: "email" },
    { name: "purchaseDate", label: "Purchase Date", type: "date" },
    { name: "invoice", label: "Invoice", type: "text" },
    { name: "address", label: "Address", type: "text", multiline: true },
    {
      name: "statusDesc",
      label: "Status Description (Waiting For)",
      type: "text",
      multiline: true,
    },
    { name: "remarks", label: "Remarks", type: "text", multiline: true },
    { name: "receivedItems", label: "Received Items", type: "text" },
    { name: "pin", label: "PIN", type: "text" },
    { name: "cost", label: "Cost (RM)", type: "number" },
    { name: "issues", label: "Issues", type: "text", multiline: true },
    { name: "solutions", label: "Solutions", type: "text", multiline: true },
  ];

  return (
    <div
      className={cn(
        "grid transition-all duration-300 ease-in-out",
        isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
    >
      <div className="overflow-hidden">
        <div className="bg-muted/30">
          {/* Action Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Case Actions
              </h3>
              {/* Show transfer indicator if case was transferred */}
              {case_.originBranchId &&
                case_.originBranchId !== case_.branchId &&
                case_.originBranch && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <ArrowRightLeft className="h-3 w-3" />
                    From {case_.originBranch.name}
                  </Badge>
                )}
            </div>
            <div className="flex items-center gap-2">
              {/* WhatsApp Contact Button */}
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (case_.customerContact) {
                          // Format phone number: remove spaces, dashes, and ensure it starts with country code
                          let phoneNumber = case_.customerContact.replace(
                            /[\s-]/g,
                            ""
                          );

                          // If the number doesn't start with '+' or country code, you might want to add one
                          // For Malaysia, add '60' if it starts with '0'
                          if (phoneNumber.startsWith("0")) {
                            phoneNumber = "60" + phoneNumber.substring(1);
                          }

                          // Open WhatsApp with the formatted number
                          window.open(`https://wa.me/${phoneNumber}`, "_blank");
                        }
                      }}
                      className="gap-2"
                      disabled={!case_.customerContact}
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  </TooltipTrigger>
                  {!case_.customerContact && (
                    <TooltipContent side="top" className="text-xs">
                      <p>No contact number available</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              {/* Transfer Case Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTransferDialog(true)}
                className="gap-2"
                disabled={availableBranches.length === 0}
              >
                <ArrowRightLeft className="h-4 w-4" />
                Transfer
              </Button>

              {/* Transfer History Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistoryDialog(true)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                History
              </Button>

              {/* Print PDF Button */}
              <PrintPDFButton case_={case_} />

              {/* Send Email Button - Only shows if customer email exists */}
              <SendEmailButton case_={case_} />

              {/* Delete Button with Confirmation */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Case
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the warranty case <strong>{case_.serviceNo}</strong> for{" "}
                      <strong>{case_.customerName}</strong> and remove all
                      associated data from the system.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {/* Add more action buttons here in the future */}
            </div>
          </div>

          {/* Existing Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {fields.map((field) => {
              const lockStatus = getFieldLockStatus(field.name);
              const fieldValue =
                localData[field.name as keyof typeof localData];

              return (
                <div key={field.name} className="space-y-2">
                  <Label
                    htmlFor={`${case_.id}-${field.name}`}
                    className={cn(
                      "text-sm font-medium flex items-center gap-1",
                      lockStatus.isLocked && "text-muted-foreground"
                    )}
                  >
                    {lockStatus.isLocked && (
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Lock className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p>Locked by {lockStatus.lockedBy}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {field.label}
                  </Label>
                  <div
                    className="relative group"
                    onMouseEnter={() => setHoveredField(field.name)}
                    onMouseLeave={() => setHoveredField(null)}
                  >
                    {field.multiline ? (
                      <textarea
                        id={`${case_.id}-${field.name}`}
                        value={fieldValue}
                        onChange={(e) =>
                          handleChange(field.name, e.target.value)
                        }
                        onFocus={() => handleFocus(field.name)}
                        onBlur={() => handleBlur(field.name)}
                        disabled={lockStatus.isLocked}
                        className={cn(
                          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                          lockStatus.isLocked && "bg-muted/50"
                        )}
                      />
                    ) : (
                      <Input
                        id={`${case_.id}-${field.name}`}
                        type={field.type}
                        value={fieldValue}
                        onChange={(e) =>
                          handleChange(field.name, e.target.value)
                        }
                        onFocus={() => handleFocus(field.name)}
                        onBlur={() => handleBlur(field.name)}
                        disabled={lockStatus.isLocked}
                        className={cn(lockStatus.isLocked && "bg-muted/50")}
                      />
                    )}

                    {/* Copy Button - Center Right for Input, Top Right for Textarea */}
                    {fieldValue &&
                      hoveredField === field.name &&
                      focusedField !== field.name && (
                        <button
                          onClick={() => handleCopy(field.name, fieldValue)}
                          className={cn(
                            "absolute right-2 p-1.5 rounded bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-accent transition-all opacity-0 group-hover:opacity-100",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            field.multiline
                              ? "top-2"
                              : "top-1/2 -translate-y-1/2"
                          )}
                          aria-label="Copy to clipboard"
                        >
                          {copiedField === field.name ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Images Section */}
          <div className="border-t px-4 py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Images</Label>
              <ImageUpload
                caseId={case_.id}
                onUploadComplete={() => {
                  // Trigger image list refresh
                  setImageRefreshTrigger((prev) => prev + 1);
                }}
              />
            </div>
            <ImageList
              caseId={case_.id}
              refreshTrigger={imageRefreshTrigger}
              isOpen={isExpanded}
              hasImages={case_._count ? case_._count.files > 0 : undefined}
            />
          </div>

          {/* Transfer Dialogs */}
          <TransferCaseDialog
            open={showTransferDialog}
            onOpenChange={setShowTransferDialog}
            caseId={case_.id}
            currentBranchId={case_.branchId}
            currentBranchName={case_.branch.name}
            serviceNo={case_.serviceNo}
            availableBranches={availableBranches}
            staffId={staffId}
            onTransferComplete={() => {
              // Optionally refresh the page or update local state
              window.location.reload();
            }}
          />

          <TransferHistoryDialog
            open={showHistoryDialog}
            onOpenChange={setShowHistoryDialog}
            caseId={case_.id}
            serviceNo={case_.serviceNo}
          />
        </div>
      </div>
    </div>
  );
}
