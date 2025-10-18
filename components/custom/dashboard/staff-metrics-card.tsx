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
import { Award, Users } from "lucide-react";

type StaffMetric = {
  id: number;
  name: string;
  color: string | null;
  servicedCount: number;
  branches: {
    id: number;
    code: string;
    name: string;
  }[];
};

type StaffMetricsCardProps = {
  staffMetrics: StaffMetric[];
  totalServices: number;
};

export function StaffMetricsCard({
  staffMetrics,
  totalServices,
}: StaffMetricsCardProps) {
  const topPerformers = staffMetrics.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Staff Performance
        </CardTitle>
        <CardDescription>
          Total services completed:{" "}
          <span className="font-semibold">{totalServices}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topPerformers.length > 0 ? (
            topPerformers.map((staff, index) => (
              <div
                key={staff.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  {index === 0 && <Award className="h-4 w-4 text-yellow-500" />}
                  <StaffBadge
                    name={staff.name}
                    color={staff.color}
                    className="text-sm"
                  />
                  <div className="flex flex-wrap gap-1">
                    {staff.branches.map((branch) => (
                      <Badge
                        key={branch.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {branch.code}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {staff.servicedCount}
                  </span>
                  <span className="text-sm text-muted-foreground">cases</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No service records yet
            </div>
          )}

          {staffMetrics.length > 5 && (
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                +{staffMetrics.length - 5} more staff members
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
