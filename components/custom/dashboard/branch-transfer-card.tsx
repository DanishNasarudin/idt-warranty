"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react";

type BranchTransferStat = {
  branch: {
    id: number;
    code: string;
    name: string;
  };
  sent: {
    total: number;
    breakdown: {
      branch?: {
        id: number;
        code: string;
        name: string;
      };
      count: number;
    }[];
  };
  received: {
    total: number;
    breakdown: {
      branch?: {
        id: number;
        code: string;
        name: string;
      };
      count: number;
    }[];
  };
};

type BranchTransferCardProps = {
  transferStats: BranchTransferStat[];
};

export function BranchTransferCard({ transferStats }: BranchTransferCardProps) {
  const totalTransfers = transferStats.reduce(
    (sum, stat) => sum + stat.sent.total + stat.received.total,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Branch Transfer Activity
        </CardTitle>
        <CardDescription>
          Total transfers:{" "}
          <span className="font-semibold">{totalTransfers}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transferStats.map((stat) => {
            const hasActivity = stat.sent.total > 0 || stat.received.total > 0;

            return (
              <div
                key={stat.branch.id}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{stat.branch.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {stat.branch.code}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="gap-1">
                      <ArrowUpRight className="h-3 w-3 text-orange-600" />
                      {stat.sent.total}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <ArrowDownLeft className="h-3 w-3 text-green-600" />
                      {stat.received.total}
                    </Badge>
                  </div>
                </div>

                {hasActivity ? (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Sent To */}
                    {stat.sent.total > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3" />
                          Sent to:
                        </p>
                        <div className="space-y-1">
                          {stat.sent.breakdown
                            .filter((item) => item.branch)
                            .map((item) => (
                              <div
                                key={item.branch!.id}
                                className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50"
                              >
                                <span>{item.branch!.code}</span>
                                <Badge
                                  variant="secondary"
                                  className="text-xs h-5"
                                >
                                  {item.count}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Received From */}
                    {stat.received.total > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <ArrowDownLeft className="h-3 w-3" />
                          Received from:
                        </p>
                        <div className="space-y-1">
                          {stat.received.breakdown
                            .filter((item) => item.branch)
                            .map((item) => (
                              <div
                                key={item.branch!.id}
                                className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50"
                              >
                                <span>{item.branch!.code}</span>
                                <Badge
                                  variant="secondary"
                                  className="text-xs h-5"
                                >
                                  {item.count}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs text-muted-foreground">
                    No transfer activity
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
