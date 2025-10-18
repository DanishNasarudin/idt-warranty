import { BranchStaffPerformanceCard } from "@/components/custom/dashboard/branch-staff-performance-card";
import { BranchStatusCard } from "@/components/custom/dashboard/branch-status-card";
import { BranchSummaryCard } from "@/components/custom/dashboard/branch-summary-card";
import { BranchTransferCard } from "@/components/custom/dashboard/branch-transfer-card";
import { DashboardDateFilter } from "@/components/custom/dashboard/dashboard-date-filter";
import { StaffMetricsCard } from "@/components/custom/dashboard/staff-metrics-card";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangeFilter } from "@/lib/types/search-params";
import { parseDateRangePreset } from "@/lib/utils/search-params";
import { getDashboardStats } from "./actions";

type PageProps = {
  searchParams: Promise<{
    preset?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  // Build date range filter from search params with safe defaults
  const dateRangeFilter: DateRangeFilter = {
    preset: parseDateRangePreset(params.preset),
    startDate: params.startDate,
    endDate: params.endDate,
  };

  const stats = await getDashboardStats(dateRangeFilter);

  // Check if there's any data
  const hasData = stats.totals.cases > 0 || stats.staffMetrics.length > 0;

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

      {/* Empty State Alert */}
      {!hasData && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-12 space-y-3">
              <div className="text-muted-foreground">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">No Data Available</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                There is no warranty data to display. This could be because:
                <br />
                • No warranty cases have been created yet
                <br />
                • The database connection could not be established
                <br />• The selected date range has no data
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
