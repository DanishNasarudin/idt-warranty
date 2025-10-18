import type {
  Branch,
  CaseStatus,
  CaseTransfer,
  Staff,
  WarrantyCase,
  WarrantyHistory,
} from "@/lib/generated/prisma";
import { Decimal } from "@/lib/generated/prisma/runtime/library";

/**
 * Factory functions to create test data
 */

export const createMockBranch = (overrides?: Partial<Branch>): Branch => ({
  id: 1,
  code: "SA",
  name: "Shah Alam",
  address: null,
  officePhone: null,
  whatsappPhone: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  ...overrides,
});

export const createMockStaff = (overrides?: Partial<Staff>): Staff => ({
  id: 1,
  name: "John Doe",
  color: "blue",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  ...overrides,
});

export const createMockWarrantyCase = (
  overrides?: Partial<WarrantyCase>
): WarrantyCase => ({
  id: 1,
  serviceNo: "WSA2510001",
  branchId: 1,
  scopeId: 1,
  originBranchId: null,
  purchaseDate: new Date("2025-10-01"),
  customerName: "Test Customer",
  customerContact: "0123456789",
  customerEmail: null,
  address: null,
  invoice: null,
  receivedItems: null,
  idtPc: null,
  pin: null,
  issues: null,
  solutions: null,
  receivedByStaffId: null,
  servicedByStaffId: null,
  status: "IN_QUEUE" as CaseStatus,
  statusDesc: null,
  remarks: null,
  cost: new Decimal(0),
  createdAt: new Date("2025-10-19"),
  updatedAt: new Date("2025-10-19"),
  ...overrides,
});

export const createMockCaseTransfer = (
  overrides?: Partial<CaseTransfer>
): CaseTransfer => ({
  id: 1,
  caseId: 1,
  fromBranchId: 1,
  toBranchId: 2,
  transferredByStaffId: null,
  status: "PENDING",
  reason: null,
  notes: null,
  transferredAt: new Date("2025-10-19"),
  acceptedAt: null,
  completedAt: null,
  createdAt: new Date("2025-10-19"),
  updatedAt: new Date("2025-10-19"),
  ...overrides,
});

export const createMockWarrantyHistory = (
  overrides?: Partial<WarrantyHistory>
): WarrantyHistory => ({
  id: 1,
  caseId: 1,
  changeType: "INSERT",
  changeTs: new Date("2025-10-19"),
  changedByStaffId: null,
  snapshotJson: null,
  ...overrides,
});

/**
 * Create multiple mock items
 */
export const createMockWarrantyCases = (
  count: number,
  overrides?: Partial<WarrantyCase>
): WarrantyCase[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockWarrantyCase({
      id: i + 1,
      serviceNo: `WSA2510${String(i + 1).padStart(3, "0")}`,
      ...overrides,
    })
  );
};

export const createMockBranches = (
  count: number,
  overrides?: Partial<Branch>
): Branch[] => {
  const codes = ["SA", "AP", "KL", "JB", "PG", "MLK"];
  return Array.from({ length: count }, (_, i) =>
    createMockBranch({
      id: i + 1,
      code: codes[i] || `B${i + 1}`,
      name: `Branch ${i + 1}`,
      ...overrides,
    })
  );
};

export const createMockStaffMembers = (
  count: number,
  overrides?: Partial<Staff>
): Staff[] => {
  const colors = ["blue", "green", "red", "purple", "orange", "pink"];
  return Array.from({ length: count }, (_, i) =>
    createMockStaff({
      id: i + 1,
      name: `Staff ${i + 1}`,
      color: colors[i % colors.length],
      ...overrides,
    })
  );
};
