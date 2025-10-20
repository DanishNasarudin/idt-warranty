import {
  BranchManagement,
  CaseScopeManagement,
  StaffManagement,
} from "@/components/custom/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createBranch as createBranchAction,
  createCaseScope as createCaseScopeAction,
  createStaff as createStaffAction,
  deleteBranch as deleteBranchAction,
  deleteCaseScope as deleteCaseScopeAction,
  deleteStaff as deleteStaffAction,
  getAllBranches,
  getAllCaseScopes,
  getAllStaff,
  getBranchesForSelect,
  updateBranch as updateBranchAction,
  updateCaseScope as updateCaseScopeAction,
  updateStaff as updateStaffAction,
} from "./actions";

// Force dynamic rendering to ensure fresh data on every request
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Fetch initial data on the server
  const [branches, staff, branchesForSelect, caseScopes] = await Promise.all([
    getAllBranches(),
    getAllStaff(),
    getBranchesForSelect(),
    getAllCaseScopes(),
  ]);

  // Server action wrappers for client components
  async function handleCreateBranch(data: {
    code: string;
    name: string;
    address?: string;
    officePhone?: string;
    whatsappPhone?: string;
  }) {
    "use server";
    return await createBranchAction(data);
  }

  async function handleUpdateBranch(
    id: number,
    data: {
      code?: string;
      name?: string;
      address?: string;
      officePhone?: string;
      whatsappPhone?: string;
    }
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

  async function handleCreateCaseScope(data: { code: string }) {
    "use server";
    return await createCaseScopeAction(data);
  }

  async function handleUpdateCaseScope(id: number, data: { code?: string }) {
    "use server";
    return await updateCaseScopeAction(id, data);
  }

  async function handleDeleteCaseScope(id: number) {
    "use server";
    await deleteCaseScopeAction(id);
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
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="scopes">Case Scopes</TabsTrigger>
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
          <TabsContent value="scopes" className="mt-6">
            <CaseScopeManagement
              initialCaseScopes={caseScopes}
              onCreateCaseScope={handleCreateCaseScope}
              onUpdateCaseScope={handleUpdateCaseScope}
              onDeleteCaseScope={handleDeleteCaseScope}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
