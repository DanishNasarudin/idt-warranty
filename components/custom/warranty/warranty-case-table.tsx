"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CaseStatus } from "@/lib/generated/prisma";
import { useCollaborativeEditingStore } from "@/lib/stores/collaborative-editing-store";
import { useWarrantyCaseStore } from "@/lib/stores/warranty-case-store";
import { StaffOption, WarrantyCaseWithRelations } from "@/lib/types/warranty";
import {
  getIdtPcClassName,
  getStaffBadgeClassName,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils/status-colors";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useEffect } from "react";
import { StaffBadge } from "../staff-badge";
import { DatePickerCell } from "./date-picker-cell";
import { DropdownCell } from "./dropdown-cell";
import { EditableTextCell } from "./editable-text-cell";
import { ExpandableRowDetails } from "./expandable-row-details";

type WarrantyCaseTableProps = {
  initialCases: WarrantyCaseWithRelations[];
  initialStaff: StaffOption[];
  onUpdateCase: (
    caseId: number,
    updates: Partial<WarrantyCaseWithRelations>
  ) => Promise<void>;
  onUpdateField?: (caseId: number, field: string, value: any) => Promise<void>;
  onAcquireFieldLock?: (caseId: number, field: string) => Promise<boolean>;
  onReleaseFieldLock?: (caseId: number, field: string) => Promise<void>;
  userId?: string;
};

const STATUS_OPTIONS = [
  {
    label: "In Queue",
    value: CaseStatus.IN_QUEUE,
    className: getStatusColor(CaseStatus.IN_QUEUE),
  },
  {
    label: "In Progress",
    value: CaseStatus.IN_PROGRESS,
    className: getStatusColor(CaseStatus.IN_PROGRESS),
  },
  {
    label: "Waiting For",
    value: CaseStatus.WAITING_FOR,
    className: getStatusColor(CaseStatus.WAITING_FOR),
  },
  {
    label: "Completed",
    value: CaseStatus.COMPLETED,
    className: getStatusColor(CaseStatus.COMPLETED),
  },
];

const IDT_PC_OPTIONS = [
  { label: "Yes", value: true, className: getIdtPcClassName(true) },
  { label: "No", value: false, className: getIdtPcClassName(false) },
];

export function WarrantyCaseTable({
  initialCases,
  initialStaff,
  onUpdateCase,
  onUpdateField,
  onAcquireFieldLock,
  onReleaseFieldLock,
  userId = "",
}: WarrantyCaseTableProps) {
  const {
    cases,
    staffOptions,
    expandedRows,
    editingCell,
    setCases,
    setStaffOptions,
    updateCase,
    toggleRowExpansion,
    setEditingCell,
  } = useWarrantyCaseStore();

  const { isFieldLocked, getDisplayValue, fieldLocks } =
    useCollaborativeEditingStore();

  useEffect(() => {
    setCases(initialCases);
  }, [initialCases, setCases]);

  useEffect(() => {
    setStaffOptions(initialStaff);
  }, [initialStaff, setStaffOptions]);

  // Display cases with optimistic updates merged in
  const displayedCases = cases.map((case_) => {
    const optimisticData = getDisplayValue(case_.id);
    return { ...case_, ...optimisticData };
  });

  const handleUpdate = async (caseId: number, field: string, value: any) => {
    // Optimistic update - immediate UI feedback
    updateCase(caseId, { [field]: value });

    // Use debounced update if available
    if (onUpdateField) {
      await onUpdateField(caseId, field, value);
      return;
    }

    // Fallback to immediate update
    try {
      await onUpdateCase(caseId, { [field]: value });
    } catch (error) {
      console.error("Failed to update case:", error);
      // Revert optimistic update on error
      const originalCase = cases.find((c) => c.id === caseId);
      if (originalCase) {
        updateCase(caseId, {
          [field]: originalCase[field as keyof WarrantyCaseWithRelations],
        });
      }
    }
  };

  const handleEditStart = async (caseId: number, field: string) => {
    // Try to acquire lock if locking is enabled
    if (onAcquireFieldLock) {
      const acquired = await onAcquireFieldLock(caseId, field);
      if (!acquired) {
        return; // Lock acquisition failed
      }
    }

    setEditingCell({ caseId, field });
  };

  const handleEditEnd = async (caseId: number, field: string) => {
    setEditingCell(null);

    // Release lock if locking is enabled
    if (onReleaseFieldLock) {
      await onReleaseFieldLock(caseId, field);
    }
  };

  const getFieldLockStatus = (caseId: number, field: string) => {
    if (!userId) return { isLocked: false, lockedBy: undefined };

    const lock = isFieldLocked(caseId, field, userId);
    const status = {
      isLocked: lock !== null,
      lockedBy: lock?.userName,
    };

    // Debug logging
    if (lock) {
      console.log(`[Lock Status] Case ${caseId}, Field ${field}:`, status);
    }

    return status;
  };

  const handleMultiFieldUpdate = async (
    caseId: number,
    updates: Partial<WarrantyCaseWithRelations>
  ) => {
    // Optimistic update
    updateCase(caseId, updates);

    try {
      await onUpdateCase(caseId, updates);
    } catch (error) {
      console.error("Failed to update case:", error);
    }
  };

  const getStaffBadge = (staffId: number | null) => {
    if (!staffId) return null;
    const staff = staffOptions.find((s) => s.id === staffId);
    if (!staff) return null;
    return <StaffBadge name={staff.name} color={staff.color} />;
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] py-1 px-1"></TableHead>
            <TableHead className="min-w-[120px] py-1 px-2">Date</TableHead>
            <TableHead className="min-w-[150px] py-1 px-2">
              Service No
            </TableHead>
            <TableHead className="w-[100px] py-1 px-2">IDT PC?</TableHead>
            <TableHead className="min-w-[150px] py-1 px-2">
              Received By
            </TableHead>
            <TableHead className="min-w-[150px] py-1 px-2">
              Serviced By
            </TableHead>
            <TableHead className="min-w-[200px] py-1 px-2">Name</TableHead>
            <TableHead className="min-w-[150px] py-1 px-2">Contact</TableHead>
            <TableHead className="min-w-[130px] py-1 px-2">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedCases.length === 0 ? (
            <TableRow key={"empty"}>
              <TableCell
                colSpan={9}
                className="text-center py-8 text-muted-foreground"
              >
                No warranty cases found
              </TableCell>
            </TableRow>
          ) : (
            displayedCases.map((case_) => {
              const isExpanded = expandedRows.has(case_.id);
              const createdAtLock = getFieldLockStatus(case_.id, "createdAt");
              const serviceNoLock = getFieldLockStatus(case_.id, "serviceNo");
              const customerNameLock = getFieldLockStatus(
                case_.id,
                "customerName"
              );
              const customerContactLock = getFieldLockStatus(
                case_.id,
                "customerContact"
              );

              return (
                <Fragment key={case_.id}>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell className="py-1 px-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(case_.id)}
                        className="h-6 w-6 p-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>

                    <TableCell className="py-1 px-2">
                      <DatePickerCell
                        value={case_.createdAt}
                        onSave={(value) =>
                          handleUpdate(case_.id, "createdAt", value)
                        }
                        isLocked={createdAtLock.isLocked}
                        lockedBy={createdAtLock.lockedBy}
                      />
                    </TableCell>

                    <TableCell className="py-1 px-2">
                      <EditableTextCell
                        value={case_.serviceNo}
                        onSave={(value) =>
                          handleUpdate(case_.id, "serviceNo", value)
                        }
                        isEditing={
                          editingCell?.caseId === case_.id &&
                          editingCell?.field === "serviceNo"
                        }
                        onEditStart={() =>
                          handleEditStart(case_.id, "serviceNo")
                        }
                        onEditEnd={() => handleEditEnd(case_.id, "serviceNo")}
                        isLocked={serviceNoLock.isLocked}
                        lockedBy={serviceNoLock.lockedBy}
                      />
                    </TableCell>

                    <TableCell className="py-1 px-2">
                      <DropdownCell
                        value={case_.idtPc}
                        options={IDT_PC_OPTIONS}
                        onSelect={(value) =>
                          handleUpdate(case_.id, "idtPc", value)
                        }
                        getDisplayValue={(value) =>
                          value === null ? "Not set" : value ? "Yes" : "No"
                        }
                        getBadgeClassName={(value) =>
                          getIdtPcClassName(value as boolean | null)
                        }
                      />
                    </TableCell>

                    <TableCell className="py-1 px-2">
                      <DropdownCell
                        value={case_.receivedByStaffId}
                        options={staffOptions.map((s) => ({
                          label: s.name,
                          value: s.id,
                          className: getStaffBadgeClassName(s.color),
                        }))}
                        onSelect={(value) =>
                          handleUpdate(case_.id, "receivedByStaffId", value)
                        }
                        getDisplayValue={(value) => {
                          if (!value) return "Not assigned";
                          const staff = staffOptions.find(
                            (s) => s.id === value
                          );
                          return staff?.name || "Unknown";
                        }}
                        getBadgeClassName={(value) => {
                          if (!value) return "";
                          const staff = staffOptions.find(
                            (s) => s.id === value
                          );
                          return getStaffBadgeClassName(staff?.color);
                        }}
                        renderValue={(value) => {
                          if (!value) return null;
                          const staff = staffOptions.find(
                            (s) => s.id === value
                          );
                          return staff?.name || null;
                        }}
                      />
                    </TableCell>

                    <TableCell className="py-1 px-2">
                      <DropdownCell
                        value={case_.servicedByStaffId}
                        options={staffOptions.map((s) => ({
                          label: s.name,
                          value: s.id,
                          className: getStaffBadgeClassName(s.color),
                        }))}
                        onSelect={(value) =>
                          handleUpdate(case_.id, "servicedByStaffId", value)
                        }
                        getDisplayValue={(value) => {
                          if (!value) return "Not assigned";
                          const staff = staffOptions.find(
                            (s) => s.id === value
                          );
                          return staff?.name || "Unknown";
                        }}
                        getBadgeClassName={(value) => {
                          if (!value) return "";
                          const staff = staffOptions.find(
                            (s) => s.id === value
                          );
                          return getStaffBadgeClassName(staff?.color);
                        }}
                        renderValue={(value) => {
                          if (!value) return null;
                          const staff = staffOptions.find(
                            (s) => s.id === value
                          );
                          return staff?.name || null;
                        }}
                      />
                    </TableCell>

                    <TableCell className="py-1 px-2">
                      <EditableTextCell
                        value={case_.customerName}
                        onSave={(value) =>
                          handleUpdate(case_.id, "customerName", value)
                        }
                        isEditing={
                          editingCell?.caseId === case_.id &&
                          editingCell?.field === "customerName"
                        }
                        onEditStart={() =>
                          handleEditStart(case_.id, "customerName")
                        }
                        onEditEnd={() =>
                          handleEditEnd(case_.id, "customerName")
                        }
                        isLocked={customerNameLock.isLocked}
                        lockedBy={customerNameLock.lockedBy}
                      />
                    </TableCell>

                    <TableCell className="py-1 px-2">
                      <EditableTextCell
                        value={case_.customerContact}
                        onSave={(value) =>
                          handleUpdate(case_.id, "customerContact", value)
                        }
                        isEditing={
                          editingCell?.caseId === case_.id &&
                          editingCell?.field === "customerContact"
                        }
                        onEditStart={() =>
                          handleEditStart(case_.id, "customerContact")
                        }
                        onEditEnd={() =>
                          handleEditEnd(case_.id, "customerContact")
                        }
                        isLocked={customerContactLock.isLocked}
                        lockedBy={customerContactLock.lockedBy}
                      />
                    </TableCell>

                    <TableCell className="py-1 px-2">
                      <DropdownCell
                        value={case_.status}
                        options={STATUS_OPTIONS}
                        onSelect={(value) =>
                          handleUpdate(case_.id, "status", value)
                        }
                        allowNull={false}
                        getDisplayValue={(value) =>
                          getStatusLabel(value as CaseStatus)
                        }
                        getBadgeClassName={(value) =>
                          getStatusColor(value as CaseStatus)
                        }
                      />
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow key={`accordion-${case_.id}`}>
                      <TableCell colSpan={9} className="p-0">
                        <ExpandableRowDetails
                          case_={case_}
                          onUpdate={(updates) =>
                            handleMultiFieldUpdate(case_.id, updates)
                          }
                          onAcquireFieldLock={onAcquireFieldLock}
                          onReleaseFieldLock={onReleaseFieldLock}
                          userId={userId}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
