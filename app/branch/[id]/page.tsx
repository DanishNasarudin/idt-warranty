import { WarrantyCaseTableWrapper } from "@/components/custom/warranty/warranty-case-table-wrapper";
import { Toaster } from "@/components/ui/sonner";
import { WarrantyCaseUpdate } from "@/lib/types/warranty";
import {
  createWarrantyCase,
  getBranch,
  getStaffByBranch,
  getWarrantyCasesByBranch,
  updateWarrantyCase,
} from "./actions";
import { CreateWarrantyCaseFormData } from "@/components/custom/warranty/create-warranty-case-dialog";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const branchId = parseInt((await params).id);
  const branch = await getBranch(branchId);

  // Fetch initial data on the server
  const [cases, staff] = await Promise.all([
    getWarrantyCasesByBranch(branchId),
    getStaffByBranch(branchId),
  ]);

  // Server action wrapper for client component - update case
  async function handleUpdateCase(caseId: number, updates: WarrantyCaseUpdate) {
    "use server";
    await updateWarrantyCase(caseId, branchId, updates);
  }

  // Server action wrapper for client component - create case
  async function handleCreateCase(data: CreateWarrantyCaseFormData) {
    "use server";
    await createWarrantyCase(branchId, data);
  }

  return (
    <>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Warranty Cases
            </h1>
            <p className="text-muted-foreground">
              Branch: <strong>{branch?.name}</strong>
            </p>
          </div>
        </div>

        <WarrantyCaseTableWrapper
          initialCases={cases}
          initialStaff={staff}
          branchId={branchId}
          onUpdateCase={handleUpdateCase}
          onCreateCase={handleCreateCase}
        />
      </div>
      <Toaster />
    </>
  );
}
