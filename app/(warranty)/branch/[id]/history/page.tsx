import HistoryList from "@/components/custom/warranty/history-list";
import { Button } from "@/components/ui/button";
import { parseIntSafe } from "@/lib/utils/search-params";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBranch, getWarrantyHistoryByBranch } from "../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function HistoryPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const branchId = parseInt(id);

  // Safely parse page with default value of 1
  const page = parseIntSafe(pageParam, 1, 1);

  if (isNaN(branchId)) {
    notFound();
  }

  // Fetch branch details
  const branch = await getBranch(branchId);

  if (!branch) {
    notFound();
  }

  // Fetch warranty history
  const historyData = await getWarrantyHistoryByBranch(branchId, page, 50);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href={`/branch/${branchId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                History - {branch.name}
              </h1>
              <p className="text-muted-foreground">
                View all warranty case actions and changes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <HistoryList
        records={historyData.records}
        pagination={historyData.pagination}
        branchId={branchId}
      />
    </div>
  );
}
