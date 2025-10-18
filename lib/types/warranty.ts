import { CaseStatus } from "@/lib/generated/prisma";

export type WarrantyCaseWithRelations = {
  id: number;
  serviceNo: string;
  branchId: number;
  scopeId: number;
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
