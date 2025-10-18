"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig } from "@/components/ui/chart";
import { CaseStatus } from "@/lib/generated/prisma";
import { Building2 } from "lucide-react";

type BranchStatusCount = {
  branch: {
    id: number;
    code: string;
    name: string;
  };
  statusCounts: Record<CaseStatus, number>;
  total: number;
};

type BranchStatusCardProps = {
  branchStatusCounts: BranchStatusCount[];
};

const statusConfig: Record<
  CaseStatus,
  { label: string; color: string; chartColor: string }
> = {
  IN_QUEUE: {
    label: "In Queue",
    color: "bg-blue-500",
    chartColor: "hsl(217, 91%, 60%)",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-yellow-500",
    chartColor: "hsl(45, 93%, 47%)",
  },
  WAITING_FOR: {
    label: "Waiting For",
    color: "bg-orange-500",
    chartColor: "hsl(25, 95%, 53%)",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-500",
    chartColor: "hsl(142, 71%, 45%)",
  },
};

const chartConfig = {
  IN_QUEUE: {
    label: "In Queue",
    color: "hsl(217, 91%, 60%)",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "hsl(45, 93%, 47%)",
  },
  WAITING_FOR: {
    label: "Waiting For",
    color: "hsl(25, 95%, 53%)",
  },
  COMPLETED: {
    label: "Completed",
    color: "hsl(142, 71%, 45%)",
  },
} satisfies ChartConfig;

export function BranchStatusCard({
  branchStatusCounts,
}: BranchStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Branch Status Overview
        </CardTitle>
        <CardDescription>
          Case status distribution across all branches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {branchStatusCounts.map((branchStat) => {
            // Prepare data for horizontal stacked bar chart
            const chartData = Object.entries(branchStat.statusCounts)
              .map(([status, count]) => ({
                status: status as CaseStatus,
                count,
                fill: statusConfig[status as CaseStatus].chartColor,
                percentage:
                  branchStat.total > 0
                    ? ((count / branchStat.total) * 100).toFixed(0)
                    : "0",
              }))
              .filter((item) => item.count > 0); // Only show statuses with counts

            // Calculate active cases (IN_QUEUE + IN_PROGRESS + WAITING_FOR)
            const activeCases =
              branchStat.statusCounts.IN_QUEUE +
              branchStat.statusCounts.IN_PROGRESS +
              branchStat.statusCounts.WAITING_FOR;
            const activePercentage =
              branchStat.total > 0
                ? ((activeCases / branchStat.total) * 100).toFixed(1)
                : "0";

            return (
              <div
                key={branchStat.branch.id}
                className="p-4 rounded-lg border bg-card space-y-4"
              >
                {/* Branch Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{branchStat.branch.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {branchStat.branch.code} • {activeCases} active (
                      {activePercentage}%)
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3">
                    {branchStat.total}
                  </Badge>
                </div>

                {/* Visual Ratio Bar */}
                <div className="space-y-2">
                  <div className="flex h-8 w-full overflow-hidden rounded-md border">
                    {Object.entries(branchStat.statusCounts).map(
                      ([status, count]) => {
                        const percentage =
                          branchStat.total > 0
                            ? (count / branchStat.total) * 100
                            : 0;
                        if (percentage === 0) return null;

                        const config = statusConfig[status as CaseStatus];
                        return (
                          <div
                            key={status}
                            className={`${config.color} flex items-center justify-center text-xs font-medium text-white transition-all hover:opacity-80`}
                            style={{ width: `${percentage}%` }}
                            title={`${
                              config.label
                            }: ${count} (${percentage.toFixed(1)}%)`}
                          >
                            {percentage > 8 && (
                              <span className="px-1">{count}</span>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(branchStat.statusCounts).map(
                      ([status, count]) => {
                        const config = statusConfig[status as CaseStatus];
                        const percentage =
                          branchStat.total > 0
                            ? ((count / branchStat.total) * 100).toFixed(1)
                            : "0";
                        return (
                          <div key={status} className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-sm ${config.color}`}
                            />
                            <span className="text-muted-foreground">
                              {config.label}:
                            </span>
                            <span className="font-semibold">
                              {count} ({percentage}%)
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
