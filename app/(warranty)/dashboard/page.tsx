import { BranchStaffPerformanceCard } from "@/components/custom/dashboard/branch-staff-performance-card";
import { BranchStatusCard } from "@/components/custom/dashboard/branch-status-card";
import { BranchSummaryCard } from "@/components/custom/dashboard/branch-summary-card";
import { BranchTransferCard } from "@/components/custom/dashboard/branch-transfer-card";
import { DashboardDateFilter } from "@/components/custom/dashboard/dashboard-date-filter";
import { StaffMetricsCard } from "@/components/custom/dashboard/staff-metrics-card";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangeFilter, DateRangePreset } from "@/lib/types/search-params";
import { getDashboardStats } from "./dashboard-actions";

type PageProps = {
  searchParams: Promise<{
    preset?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  // Build date range filter from search params
  const dateRangeFilter: DateRangeFilter = {
    preset: (params.preset as DateRangePreset) || "all",
    startDate: params.startDate,
    endDate: params.endDate,
  };

  const stats = await getDashboardStats(dateRangeFilter);

  return (
    <div className="container mx-auto py-6 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of warranty performance metrics
          </p>
        </div>
        <DashboardDateFilter />
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totals.cases}</div>
            <p className="text-xs text-muted-foreground">Total Cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {stats.totals.staffServices}
            </div>
            <p className="text-xs text-muted-foreground">Services Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {stats.branchStatusCounts.length}
            </div>
            <p className="text-xs text-muted-foreground">Active Branches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {stats.staffMetrics.length}
            </div>
            <p className="text-xs text-muted-foreground">Staff Members</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Staff Performance */}
        <StaffMetricsCard
          staffMetrics={stats.staffMetrics}
          totalServices={stats.totals.staffServices}
        />

        {/* Branch Summary */}
        <BranchSummaryCard
          caseSummary={stats.caseSummary}
          totalCases={stats.totals.cases}
        />
      </div>

      {/* Branch Staff Performance */}
      <BranchStaffPerformanceCard
        branchPerformance={stats.staffPerformanceByBranch}
      />

      {/* Branch Status & Transfer Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BranchStatusCard branchStatusCounts={stats.branchStatusCounts} />
        <BranchTransferCard transferStats={stats.transferStats} />
      </div>
    </div>
  );
}
