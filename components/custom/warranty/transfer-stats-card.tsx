"use client";

import { getBranchTransferStats } from "@/app/branch/[id]/transfer-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BranchTransferStats } from "@/lib/types/warranty";
import { ArrowDownLeft, ArrowUpRight, Loader2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

type TransferStatsCardProps = {
  branchId: number;
  branchName: string;
};

export function TransferStatsCard({
  branchId,
  branchName,
}: TransferStatsCardProps) {
  const [stats, setStats] = useState<BranchTransferStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [branchId]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await getBranchTransferStats(branchId);
      // Type assertion since we're passing branchId
      setStats(data as BranchTransferStats);
    } catch (error) {
      console.error("Failed to load transfer stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Transfer Statistics
          </CardTitle>
          <CardDescription>
            Loading statistics for {branchName}...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const hasTransfers = stats.sent.total > 0 || stats.received.total > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Transfer Statistics
        </CardTitle>
        <CardDescription>
          Case transfer overview for {branchName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Cases</p>
            <p className="text-2xl font-bold">{stats.totalCases}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              Sent Out
            </p>
            <p className="text-2xl font-bold text-orange-600">
              {stats.sent.total}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <ArrowDownLeft className="h-3 w-3" />
              Received
            </p>
            <p className="text-2xl font-bold text-green-600">
              {stats.received.total}
            </p>
          </div>
        </div>

        {hasTransfers && (
          <>
            {/* Sent To Breakdown */}
            {stats.sent.total > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-orange-600" />
                  Cases Sent To:
                </h4>
                <div className="space-y-2">
                  {stats.sent.breakdown
                    .filter((item) => item.branch)
                    .map((item) => (
                      <div
                        key={item.branch!.id}
                        className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                      >
                        <span className="text-sm">{item.branch!.name}</span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Received From Breakdown */}
            {stats.received.total > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <ArrowDownLeft className="h-4 w-4 text-green-600" />
                  Cases Received From:
                </h4>
                <div className="space-y-2">
                  {stats.received.breakdown
                    .filter((item) => item.branch)
                    .map((item) => (
                      <div
                        key={item.branch!.id}
                        className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                      >
                        <span className="text-sm">{item.branch!.name}</span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {!hasTransfers && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No transfer activity yet for this branch
          </div>
        )}
      </CardContent>
    </Card>
  );
}
