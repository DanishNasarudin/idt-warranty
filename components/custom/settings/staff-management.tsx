"use client";

import { AVAILABLE_COLORS, StaffBadge } from "@/components/custom/staff-badge";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type StaffWithRelations = {
  id: number;
  name: string;
  color: string | null;
  branches: {
    branchId: number;
    branch: {
      id: number;
      code: string;
      name: string;
    };
  }[];
  _count: {
    receivedCases: number;
    servicedCases: number;
  };
};

type BranchOption = {
  id: number;
  code: string;
  name: string;
};

type StaffManagementProps = {
  initialStaff: StaffWithRelations[];
  branches: BranchOption[];
  onCreateStaff: (data: {
    name: string;
    color?: string;
    branchIds: number[];
  }) => Promise<any>;
  onUpdateStaff: (
    id: number,
    data: {
      name?: string;
      color?: string;
      branchIds?: number[];
    }
  ) => Promise<any>;
  onDeleteStaff: (id: number) => Promise<void>;
};

export function StaffManagement({
  initialStaff,
  branches,
  onCreateStaff,
  onUpdateStaff,
  onDeleteStaff,
}: StaffManagementProps) {
  const [staff, setStaff] = useState<StaffWithRelations[]>(initialStaff);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffWithRelations | null>(
    null
  );
  const [deletingStaff, setDeletingStaff] = useState<StaffWithRelations | null>(
    null
  );

  const [formData, setFormData] = useState({
    name: "",
    color: "",
    branchIds: [] as number[],
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newStaff = await onCreateStaff({
        name: formData.name,
        color: formData.color || undefined,
        branchIds: formData.branchIds,
      });
      setStaff([
        ...staff,
        { ...newStaff, _count: { receivedCases: 0, servicedCases: 0 } },
      ]);
      toast.success("Staff member created successfully");
      setIsCreateOpen(false);
      setFormData({ name: "", color: "", branchIds: [] });
    } catch (error) {
      toast.error("Failed to create staff member");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      const updated = await onUpdateStaff(editingStaff.id, {
        name: formData.name,
        color: formData.color || undefined,
        branchIds: formData.branchIds,
      });
      setStaff(
        staff.map((s) =>
          s.id === updated.id ? { ...updated, _count: s._count } : s
        )
      );
      toast.success("Staff member updated successfully");
      setEditingStaff(null);
      setFormData({ name: "", color: "", branchIds: [] });
    } catch (error) {
      toast.error("Failed to update staff member");
    }
  };

  const handleDelete = async () => {
    if (!deletingStaff) return;

    try {
      await onDeleteStaff(deletingStaff.id);
      setStaff(staff.filter((s) => s.id !== deletingStaff.id));
      toast.success("Staff member deleted successfully");
      setDeletingStaff(null);
    } catch (error) {
      toast.error(
        "Failed to delete staff member. They may be assigned to cases."
      );
    }
  };

  const openEditDialog = (staffMember: StaffWithRelations) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      color: staffMember.color || "",
      branchIds: staffMember.branches.map((b) => b.branchId),
    });
  };

  const closeEditDialog = () => {
    setEditingStaff(null);
    setFormData({ name: "", color: "", branchIds: [] });
  };

  const toggleBranch = (branchId: number) => {
    setFormData((prev) => ({
      ...prev,
      branchIds: prev.branchIds.includes(branchId)
        ? prev.branchIds.filter((id) => id !== branchId)
        : [...prev.branchIds, branchId],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Staff</h2>
          <p className="text-muted-foreground">
            Manage staff members and their branch assignments
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create New Staff Member</DialogTitle>
                <DialogDescription>
                  Add a new staff member to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., John Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Badge Color</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) =>
                      setFormData({ ...formData, color: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a color (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_COLORS.map((color) => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center gap-2">
                            <StaffBadge name={color} color={color} />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assign to Branches</Label>
                  <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                    {branches.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No branches available. Create a branch first.
                      </p>
                    ) : (
                      branches.map((branch) => (
                        <div
                          key={branch.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`branch-${branch.id}`}
                            checked={formData.branchIds.includes(branch.id)}
                            onCheckedChange={() => toggleBranch(branch.id)}
                          />
                          <Label
                            htmlFor={`branch-${branch.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            {branch.name} ({branch.code})
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Staff Member</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Branches</TableHead>
              <TableHead className="text-center">Cases Received</TableHead>
              <TableHead className="text-center">Cases Serviced</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No staff members found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              staff.map((staffMember) => (
                <TableRow key={staffMember.id}>
                  <TableCell className="font-medium">
                    {staffMember.name}
                  </TableCell>
                  <TableCell>
                    {staffMember.color ? (
                      <StaffBadge
                        name={staffMember.color}
                        color={staffMember.color}
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        No color
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {staffMember.branches.length === 0 ? (
                        <span className="text-muted-foreground text-sm">
                          No branches
                        </span>
                      ) : (
                        staffMember.branches.map((b) => (
                          <span
                            key={b.branchId}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-xs"
                          >
                            {b.branch.code}
                          </span>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {staffMember._count.receivedCases}
                  </TableCell>
                  <TableCell className="text-center">
                    {staffMember._count.servicedCases}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(staffMember)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingStaff(staffMember)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
        open={!!editingStaff}
        onOpenChange={(open) => !open && closeEditDialog()}
      >
        <DialogContent className="max-w-md">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>
                Update staff member information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Badge Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) =>
                    setFormData({ ...formData, color: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a color (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center gap-2">
                          <StaffBadge name={color} color={color} />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assign to Branches</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`edit-branch-${branch.id}`}
                        checked={formData.branchIds.includes(branch.id)}
                        onCheckedChange={() => toggleBranch(branch.id)}
                      />
                      <Label
                        htmlFor={`edit-branch-${branch.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        {branch.name} ({branch.code})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingStaff}
        onOpenChange={(open) => !open && setDeletingStaff(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingStaff?.name}&quot;.
              This action cannot be undone.
              {deletingStaff &&
                (deletingStaff._count.receivedCases > 0 ||
                  deletingStaff._count.servicedCases > 0) && (
                  <span className="block mt-2 text-destructive font-medium">
                    Warning: This staff member has received{" "}
                    {deletingStaff._count.receivedCases} case(s) and serviced{" "}
                    {deletingStaff._count.servicedCases} case(s).
                  </span>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
