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
import { useWarrantyCaseStore } from "@/lib/stores/warranty-case-store";
import { StaffOption, WarrantyCaseWithRelations } from "@/lib/types/warranty";
import {
  getIdtPcClassName,
  getStaffBadgeClassName,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils/status-colors";
import { format } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { StaffBadge } from "../staff-badge";
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
}: WarrantyCaseTableProps) {
  const {
    staffOptions,
    expandedRows,
    editingCell,
    setCases,
    setStaffOptions,
    updateCase,
    toggleRowExpansion,
    setEditingCell,
    getPaginatedCases,
  } = useWarrantyCaseStore();

  useEffect(() => {
    setCases(initialCases);
  }, [initialCases, setCases]);

  useEffect(() => {
    setStaffOptions(initialStaff);
  }, [initialStaff, setStaffOptions]);

  // Use paginated cases instead of all cases
  const displayedCases = getPaginatedCases();

  const handleUpdate = async (caseId: number, field: string, value: any) => {
    // Optimistic update
    updateCase(caseId, { [field]: value });

    try {
      // Call server action for auto-save
      await onUpdateCase(caseId, { [field]: value });
    } catch (error) {
      console.error("Failed to update case:", error);
      // TODO: Revert optimistic update or show error toast
    }
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="min-w-[120px]">Date</TableHead>
            <TableHead className="min-w-[150px]">Service No</TableHead>
            <TableHead className="w-[100px]">IDT PC?</TableHead>
            <TableHead className="min-w-[150px]">Received By</TableHead>
            <TableHead className="min-w-[150px]">Serviced By</TableHead>
            <TableHead className="min-w-[200px]">Name</TableHead>
            <TableHead className="min-w-[150px]">Contact</TableHead>
            <TableHead className="min-w-[130px]">Status</TableHead>
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

              return (
                <>
                  <TableRow key={case_.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(case_.id)}
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>

                    <TableCell>
                      {case_.createdAt
                        ? format(new Date(case_.createdAt), "dd/MM/yyyy")
                        : "-"}
                    </TableCell>

                    <TableCell>
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
                          setEditingCell({
                            caseId: case_.id,
                            field: "serviceNo",
                          })
                        }
                        onEditEnd={() => setEditingCell(null)}
                      />
                    </TableCell>

                    <TableCell>
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

                    <TableCell>
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

                    <TableCell>
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

                    <TableCell>
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
                          setEditingCell({
                            caseId: case_.id,
                            field: "customerName",
                          })
                        }
                        onEditEnd={() => setEditingCell(null)}
                      />
                    </TableCell>

                    <TableCell>
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
                          setEditingCell({
                            caseId: case_.id,
                            field: "customerContact",
                          })
                        }
                        onEditEnd={() => setEditingCell(null)}
                      />
                    </TableCell>

                    <TableCell>
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
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
