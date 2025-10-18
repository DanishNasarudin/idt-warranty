"use client";

import { ActionButton, IconButton } from "@/components/design-system";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type BranchWithCounts = {
  id: number;
  code: string;
  name: string;
  address: string | null;
  officePhone: string | null;
  whatsappPhone: string | null;
  _count: {
    staff: number;
    cases: number;
  };
};

type BranchManagementProps = {
  initialBranches: BranchWithCounts[];
  onCreateBranch: (data: {
    code: string;
    name: string;
    address?: string;
    officePhone?: string;
    whatsappPhone?: string;
  }) => Promise<any>;
  onUpdateBranch: (
    id: number,
    data: {
      code?: string;
      name?: string;
      address?: string;
      officePhone?: string;
      whatsappPhone?: string;
    }
  ) => Promise<any>;
  onDeleteBranch: (id: number) => Promise<void>;
};

export function BranchManagement({
  initialBranches,
  onCreateBranch,
  onUpdateBranch,
  onDeleteBranch,
}: BranchManagementProps) {
  const [branches, setBranches] = useState<BranchWithCounts[]>(initialBranches);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchWithCounts | null>(
    null
  );
  const [deletingBranch, setDeletingBranch] = useState<BranchWithCounts | null>(
    null
  );
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    address: "",
    officePhone: "",
    whatsappPhone: "",
  });

  // Helper function to generate service number preview
  const generateServiceNoPreview = (code: string) => {
    if (!code.trim()) return "W[CODE]YYMM###";
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, "0");
    return `W${code.toUpperCase()}${yy}${mm}001`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newBranch = await onCreateBranch(formData);
      setBranches([
        ...branches,
        { ...newBranch, _count: { staff: 0, cases: 0 } },
      ]);
      toast.success("Branch created successfully");
      setIsCreateOpen(false);
      setFormData({
        code: "",
        name: "",
        address: "",
        officePhone: "",
        whatsappPhone: "",
      });
    } catch (error) {
      toast.error("Failed to create branch");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    try {
      const updated = await onUpdateBranch(editingBranch.id, formData);
      setBranches(
        branches.map((b) =>
          b.id === updated.id ? { ...updated, _count: b._count } : b
        )
      );
      toast.success("Branch updated successfully");
      setEditingBranch(null);
      setFormData({
        code: "",
        name: "",
        address: "",
        officePhone: "",
        whatsappPhone: "",
      });
    } catch (error) {
      toast.error("Failed to update branch");
    }
  };

  const handleDelete = async () => {
    if (!deletingBranch) return;

    // Verify confirmation text
    const expectedText = `Yes I want to delete branch ${deletingBranch.name}`;
    if (deleteConfirmationText !== expectedText) {
      toast.error("Confirmation text does not match. Please type exactly as shown.");
      return;
    }

    try {
      await onDeleteBranch(deletingBranch.id);
      setBranches(branches.filter((b) => b.id !== deletingBranch.id));
      toast.success("Branch deleted successfully");
      setDeletingBranch(null);
      setDeleteConfirmationText("");
    } catch (error) {
      toast.error("Failed to delete branch.");
    }
  };

  const openEditDialog = (branch: BranchWithCounts) => {
    setEditingBranch(branch);
    setFormData({
      code: branch.code,
      name: branch.name,
      address: branch.address || "",
      officePhone: branch.officePhone || "",
      whatsappPhone: branch.whatsappPhone || "",
    });
  };

  const closeEditDialog = () => {
    setEditingBranch(null);
    setFormData({
      code: "",
      name: "",
      address: "",
      officePhone: "",
      whatsappPhone: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Branches</h2>
          <p className="text-muted-foreground">
            Manage branch locations and their information
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <ActionButton action="add" label="Add Branch" />
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create New Branch</DialogTitle>
                <DialogDescription>
                  Add a new branch location to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Branch Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g., AP, SS2, JB"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    required
                    maxLength={16}
                  />
                  <p className="text-xs text-muted-foreground">
                    This code will be used in service numbers. Preview:{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {generateServiceNoPreview(formData.code)}
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Ampang HQ, SS2 PJ"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    maxLength={64}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="e.g., 123 Main Street, City"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officePhone">Office Phone</Label>
                  <Input
                    id="officePhone"
                    placeholder="e.g., +60 3-1234 5678"
                    value={formData.officePhone}
                    onChange={(e) =>
                      setFormData({ ...formData, officePhone: e.target.value })
                    }
                    maxLength={32}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappPhone">WhatsApp Number</Label>
                  <Input
                    id="whatsappPhone"
                    placeholder="e.g., +60 12-345 6789"
                    value={formData.whatsappPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsappPhone: e.target.value,
                      })
                    }
                    maxLength={32}
                  />
                </div>
              </div>
              <DialogFooter>
                <ActionButton
                  type="submit"
                  action="create"
                  label="Create Branch"
                  showIcon={false}
                />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Staff</TableHead>
              <TableHead className="text-center">Cases</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No branches found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-mono font-medium">
                    {branch.code}
                  </TableCell>
                  <TableCell>{branch.name}</TableCell>
                  <TableCell className="text-center">
                    {branch._count.staff}
                  </TableCell>
                  <TableCell className="text-center">
                    {branch._count.cases}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <IconButton
                        variant="ghost"
                        size="sm"
                        icon={Pencil}
                        label="Edit branch"
                        onClick={() => openEditDialog(branch)}
                      />
                      <IconButton
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        label="Delete branch"
                        onClick={() => setDeletingBranch(branch)}
                        className="text-destructive hover:text-destructive"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingBranch}
        onOpenChange={(open) => !open && closeEditDialog()}
      >
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Branch</DialogTitle>
              <DialogDescription>Update branch information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Branch Code</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                  maxLength={16}
                />
                <p className="text-xs text-muted-foreground">
                  This code will be used in service numbers. Preview:{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {generateServiceNoPreview(formData.code)}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Branch Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  maxLength={64}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  placeholder="e.g., 123 Main Street, City"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-officePhone">Office Phone</Label>
                <Input
                  id="edit-officePhone"
                  placeholder="e.g., +60 3-1234 5678"
                  value={formData.officePhone}
                  onChange={(e) =>
                    setFormData({ ...formData, officePhone: e.target.value })
                  }
                  maxLength={32}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-whatsappPhone">WhatsApp Number</Label>
                <Input
                  id="edit-whatsappPhone"
                  placeholder="e.g., +60 12-345 6789"
                  value={formData.whatsappPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsappPhone: e.target.value })
                  }
                  maxLength={32}
                />
              </div>
            </div>
            <DialogFooter>
              <ActionButton
                type="button"
                action="cancel"
                onClick={closeEditDialog}
                showIcon={false}
              />
              <ActionButton type="submit" action="save" showIcon={false} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingBranch}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingBranch(null);
            setDeleteConfirmationText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch - Confirmation Required</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">
                You are about to permanently delete the branch &quot;
                <span className="font-semibold text-foreground">
                  {deletingBranch?.name}
                </span>
                &quot;.
              </span>
              
              {deletingBranch &&
                (deletingBranch._count.staff > 0 ||
                  deletingBranch._count.cases > 0) && (
                  <span className="block p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                    <span className="block font-semibold text-destructive mb-1">
                      ⚠️ Warning: This will cascade delete:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-sm text-destructive/90">
                      {deletingBranch._count.staff > 0 && (
                        <li>{deletingBranch._count.staff} staff assignment(s)</li>
                      )}
                      {deletingBranch._count.cases > 0 && (
                        <li>{deletingBranch._count.cases} warranty case(s) and all related data</li>
                      )}
                    </ul>
                  </span>
                )}
              
              <span className="block pt-2">
                To confirm, please type exactly:{" "}
                <span className="block mt-2 p-2 bg-muted rounded font-mono text-sm font-semibold text-foreground">
                  Yes I want to delete branch {deletingBranch?.name}
                </span>
              </span>

              <div className="pt-2">
                <Input
                  placeholder="Type the confirmation text here..."
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="font-mono"
                  autoComplete="off"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmationText("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={
                !deletingBranch ||
                deleteConfirmationText !==
                  `Yes I want to delete branch ${deletingBranch?.name}`
              }
            >
              Delete Branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
