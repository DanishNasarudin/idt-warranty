import { CreateWarrantyCaseFormData } from "@/components/custom/warranty/create-warranty-case-dialog";
import { WarrantyCaseTableWrapper } from "@/components/custom/warranty/warranty-case-table-wrapper";
import { Button } from "@/components/ui/button";
import { WarrantyCaseFilters } from "@/lib/types/search-params";
import { WarrantyCaseUpdate } from "@/lib/types/warranty";
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
  sortBy?: string;
  sortDirection?: string;
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

  const branch = await getBranch(branchId);

  // Parse search params with defaults
  const filters: WarrantyCaseFilters = {
    search: resolvedSearchParams.search || "",
    searchField: (resolvedSearchParams.searchField ||
      "all") as WarrantyCaseFilters["searchField"],
    sortBy: (resolvedSearchParams.sortBy ||
      "createdAt") as WarrantyCaseFilters["sortBy"],
    sortDirection: (resolvedSearchParams.sortDirection ||
      "desc") as WarrantyCaseFilters["sortDirection"],
    page: parseInt(resolvedSearchParams.page || "1"),
    limit: parseInt(resolvedSearchParams.limit || "20"),
  };

  // Fetch initial data on the server with filters
  const [cases, staff] = await Promise.all([
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
          <Link href={`/branch/${branchId}/history`}>
            <Button variant="outline">
              <History className="h-4 w-4 mr-2" />
              View History
            </Button>
          </Link>
        </div>

        <WarrantyCaseTableWrapper
          initialCases={cases}
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
