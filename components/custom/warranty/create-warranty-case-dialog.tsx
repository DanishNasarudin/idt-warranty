"use client";

import { ActionButton } from "@/components/design-system";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StaffOption } from "@/lib/types/warranty";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

type CreateWarrantyCaseDialogProps = {
  branchId: number;
  staff: StaffOption[];
  onCreateCase: (data: CreateWarrantyCaseFormData) => Promise<void>;
};

export type CreateWarrantyCaseFormData = {
  customerName: string;
  customerContact?: string;
  customerEmail?: string;
  address?: string;
  purchaseDate?: Date;
  invoice?: string;
  receivedItems?: string;
  pin?: string;
  issues?: string;
  receivedByStaffId?: number;
  idtPc?: boolean;
};

export function CreateWarrantyCaseDialog({
  branchId,
  staff,
  onCreateCase,
}: CreateWarrantyCaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateWarrantyCaseFormData>({
    customerName: "",
    customerContact: "",
    customerEmail: "",
    address: "",
    purchaseDate: undefined,
    invoice: "",
    receivedItems: "",
    pin: "",
    issues: "",
    receivedByStaffId: undefined,
    idtPc: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.customerName.trim()) {
        toast.error("Customer name is required");
        setIsSubmitting(false);
        return;
      }

      await onCreateCase(formData);

      toast.success("Warranty case created successfully");

      // Reset form and close dialog
      setFormData({
        customerName: "",
        customerContact: "",
        customerEmail: "",
        address: "",
        purchaseDate: undefined,
        invoice: "",
        receivedItems: "",
        pin: "",
        issues: "",
        receivedByStaffId: undefined,
        idtPc: undefined,
      });
      setOpen(false);
    } catch (error) {
      toast.error("Failed to create warranty case");
      console.error("Error creating warranty case:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (
    field: keyof CreateWarrantyCaseFormData,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionButton action="create" label="Create Case" />
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Warranty Case</DialogTitle>
          <DialogDescription>
            Fill in the details for the new warranty case. Fields marked with *
            are required. The service number will be generated automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Customer Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => updateFormData("customerName", e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            {/* Customer Contact */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customerContact">Contact</Label>
              <Input
                id="customerContact"
                value={formData.customerContact}
                onChange={(e) =>
                  updateFormData("customerContact", e.target.value)
                }
                className="col-span-3"
              />
            </div>

            {/* Customer Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) =>
                  updateFormData("customerEmail", e.target.value)
                }
                className="col-span-3"
              />
            </div>

            {/* Address */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                className="col-span-3"
              />
            </div>

            {/* Purchase Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="purchaseDate"
                  type="date"
                  value={
                    formData.purchaseDate
                      ? format(formData.purchaseDate, "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) => {
                    const dateValue = e.target.value
                      ? new Date(e.target.value + "T00:00:00")
                      : undefined;
                    updateFormData("purchaseDate", dateValue);
                  }}
                  className="flex-1"
                />
                {/* <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className={cn(
                        "shrink-0",
                        !formData.purchaseDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={formData.purchaseDate}
                      onSelect={(date) => updateFormData("purchaseDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover> */}
              </div>
            </div>

            {/* Invoice */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoice">Invoice</Label>
              <Input
                id="invoice"
                value={formData.invoice}
                onChange={(e) => updateFormData("invoice", e.target.value)}
                className="col-span-3"
              />
            </div>

            {/* Received Items */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="receivedItems">Received Items</Label>
              <Input
                id="receivedItems"
                value={formData.receivedItems}
                onChange={(e) =>
                  updateFormData("receivedItems", e.target.value)
                }
                className="col-span-3"
              />
            </div>

            {/* PIN */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                value={formData.pin}
                onChange={(e) => updateFormData("pin", e.target.value)}
                className="col-span-3"
              />
            </div>

            {/* Issues */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="issues">Issues</Label>
              <Input
                id="issues"
                value={formData.issues}
                onChange={(e) => updateFormData("issues", e.target.value)}
                className="col-span-3"
              />
            </div>

            {/* Received By Staff */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="receivedByStaffId">Received By</Label>
              <Select
                value={formData.receivedByStaffId?.toString()}
                onValueChange={(value) =>
                  updateFormData(
                    "receivedByStaffId",
                    value ? parseInt(value) : undefined
                  )
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* IDT PC */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="idtPc">IDT PC?</Label>
              <Select
                value={
                  formData.idtPc === undefined
                    ? "none"
                    : formData.idtPc.toString()
                }
                onValueChange={(value) =>
                  updateFormData(
                    "idtPc",
                    value === "none" ? undefined : value === "true"
                  )
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <ActionButton
              type="button"
              action="cancel"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              showIcon={false}
            />
            <ActionButton
              type="submit"
              action="create"
              label="Create Case"
              isLoading={isSubmitting}
              loadingText="Creating..."
              showIcon={false}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
