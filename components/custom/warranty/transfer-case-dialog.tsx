"use client";

import { transferCaseToBranch } from "@/app/branch/[id]/transfer-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BranchOption } from "@/lib/types/warranty";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type TransferCaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: number;
  currentBranchId: number;
  currentBranchName: string;
  serviceNo: string;
  availableBranches: BranchOption[];
  staffId?: number;
  onTransferComplete?: () => void;
};

export function TransferCaseDialog({
  open,
  onOpenChange,
  caseId,
  currentBranchId,
  currentBranchName,
  serviceNo,
  availableBranches,
  staffId,
  onTransferComplete,
}: TransferCaseDialogProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTransfer = async () => {
    if (!selectedBranchId) {
      toast.error("Please select a destination branch");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await transferCaseToBranch(
        caseId,
        currentBranchId,
        parseInt(selectedBranchId),
        staffId,
        reason || undefined,
        notes || undefined
      );

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        onTransferComplete?.();
        // Reset form
        setSelectedBranchId("");
        setReason("");
        setNotes("");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("Failed to transfer case");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Case
          </DialogTitle>
          <DialogDescription>
            Transfer case <span className="font-semibold">{serviceNo}</span>{" "}
            from {currentBranchName} to another branch.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="branch">Destination Branch *</Label>
            <Select
              value={selectedBranchId}
              onValueChange={setSelectedBranchId}
            >
              <SelectTrigger id="branch">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {availableBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name} ({branch.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for Transfer</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Customer relocated, specialized equipment required, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information for the receiving branch..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleTransfer} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Transfer Case
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
