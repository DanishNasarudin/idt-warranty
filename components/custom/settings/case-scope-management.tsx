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

type CaseScopeWithCounts = {
  id: number;
  code: string;
  _count: {
    cases: number;
  };
};

type CaseScopeManagementProps = {
  initialCaseScopes: CaseScopeWithCounts[];
  onCreateCaseScope: (data: { code: string }) => Promise<any>;
  onUpdateCaseScope: (id: number, data: { code?: string }) => Promise<any>;
  onDeleteCaseScope: (id: number) => Promise<void>;
};

export function CaseScopeManagement({
  initialCaseScopes,
  onCreateCaseScope,
  onUpdateCaseScope,
  onDeleteCaseScope,
}: CaseScopeManagementProps) {
  const [caseScopes, setCaseScopes] =
    useState<CaseScopeWithCounts[]>(initialCaseScopes);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCaseScope, setEditingCaseScope] =
    useState<CaseScopeWithCounts | null>(null);
  const [deletingCaseScope, setDeletingCaseScope] =
    useState<CaseScopeWithCounts | null>(null);

  const [formData, setFormData] = useState({ code: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCaseScope = await onCreateCaseScope(formData);
      setCaseScopes([...caseScopes, { ...newCaseScope, _count: { cases: 0 } }]);
      toast.success("Case scope created successfully");
      setIsCreateOpen(false);
      setFormData({ code: "" });
    } catch (error) {
      toast.error("Failed to create case scope");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCaseScope) return;

    try {
      const updated = await onUpdateCaseScope(editingCaseScope.id, formData);
      setCaseScopes(
        caseScopes.map((cs) =>
          cs.id === updated.id ? { ...updated, _count: cs._count } : cs
        )
      );
      toast.success("Case scope updated successfully");
      setEditingCaseScope(null);
      setFormData({ code: "" });
    } catch (error) {
      toast.error("Failed to update case scope");
    }
  };

  const handleDelete = async () => {
    if (!deletingCaseScope) return;

    try {
      await onDeleteCaseScope(deletingCaseScope.id);
      setCaseScopes(caseScopes.filter((cs) => cs.id !== deletingCaseScope.id));
      toast.success("Case scope deleted successfully");
      setDeletingCaseScope(null);
    } catch (error) {
      toast.error("Failed to delete case scope. It may have associated data.");
    }
  };

  const openEditDialog = (caseScope: CaseScopeWithCounts) => {
    setEditingCaseScope(caseScope);
    setFormData({ code: caseScope.code });
  };

  const closeEditDialog = () => {
    setEditingCaseScope(null);
    setFormData({ code: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Case Scopes</h2>
          <p className="text-muted-foreground">
            Manage warranty case scope types (e.g., LOCAL, OTHER)
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <ActionButton action="add" label="Add Case Scope" />
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add New Case Scope</DialogTitle>
                <DialogDescription>
                  Create a new case scope type for warranty cases.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g., LOCAL, OTHER"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <ActionButton
                  type="button"
                  action="cancel"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setFormData({ code: "" });
                  }}
                  showIcon={false}
                />
                <ActionButton type="submit" action="create" showIcon={false} />
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
              <TableHead>Warranty Cases</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {caseScopes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  No case scopes found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              caseScopes.map((caseScope) => (
                <TableRow key={caseScope.id}>
                  <TableCell className="font-medium">
                    {caseScope.code}
                  </TableCell>
                  <TableCell>{caseScope._count.cases}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <IconButton
                        variant="ghost"
                        icon={Pencil}
                        label="Edit case scope"
                        onClick={() => openEditDialog(caseScope)}
                      />
                      <IconButton
                        variant="ghost"
                        icon={Trash2}
                        label="Delete case scope"
                        onClick={() => setDeletingCaseScope(caseScope)}
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
        open={!!editingCaseScope}
        onOpenChange={(open) => !open && closeEditDialog()}
      >
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Case Scope</DialogTitle>
              <DialogDescription>
                Update the case scope information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-code">Code</Label>
                <Input
                  id="edit-code"
                  placeholder="e.g., LOCAL, OTHER"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
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
              <ActionButton
                type="submit"
                action="save"
                label="Update"
                showIcon={false}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingCaseScope}
        onOpenChange={(open) => !open && setDeletingCaseScope(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the case scope &quot;{deletingCaseScope?.code}
              &quot;. This action cannot be undone. Case scopes with associated
              warranty cases cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
