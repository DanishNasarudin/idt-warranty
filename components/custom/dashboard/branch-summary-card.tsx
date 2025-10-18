"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2 } from "lucide-react";

type BranchCaseSummary = {
  id: number;
  code: string;
  name: string;
  totalCases: number;
};

type BranchSummaryCardProps = {
  caseSummary: BranchCaseSummary[];
  totalCases: number;
};

export function BranchSummaryCard({
  caseSummary,
  totalCases,
}: BranchSummaryCardProps) {
  const maxCases = Math.max(...caseSummary.map((b) => b.totalCases));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Branch Case Summary
        </CardTitle>
        <CardDescription>
          Total cases across all branches:{" "}
          <span className="font-semibold">{totalCases}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {caseSummary.length > 0 ? (
            caseSummary.map((branch) => {
              const percentage =
                maxCases > 0 ? (branch.totalCases / maxCases) * 100 : 0;

              return (
                <div key={branch.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{branch.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({branch.code})
                      </span>
                    </div>
                    <span className="text-lg font-bold">
                      {branch.totalCases}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No branch data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
