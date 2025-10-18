"use client";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { CaseStatus } from "@/lib/generated/prisma";
import { StaffOption, WarrantyCaseWithRelations } from "@/lib/types/warranty";
import {
  getIdtPcClassName,
  getStaffBadgeClassName,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils/status-colors";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, memo, useCallback, useState } from "react";
import { DatePickerCell } from "./date-picker-cell";
import { DropdownCell } from "./dropdown-cell";
import { EditableTextCell } from "./editable-text-cell";
import { ExpandableRowDetails } from "./expandable-row-details";

type WarrantyCaseRowProps = {
  case_: WarrantyCaseWithRelations;
  staffOptions: StaffOption[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onUpdate: (field: string, value: any) => Promise<void>;
  onMultiFieldUpdate: (
    updates: Partial<WarrantyCaseWithRelations>
  ) => Promise<void>;
  onAcquireFieldLock?: (caseId: number, field: string) => Promise<boolean>;
  onReleaseFieldLock?: (caseId: number, field: string) => Promise<void>;
  userId?: string;
  getFieldLockStatus: (field: string) => {
    isLocked: boolean;
    lockedBy?: string;
  };
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

function WarrantyCaseRowComponent({
  case_,
  staffOptions,
  isExpanded,
  onToggleExpanded,
  onUpdate,
  onMultiFieldUpdate,
  onAcquireFieldLock,
  onReleaseFieldLock,
  userId,
  getFieldLockStatus,
}: WarrantyCaseRowProps) {
  // Local state for editing - prevents global re-renders
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleEditStart = useCallback(
    async (field: string) => {
      // Try to acquire lock if locking is enabled, but don't block editing
      let lockAcquired = true;

      if (onAcquireFieldLock) {
        try {
          lockAcquired = await onAcquireFieldLock(case_.id, field);
        } catch (error) {
          console.error("Lock acquisition error:", error);
          // Continue with editing even if lock fails
          lockAcquired = true;
        }
      }

      // Always allow editing, regardless of lock status
      // The lock system should only show warnings, not prevent editing
      setEditingField(field);
    },
    [onAcquireFieldLock, case_.id]
  );

  const handleEditEnd = useCallback(
    async (field: string) => {
      setEditingField(null);

      // Release lock if locking is enabled
      if (onReleaseFieldLock) {
        await onReleaseFieldLock(case_.id, field);
      }
    },
    [onReleaseFieldLock, case_.id]
  );

  const createdAtLock = getFieldLockStatus("createdAt");
  const serviceNoLock = getFieldLockStatus("serviceNo");
  const customerNameLock = getFieldLockStatus("customerName");
  const customerContactLock = getFieldLockStatus("customerContact");

  return (
    <Fragment>
      <TableRow className="hover:bg-muted/50">
        <TableCell className="py-1 px-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
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
            onSave={(value) => onUpdate("createdAt", value)}
            isLocked={createdAtLock.isLocked}
            lockedBy={createdAtLock.lockedBy}
          />
        </TableCell>

        <TableCell className="py-1 px-2">
          <EditableTextCell
            value={case_.serviceNo}
            onSave={(value) => onUpdate("serviceNo", value)}
            isEditing={editingField === "serviceNo"}
            onEditStart={() => handleEditStart("serviceNo")}
            onEditEnd={() => handleEditEnd("serviceNo")}
            isLocked={serviceNoLock.isLocked}
            lockedBy={serviceNoLock.lockedBy}
          />
        </TableCell>

        <TableCell className="py-1 px-2">
          <DropdownCell
            value={case_.idtPc}
            options={IDT_PC_OPTIONS}
            onSelect={(value) => onUpdate("idtPc", value)}
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
            onSelect={(value) => onUpdate("receivedByStaffId", value)}
            getDisplayValue={(value) => {
              if (!value) return "Not assigned";
              const staff = staffOptions.find((s) => s.id === value);
              return staff?.name || "Unknown";
            }}
            getBadgeClassName={(value) => {
              if (!value) return "";
              const staff = staffOptions.find((s) => s.id === value);
              return getStaffBadgeClassName(staff?.color);
            }}
            renderValue={(value) => {
              if (!value) return null;
              const staff = staffOptions.find((s) => s.id === value);
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
            onSelect={(value) => onUpdate("servicedByStaffId", value)}
            getDisplayValue={(value) => {
              if (!value) return "Not assigned";
              const staff = staffOptions.find((s) => s.id === value);
              return staff?.name || "Unknown";
            }}
            getBadgeClassName={(value) => {
              if (!value) return "";
              const staff = staffOptions.find((s) => s.id === value);
              return getStaffBadgeClassName(staff?.color);
            }}
            renderValue={(value) => {
              if (!value) return null;
              const staff = staffOptions.find((s) => s.id === value);
              return staff?.name || null;
            }}
          />
        </TableCell>

        <TableCell className="py-1 px-2">
          <EditableTextCell
            value={case_.customerName}
            onSave={(value) => onUpdate("customerName", value)}
            isEditing={editingField === "customerName"}
            onEditStart={() => handleEditStart("customerName")}
            onEditEnd={() => handleEditEnd("customerName")}
            isLocked={customerNameLock.isLocked}
            lockedBy={customerNameLock.lockedBy}
          />
        </TableCell>

        <TableCell className="py-1 px-2">
          <EditableTextCell
            value={case_.customerContact}
            onSave={(value) => onUpdate("customerContact", value)}
            isEditing={editingField === "customerContact"}
            onEditStart={() => handleEditStart("customerContact")}
            onEditEnd={() => handleEditEnd("customerContact")}
            isLocked={customerContactLock.isLocked}
            lockedBy={customerContactLock.lockedBy}
          />
        </TableCell>

        <TableCell className="py-1 px-2">
          <DropdownCell
            value={case_.status}
            options={STATUS_OPTIONS}
            onSelect={(value) => onUpdate("status", value)}
            allowNull={false}
            getDisplayValue={(value) => getStatusLabel(value as CaseStatus)}
            getBadgeClassName={(value) => getStatusColor(value as CaseStatus)}
          />
        </TableCell>
      </TableRow>

      <TableRow
        key={`accordion-${case_.id}`}
        className={`border-0 ${isExpanded && "border-b"}`}
      >
        <TableCell colSpan={9} className="p-0">
          <ExpandableRowDetails
            case_={case_}
            onUpdate={onMultiFieldUpdate}
            onAcquireFieldLock={onAcquireFieldLock}
            onReleaseFieldLock={onReleaseFieldLock}
            userId={userId}
            isExpanded={isExpanded}
          />
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

// Memoize the component with custom comparison
export const WarrantyCaseRow = memo(
  WarrantyCaseRowComponent,
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.case_.id === nextProps.case_.id &&
      prevProps.case_.updatedAt?.getTime() ===
        nextProps.case_.updatedAt?.getTime() &&
      prevProps.case_.createdAt?.getTime() ===
        nextProps.case_.createdAt?.getTime() &&
      prevProps.case_.serviceNo === nextProps.case_.serviceNo &&
      prevProps.case_.idtPc === nextProps.case_.idtPc &&
      prevProps.case_.receivedByStaffId === nextProps.case_.receivedByStaffId &&
      prevProps.case_.servicedByStaffId === nextProps.case_.servicedByStaffId &&
      prevProps.case_.customerName === nextProps.case_.customerName &&
      prevProps.case_.customerContact === nextProps.case_.customerContact &&
      prevProps.case_.status === nextProps.case_.status &&
      prevProps.isExpanded === nextProps.isExpanded &&
      prevProps.staffOptions.length === nextProps.staffOptions.length &&
      prevProps.userId === nextProps.userId
    );
  }
);

WarrantyCaseRow.displayName = "WarrantyCaseRow";
