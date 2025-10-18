"use client";

import { StaffBadge } from "@/components/custom/staff-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Award, TrendingUp } from "lucide-react";

type StaffMetric = {
  id: number;
  name: string;
  color: string | null;
  servicedCount: number;
};

type BranchPerformance = {
  branch: {
    id: number;
    code: string;
    name: string;
  };
  topPerformer: StaffMetric | null;
  totalServices: number;
  staffCount: number;
  allStaff: StaffMetric[];
};

type BranchStaffPerformanceCardProps = {
  branchPerformance: BranchPerformance[];
};

export function BranchStaffPerformanceCard({
  branchPerformance,
}: BranchStaffPerformanceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Staff Performance by Branch
        </CardTitle>
        <CardDescription>
          Top performers and service counts for each branch
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {branchPerformance.length > 0 ? (
            branchPerformance.map((performance) => (
              <div
                key={performance.branch.id}
                className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                {/* Branch Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-semibold">
                      {performance.branch.code}
                    </Badge>
                    <span className="text-sm font-medium">
                      {performance.branch.name}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {performance.staffCount} staff • {performance.totalServices}{" "}
                    services
                  </div>
                </div>

                {/* Top Performer */}
                {performance.topPerformer &&
                performance.topPerformer.servicedCount > 0 ? (
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <StaffBadge
                        name={performance.topPerformer.name}
                        color={performance.topPerformer.color}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">
                        {performance.topPerformer.servicedCount}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        cases
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-muted-foreground text-xs">
                    No services completed yet
                  </div>
                )}

                {/* Other Staff (if needed, can be expanded) */}
                {performance.allStaff.length > 1 && (
                  <div className="mt-2 pt-2 border-t">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                        View all {performance.allStaff.length} staff members
                      </summary>
                      <div className="mt-2 space-y-1">
                        {performance.allStaff.slice(1).map((staff) => (
                          <div
                            key={staff.id}
                            className="flex items-center justify-between p-1.5 rounded hover:bg-muted/30"
                          >
                            <StaffBadge
                              name={staff.name}
                              color={staff.color}
                              className="text-xs"
                            />
                            <span className="text-xs text-muted-foreground">
                              {staff.servicedCount} cases
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No branch performance data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
