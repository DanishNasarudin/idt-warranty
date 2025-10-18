"use client";

import {
  StaffOption,
  WarrantyCaseUpdate,
  WarrantyCaseWithRelations,
} from "@/lib/types/warranty";
import { toast } from "sonner";
import { CreateWarrantyCaseDialog, CreateWarrantyCaseFormData } from "./create-warranty-case-dialog";
import { TablePagination } from "./table-pagination";
import { TableToolbar } from "./table-toolbar";
import { WarrantyCaseTable } from "./warranty-case-table";

type WarrantyCaseTableWrapperProps = {
  initialCases: WarrantyCaseWithRelations[];
  initialStaff: StaffOption[];
  branchId: number;
  onUpdateCase: (caseId: number, updates: WarrantyCaseUpdate) => Promise<void>;
  onCreateCase: (data: CreateWarrantyCaseFormData) => Promise<void>;
};

export function WarrantyCaseTableWrapper({
  initialCases,
  initialStaff,
  branchId,
  onUpdateCase,
  onCreateCase,
}: WarrantyCaseTableWrapperProps) {
  const handleUpdateWithToast = async (
    caseId: number,
    updates: WarrantyCaseUpdate
  ) => {
    try {
      await onUpdateCase(caseId, updates);
      // Optionally show success toast for specific updates
      // toast.success("Changes saved");
    } catch (error) {
      toast.error("Failed to save changes. Please try again.");
      throw error;
    }
  };

  const handleCreateWithToast = async (data: CreateWarrantyCaseFormData) => {
    try {
      await onCreateCase(data);
      // Success toast is handled in the dialog component
    } catch (error: any) {
      // Error toast is handled in the dialog component
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar with search, filters, and create button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TableToolbar />
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
      />

      {/* Pagination */}
      <TablePagination />
    </div>
  );
}
