"use client";

import { deleteWarrantyCase } from "@/app/branch/[id]/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWarrantyCaseStore } from "@/lib/stores/warranty-case-store";
import { WarrantyCaseWithRelations } from "@/lib/types/warranty";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PrintPDFButton } from "./print-pdf-button";
import { SendEmailButton } from "./send-email-button";

type ExpandableRowDetailsProps = {
  case_: WarrantyCaseWithRelations;
  onUpdate: (updates: Partial<WarrantyCaseWithRelations>) => void;
};

export function ExpandableRowDetails({
  case_,
  onUpdate,
}: ExpandableRowDetailsProps) {
  const [localData, setLocalData] = useState({
    customerEmail: case_.customerEmail || "",
    address: case_.address || "",
    purchaseDate: case_.purchaseDate
      ? new Date(case_.purchaseDate).toISOString().split("T")[0]
      : "",
    invoice: case_.invoice || "",
    receivedItems: case_.receivedItems || "",
    pin: case_.pin || "",
    issues: case_.issues || "",
    solutions: case_.solutions || "",
    statusDesc: case_.statusDesc || "",
    remarks: case_.remarks || "",
    cost: case_.cost?.toString() || "0",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteCase = useWarrantyCaseStore((state) => state.deleteCase);

  const handleChange = (field: string, value: string) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string) => {
    const value = localData[field as keyof typeof localData];
    const currentValue = case_[field as keyof WarrantyCaseWithRelations];

    if (value !== (currentValue?.toString() || "")) {
      // Convert to appropriate type before saving
      let updateValue: any = value;

      if (field === "cost") {
        updateValue = parseFloat(value) || 0;
      } else if (field === "purchaseDate") {
        updateValue = value ? new Date(value) : null;
      }

      onUpdate({ [field]: updateValue });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWarrantyCase(case_.id, case_.branchId);
      deleteCase(case_.id);
      toast.success("Warranty case deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete warranty case");
      console.error("Error deleting warranty case:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const fields = [
    { name: "customerEmail", label: "Customer Email", type: "email" },
    { name: "purchaseDate", label: "Purchase Date", type: "date" },
    { name: "invoice", label: "Invoice", type: "text" },
    { name: "address", label: "Address", type: "text", multiline: true },
    {
      name: "statusDesc",
      label: "Status Description",
      type: "text",
      multiline: true,
    },
    { name: "remarks", label: "Remarks", type: "text", multiline: true },
    { name: "receivedItems", label: "Received Items", type: "text" },
    { name: "pin", label: "PIN", type: "text" },
    { name: "cost", label: "Cost", type: "number" },
    { name: "issues", label: "Issues", type: "text", multiline: true },
    { name: "solutions", label: "Solutions", type: "text", multiline: true },
  ];

  return (
    <div className="bg-muted/30 border-t">
      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Case Actions
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Print PDF Button */}
          <PrintPDFButton case_={case_} />

          {/* Send Email Button - Only shows if customer email exists */}
          <SendEmailButton case_={case_} />

          {/* Delete Button with Confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Case
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  warranty case <strong>{case_.serviceNo}</strong> for{" "}
                  <strong>{case_.customerName}</strong> and remove all
                  associated data from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {/* Add more action buttons here in the future */}
        </div>
      </div>

      {/* Existing Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label
              htmlFor={`${case_.id}-${field.name}`}
              className="text-sm font-medium"
            >
              {field.label}
            </Label>
            {field.multiline ? (
              <textarea
                id={`${case_.id}-${field.name}`}
                value={localData[field.name as keyof typeof localData]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                onBlur={() => handleBlur(field.name)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            ) : (
              <Input
                id={`${case_.id}-${field.name}`}
                type={field.type}
                value={localData[field.name as keyof typeof localData]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                onBlur={() => handleBlur(field.name)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
