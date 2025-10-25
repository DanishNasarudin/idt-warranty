"use client";

import { useWarrantySync } from "@/lib/hooks/use-warranty-sync";
import { WarrantyCaseFilters } from "@/lib/types/search-params";
import {
  StaffOption,
  WarrantyCaseUpdate,
  WarrantyCaseWithRelations,
} from "@/lib/types/warranty";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  CreateWarrantyCaseDialog,
  CreateWarrantyCaseFormData,
} from "./create-warranty-case-dialog";
import { ManualSaveButton } from "./manual-save-button";
import { SaveStatusIndicator } from "./save-status-indicator";
import { TablePagination } from "./table-pagination";
import { TableToolbar } from "./table-toolbar";
import { WarrantyCaseTable } from "./warranty-case-table";

type WarrantyCaseTableWrapperProps = {
  initialCases: WarrantyCaseWithRelations[];
  totalCount: number;
  initialStaff: StaffOption[];
  branchId: number;
  filters: WarrantyCaseFilters;
  onUpdateCase: (caseId: number, updates: WarrantyCaseUpdate) => Promise<void>;
  onCreateCase: (data: CreateWarrantyCaseFormData) => Promise<void>;
};

export function WarrantyCaseTableWrapper({
  initialCases,
  totalCount,
  initialStaff,
  branchId,
  filters,
  onUpdateCase,
  onCreateCase,
}: WarrantyCaseTableWrapperProps) {
  const { userId } = useAuth();
  const { user } = useUser();

  // Use the custom hook for all sync and collaborative editing logic
  const {
    isConnected,
    handleUpdateWithDebounce,
    handleAcquireFieldLock,
    handleReleaseFieldLock,
  } = useWarrantySync({
    branchId,
    userId: userId || null,
    userName: user?.fullName || user?.firstName || null,
    initialCases,
    onUpdateCase,
    enabled: !!userId,
  });

  // Handle non-debounced updates (for dropdowns, etc.)
  const handleUpdateWithToast = async (
    caseId: number,
    updates: WarrantyCaseUpdate
  ) => {
    try {
      await onUpdateCase(caseId, updates);
    } catch (error) {
      toast.error("Failed to save changes. Please try again.");
      throw error;
    }
  };

  // Handle case creation
  const handleCreateWithToast = async (data: CreateWarrantyCaseFormData) => {
    try {
      await onCreateCase(data);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection and Saving status indicators */}
      {userId && (
        <div className="flex items-center gap-4 text-xs min-h-8">
          {/* Connection status */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <span>
              {isConnected ? "Real-time updates active" : "Connecting..."}
            </span>
          </div>

          {/* Saving status - using improved SaveStatusIndicator */}
          <SaveStatusIndicator />

          {/* Manual Save Button - for user assurance */}
          <ManualSaveButton />
        </div>
      )}

      {/* Toolbar with search, filters, and create button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <TableToolbar filters={filters} />
        <CreateWarrantyCaseDialog
          branchId={branchId}
          staff={initialStaff}
          onCreateCase={handleCreateWithToast}
        />
      </div>

      {/* Table */}
      <WarrantyCaseTable
        initialCases={initialCases}
        initialStaff={initialStaff}
        onUpdateCase={handleUpdateWithToast}
        onUpdateField={handleUpdateWithDebounce}
        onAcquireFieldLock={handleAcquireFieldLock}
        onReleaseFieldLock={handleReleaseFieldLock}
        userId={userId || ""}
      />

      {/* Pagination */}
      <TablePagination filters={filters} totalCases={totalCount} />
    </div>
  );
}
