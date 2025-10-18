import {
  BranchManagement,
  StaffManagement,
} from "@/components/custom/settings";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createBranch as createBranchAction,
  createStaff as createStaffAction,
  deleteBranch as deleteBranchAction,
  deleteStaff as deleteStaffAction,
  getAllBranches,
  getAllStaff,
  getBranchesForSelect,
  updateBranch as updateBranchAction,
  updateStaff as updateStaffAction,
} from "./actions";

export default async function SettingsPage() {
  // Fetch initial data on the server
  const [branches, staff, branchesForSelect] = await Promise.all([
    getAllBranches(),
    getAllStaff(),
    getBranchesForSelect(),
  ]);

  // Server action wrappers for client components
  async function handleCreateBranch(data: { code: string; name: string }) {
    "use server";
    return await createBranchAction(data);
  }

  async function handleUpdateBranch(
    id: number,
    data: { code?: string; name?: string }
  ) {
    "use server";
    return await updateBranchAction(id, data);
  }

  async function handleDeleteBranch(id: number) {
    "use server";
    await deleteBranchAction(id);
  }

  async function handleCreateStaff(data: {
    name: string;
    color?: string;
    branchIds: number[];
  }) {
    "use server";
    return await createStaffAction(data);
  }

  async function handleUpdateStaff(
    id: number,
    data: {
      name?: string;
      color?: string;
      branchIds?: number[];
    }
  ) {
    "use server";
    return await updateStaffAction(id, data);
  }

  async function handleDeleteStaff(id: number) {
    "use server";
    await deleteStaffAction(id);
  }

  return (
    <>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage branches and staff members
          </p>
        </div>

        <Tabs defaultValue="branches" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>
          <TabsContent value="branches" className="mt-6">
            <BranchManagement
              initialBranches={branches}
              onCreateBranch={handleCreateBranch}
              onUpdateBranch={handleUpdateBranch}
              onDeleteBranch={handleDeleteBranch}
            />
          </TabsContent>
          <TabsContent value="staff" className="mt-6">
            <StaffManagement
              initialStaff={staff}
              branches={branchesForSelect}
              onCreateStaff={handleCreateStaff}
              onUpdateStaff={handleUpdateStaff}
              onDeleteStaff={handleDeleteStaff}
            />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </>
  );
}
