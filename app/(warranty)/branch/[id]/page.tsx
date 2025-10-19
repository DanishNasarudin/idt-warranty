import { CreateWarrantyCaseFormData } from "@/components/custom/warranty/create-warranty-case-dialog";
import { WarrantyCaseTableWrapper } from "@/components/custom/warranty/warranty-case-table-wrapper";
import { ActionButton } from "@/components/design-system";
import { WarrantyCaseFilters } from "@/lib/types/search-params";
import { WarrantyCaseUpdate } from "@/lib/types/warranty";
import { parseWarrantyCaseFilters } from "@/lib/utils/search-params";
import { History } from "lucide-react";
import Link from "next/link";
import {
  createWarrantyCase,
  getBranch,
  getStaffByBranch,
  getWarrantyCasesByBranch,
  updateWarrantyCase,
} from "./actions";

type SearchParams = {
  search?: string;
  searchField?: string;
  sort?: string;
  page?: string;
  limit?: string;
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const branchId = parseInt((await params).id);
  const resolvedSearchParams = await searchParams;

  // Parse search params with defaults using utility function
  const filters: WarrantyCaseFilters =
    parseWarrantyCaseFilters(resolvedSearchParams);

  // Fetch all data in parallel to ensure consistent Prisma client initialization
  const [branch, casesData, staff] = await Promise.all([
    getBranch(branchId),
    getWarrantyCasesByBranch(branchId, filters),
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
    // Convert Date to ISO string for server action
    const serverData = {
      ...data,
      purchaseDate: data.purchaseDate
        ? data.purchaseDate.toISOString()
        : undefined,
    };
    await createWarrantyCase(branchId, serverData);
  }

  // Handle case where branch is not found
  if (!branch) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Branch Not Found
            </h1>
            <p className="text-muted-foreground mt-2">
              The branch with ID {branchId} could not be found.
            </p>
          </div>
        </div>
      </div>
    );
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
              Branch: <strong>{branch.name}</strong>
            </p>
          </div>
          <Link href={`/branch/${branchId}/history`}>
            <ActionButton
              icon={History}
              label="View History"
              action={"custom"}
              variant="outline"
            />
          </Link>
        </div>

        <WarrantyCaseTableWrapper
          initialCases={casesData.cases}
          totalCount={casesData.totalCount}
          initialStaff={staff}
          branchId={branchId}
          filters={filters}
          onUpdateCase={handleUpdateCase}
          onCreateCase={handleCreateCase}
        />
      </div>
    </>
  );
}
