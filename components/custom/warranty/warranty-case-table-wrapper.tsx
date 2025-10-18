"use client";

import {
  StaffOption,
  WarrantyCaseUpdate,
  WarrantyCaseWithRelations,
} from "@/lib/types/warranty";
import { toast } from "sonner";
import { WarrantyCaseTable } from "./warranty-case-table";

type WarrantyCaseTableWrapperProps = {
  initialCases: WarrantyCaseWithRelations[];
  initialStaff: StaffOption[];
  onUpdateCase: (caseId: number, updates: WarrantyCaseUpdate) => Promise<void>;
};

export function WarrantyCaseTableWrapper({
  initialCases,
  initialStaff,
  onUpdateCase,
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

  return (
    <WarrantyCaseTable
      initialCases={initialCases}
      initialStaff={initialStaff}
      onUpdateCase={handleUpdateWithToast}
    />
  );
}
