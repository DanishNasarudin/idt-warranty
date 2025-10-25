"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollaborativeEditingStore } from "@/lib/stores/collaborative-editing-store";
import { useWarrantyCaseStore } from "@/lib/stores/warranty-case-store";
import { StaffOption, WarrantyCaseWithRelations } from "@/lib/types/warranty";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { WarrantyCaseRow } from "./warranty-case-row";

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

export function WarrantyCaseTable({
  initialCases,
  initialStaff,
  onUpdateCase,
  onUpdateField,
  onAcquireFieldLock,
  onReleaseFieldLock,
  userId = "",
}: WarrantyCaseTableProps) {
  // Selective subscriptions to prevent unnecessary re-renders
  const cases = useWarrantyCaseStore((state) => state.cases);
  const staffOptions = useWarrantyCaseStore((state) => state.staffOptions);
  const expandedRows = useWarrantyCaseStore((state) => state.expandedRows);
  const setCases = useWarrantyCaseStore((state) => state.setCases);
  const setStaffOptions = useWarrantyCaseStore(
    (state) => state.setStaffOptions
  );
  const updateCase = useWarrantyCaseStore((state) => state.updateCase);
  const toggleRowExpansion = useWarrantyCaseStore(
    (state) => state.toggleRowExpansion
  );

  // Only subscribe to optimisticUpdates, not the entire store
  const optimisticUpdates = useCollaborativeEditingStore(
    (state) => state.optimisticUpdates
  );
  const isFieldLocked = useCollaborativeEditingStore(
    (state) => state.isFieldLocked
  );
  const fieldLocks = useCollaborativeEditingStore((state) => state.fieldLocks);

  // Use refs to track previous values to prevent unnecessary updates
  const prevCasesRef = useRef<WarrantyCaseWithRelations[]>([]);
  const prevStaffRef = useRef<StaffOption[]>([]);

  // Only update cases if they actually changed (deep comparison by ID and updatedAt)
  useEffect(() => {
    const hasChanged =
      initialCases.length !== prevCasesRef.current.length ||
      initialCases.some((newCase, idx) => {
        const oldCase = prevCasesRef.current[idx];
        return (
          !oldCase ||
          newCase.id !== oldCase.id ||
          newCase.updatedAt?.getTime() !== oldCase.updatedAt?.getTime()
        );
      });

    if (hasChanged) {
      setCases(initialCases);
      prevCasesRef.current = initialCases;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCases]);

  // Only update staff if they actually changed
  useEffect(() => {
    const hasChanged =
      initialStaff.length !== prevStaffRef.current.length ||
      initialStaff.some((staff, idx) => {
        const oldStaff = prevStaffRef.current[idx];
        return !oldStaff || staff.id !== oldStaff.id;
      });

    if (hasChanged) {
      setStaffOptions(initialStaff);
      prevStaffRef.current = initialStaff;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStaff]);

  // Memoize displayedCases to prevent recalculation on every render
  const displayedCases = useMemo(() => {
    return cases.map((case_) => {
      const optimisticData = optimisticUpdates.get(case_.id) || {};
      return { ...case_, ...optimisticData };
    });
  }, [cases, optimisticUpdates]);

  const handleUpdate = useCallback(
    async (caseId: number, field: string, value: any) => {
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
    },
    [updateCase, onUpdateField, onUpdateCase, cases]
  );

  const getFieldLockStatus = useCallback(
    (caseId: number, field: string) => {
      if (!userId) return { isLocked: false, lockedBy: undefined };

      const lock = isFieldLocked(caseId, field, userId);
      const status = {
        isLocked: lock !== null,
        lockedBy: lock?.userName,
      };

      return status;
    },
    [userId, isFieldLocked]
  );

  const handleMultiFieldUpdate = useCallback(
    async (caseId: number, updates: Partial<WarrantyCaseWithRelations>) => {
      // Optimistic update
      updateCase(caseId, updates);

      try {
        await onUpdateCase(caseId, updates);
      } catch (error) {
        console.error("Failed to update case:", error);
      }
    },
    [updateCase, onUpdateCase]
  );

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
              // Compute current lock statuses for visible fields and
              // pass them down as a prop so rows re-render when locks change.
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
                <WarrantyCaseRow
                  key={case_.id}
                  case_={case_}
                  staffOptions={staffOptions}
                  isExpanded={expandedRows.has(case_.id)}
                  onToggleExpanded={() => toggleRowExpansion(case_.id)}
                  onUpdate={(field, value) =>
                    handleUpdate(case_.id, field, value)
                  }
                  onMultiFieldUpdate={(updates) =>
                    handleMultiFieldUpdate(case_.id, updates)
                  }
                  onAcquireFieldLock={onAcquireFieldLock}
                  onReleaseFieldLock={onReleaseFieldLock}
                  userId={userId}
                  fieldLockStatuses={{
                    createdAt: createdAtLock,
                    serviceNo: serviceNoLock,
                    customerName: customerNameLock,
                    customerContact: customerContactLock,
                  }}
                />
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
