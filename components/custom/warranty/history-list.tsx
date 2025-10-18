"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  FileText,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { StaffBadge } from "../staff-badge";

type HistoryRecord = {
  id: number;
  changeType: "INSERT" | "UPDATE" | "DELETE";
  changeTs: Date;
  snapshotJson: string | null;
  case: {
    id: number;
    serviceNo: string;
    customerName: string | null;
    status: string;
  };
  changedBy: {
    id: number;
    name: string;
    color: string | null;
  } | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type Props = {
  records: HistoryRecord[];
  pagination: Pagination;
  branchId: number;
};

const changeTypeConfig = {
  INSERT: {
    label: "Created",
    icon: FileText,
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  UPDATE: {
    label: "Updated",
    icon: Edit,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  DELETE: {
    label: "Deleted",
    icon: Trash2,
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
};

export default function HistoryList({ records, pagination, branchId }: Props) {
  const { page, totalPages, totalCount } = pagination;

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No history records found
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {records.length} of {totalCount} records
      </div>

      {/* History Records */}
      <div className="space-y-3">
        {records.map((record) => {
          const config = changeTypeConfig[record.changeType];
          const Icon = config.icon;

          return (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={config.color}>
                            {config.label}
                          </Badge>
                          <Link
                            href={`/branch/${branchId}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {record.case.serviceNo}
                          </Link>
                          <span className="text-sm text-muted-foreground">
                            •
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {record.case.customerName || "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {format(new Date(record.changeTs), "PPp")}
                          </span>
                          {record.changedBy && (
                            <>
                              <span>•</span>
                              <span>by</span>
                              <StaffBadge
                                name={record.changedBy.name}
                                color={record.changedBy.color}
                              />
                            </>
                          )}
                        </div>
                      </div>

                      <Badge variant="secondary" className="text-xs">
                        {record.case.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    {/* Snapshot Preview */}
                    {record.snapshotJson && record.changeType === "UPDATE" && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View changes
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto">
                          {JSON.stringify(
                            JSON.parse(record.snapshotJson),
                            null,
                            2
                          )}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/branch/${branchId}/history?page=${Math.max(1, page - 1)}`}
            >
              <Button variant="outline" size="sm" disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            </Link>
            <Link
              href={`/branch/${branchId}/history?page=${Math.min(
                totalPages,
                page + 1
              )}`}
            >
              <Button variant="outline" size="sm" disabled={page >= totalPages}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
