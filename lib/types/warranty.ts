import { CaseStatus, TransferStatus } from "@/lib/generated/prisma";

export type WarrantyCaseWithRelations = {
  id: number;
  serviceNo: string;
  branchId: number;
  scopeId: number;
  originBranchId: number | null;
  status: CaseStatus;
  customerName: string | null;
  customerContact: string | null;
  customerEmail: string | null;
  address: string | null;
  purchaseDate: Date | null;
  invoice: string | null;
  receivedItems: string | null;
  pin: string | null;
  issues: string | null;
  solutions: string | null;
  statusDesc: string | null;
  remarks: string | null;
  cost: number;
  locker: number | null;
  idtPc: boolean | null;
  receivedByStaffId: number | null;
  servicedByStaffId: number | null;
  createdAt: Date;
  updatedAt: Date;
  receivedBy: {
    id: number;
    name: string;
    color: string | null;
  } | null;
  servicedBy: {
    id: number;
    name: string;
    color: string | null;
  } | null;
  branch: {
    id: number;
    code: string;
    name: string;
  };
  scope: {
    id: number;
    code: string;
  };
  originBranch?: {
    id: number;
    code: string;
    name: string;
  } | null;
};

export type WarrantyCaseUpdate = Partial<
  Omit<
    WarrantyCaseWithRelations,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "receivedBy"
    | "servicedBy"
    | "branch"
    | "scope"
  >
>;

export type StaffOption = {
  id: number;
  name: string;
  color: string | null;
};

export type CaseTransferWithRelations = {
  id: number;
  caseId: number;
  fromBranchId: number;
  toBranchId: number;
  transferredByStaffId: number | null;
  status: TransferStatus;
  reason: string | null;
  notes: string | null;
  transferredAt: Date;
  acceptedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  fromBranch: {
    id: number;
    code: string;
    name: string;
  };
  toBranch: {
    id: number;
    code: string;
    name: string;
  };
  transferredBy: {
    id: number;
    name: string;
    color: string | null;
  } | null;
  case?: {
    id: number;
    serviceNo: string;
    customerName: string | null;
    status: CaseStatus;
  };
};

export type BranchTransferStats = {
  branchId: number;
  totalCases: number;
  sent: {
    total: number;
    breakdown: {
      branch:
        | {
            id: number;
            code: string;
            name: string;
          }
        | undefined;
      count: number;
    }[];
  };
  received: {
    total: number;
    breakdown: {
      branch:
        | {
            id: number;
            code: string;
            name: string;
          }
        | undefined;
      count: number;
    }[];
  };
};

export type BranchOption = {
  id: number;
  code: string;
  name: string;
};
