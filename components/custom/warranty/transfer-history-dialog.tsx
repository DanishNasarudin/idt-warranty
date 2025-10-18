"use client";

import { getCaseTransferHistory } from "@/app/branch/[id]/transfer-actions";
import { StaffBadge } from "@/components/custom/staff-badge";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CaseTransferWithRelations } from "@/lib/types/warranty";
import { ArrowRight, History, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type TransferHistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: number;
  serviceNo: string;
};

export function TransferHistoryDialog({
  open,
  onOpenChange,
  caseId,
  serviceNo,
}: TransferHistoryDialogProps) {
  const [transfers, setTransfers] = useState<CaseTransferWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTransferHistory();
    }
  }, [open, caseId]);

  const loadTransferHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getCaseTransferHistory(caseId);
      setTransfers(data);
    } catch (error) {
      console.error("Failed to load transfer history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transfer History
          </DialogTitle>
          <DialogDescription>
            Transfer history for case{" "}
            <span className="font-semibold">{serviceNo}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <History className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No transfer history found for this case
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.map((transfer, index) => (
                <div
                  key={transfer.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {transfer.fromBranch.name}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {transfer.toBranch.name}
                      </span>
                    </div>
                    <Badge
                      variant={
                        transfer.status === "COMPLETED"
                          ? "default"
                          : transfer.status === "PENDING"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {transfer.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      <span className="font-medium">Transferred:</span>{" "}
                      {formatDate(transfer.transferredAt)}
                    </div>
                    {transfer.transferredBy && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">By:</span>
                        <StaffBadge
                          name={transfer.transferredBy.name}
                          color={transfer.transferredBy.color}
                        />
                      </div>
                    )}
                  </div>

                  {transfer.reason && (
                    <div className="text-sm">
                      <span className="font-medium">Reason:</span>{" "}
                      <span className="text-muted-foreground">
                        {transfer.reason}
                      </span>
                    </div>
                  )}

                  {transfer.notes && (
                    <div className="text-sm">
                      <span className="font-medium">Notes:</span>{" "}
                      <span className="text-muted-foreground">
                        {transfer.notes}
                      </span>
                    </div>
                  )}

                  {index !== transfers.length - 1 && (
                    <div className="border-b pt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
