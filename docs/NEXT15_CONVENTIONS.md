# Next.js 15 Conventions Applied

This document outlines the Next.js 15 conventions applied to the settings feature, following the same pattern used in the branch warranty table.

## Key Principles

### 1. Server Actions as Props (Not Direct Imports)

**❌ Old Pattern (Anti-pattern):**
```typescript
// components/custom/settings/branch-management.tsx
"use client";
import { createBranch } from "../../../app/settings/actions";

export function BranchManagement({ initialBranches }) {
  async function handleCreate(data) {
    await createBranch(data); // Direct import
  }
}
```

**✅ New Pattern (Next.js 15 Convention):**
```typescript
// app/settings/page.tsx
export default async function SettingsPage() {
  async function handleCreateBranch(data) {
    "use server"; // Inline server action
    return await createBranchAction(data);
  }

  return (
    <BranchManagement
      onCreate={handleCreateBranch} // Passed as prop
    />
  );
}

// components/custom/settings/branch-management.tsx
"use client";
type Props = {
  onCreate: (data: CreateData) => Promise<any>;
};

export function BranchManagement({ onCreate }: Props) {
  async function handleCreate(data) {
    await onCreate(data); // Called via props
  }
}
```

### 2. Data Fetching in Server Component

**Page component always fetches data:**
```typescript
// app/settings/page.tsx
export default async function SettingsPage() {
  // Fetch all data in parallel on the server
  const [branches, staff, branchesForSelect] = await Promise.all([
    getAllBranches(),
    getAllStaff(),
    getBranchesForSelect(),
  ]);

  // Pass to client components
  return <BranchManagement initialBranches={branches} />;
}
```

### 3. Type Imports from Services

**Always use service types:**
```typescript
// ❌ Old: Duplicate type definitions
type Branch = {
  id: number;
  code: string;
  name: string;
  _count: { staff: number; cases: number };
};

// ✅ New: Import from services
import type { BranchWithCounts } from "@/lib/services";
```

### 4. Inline "use server" Directives

**Wrap action calls in page component:**
```typescript
export default async function SettingsPage() {
  // Each wrapper has "use server" directive
  async function handleCreate(data: CreateData) {
    "use server";
    return await createAction(data);
  }

  async function handleUpdate(id: number, data: UpdateData) {
    "use server";
    return await updateAction(id, data);
  }

  async function handleDelete(id: number) {
    "use server";
    await deleteAction(id);
  }
}
```

## File Structure

### Before Refactoring
```
app/settings/
├── page.tsx              (imports components directly)
├── actions.ts            (imported by components)
└── components/
    ├── branch-management.tsx  (imports actions directly ❌)
    └── staff-management.tsx   (imports actions directly ❌)
```

### After Refactoring
```
app/settings/
├── page.tsx              (creates inline wrappers, passes as props ✅)
└── actions.ts            (called by page.tsx only)

components/custom/settings/
├── index.ts              (barrel exports)
├── branch-management.tsx (receives actions via props ✅)
└── staff-management.tsx  (receives actions via props ✅)

lib/services/
├── index.ts              (barrel exports with types)
├── branch-service.ts     (pure business logic)
└── staff-service.ts      (pure business logic)
```

## Benefits

### 1. Clear Boundaries
- **Server code**: Always in `app/` directory (page.tsx, actions.ts)
- **Client code**: Always in `components/` directory
- **Business logic**: Always in `lib/services/`

### 2. Better Testing
```typescript
// Easy to test with mock functions
test("creates branch", async () => {
  const mockCreate = jest.fn();
  render(
    <BranchManagement
      initialBranches={[]}
      onCreate={mockCreate}
    />
  );
  // Test component without hitting server
});
```

### 3. Type Safety
```typescript
// Full type inference from server to client
async function handleCreate(data: CreateBranchInput) {
  "use server";
  return await createBranch(data); // Returns Branch type
}

// Client component knows exact type
onCreate: (data: CreateBranchInput) => Promise<Branch>
```

### 4. Reusability
```typescript
// Same component can work with different backends
<BranchManagement
  onCreate={handleCreateBranch}    // Production
  onCreate={mockCreateBranch}      // Testing
  onCreate={handleCreateFromAPI}   // Alternative implementation
/>
```

### 5. Performance
- Data fetching happens on server (faster database access)
- No hydration issues
- Smaller client bundle (actions not included)

## Migration Checklist

When refactoring features to follow this pattern:

- [ ] Move components from `app/feature/components/` to `components/custom/feature/`
- [ ] Remove direct action imports from client components
- [ ] Add action props to component interfaces
- [ ] Create inline server action wrappers in page.tsx
- [ ] Pass actions as props to client components
- [ ] Import types from `lib/services` instead of duplicating
- [ ] Create barrel exports (`index.ts`) for clean imports
- [ ] Update ARCHITECTURE.md with feature documentation

## Examples in Codebase

### Settings Feature (Current)
- **Page**: `app/settings/page.tsx`
- **Components**: `components/custom/settings/`
- **Actions**: `app/settings/actions.ts`
- **Services**: `lib/services/branch-service.ts`, `lib/services/staff-service.ts`

### Warranty Feature (Reference)
- **Page**: `app/branch/[id]/page.tsx`
- **Components**: `components/custom/warranty/`
- **Actions**: `app/branch/[id]/actions.ts`
- **Types**: `lib/types/warranty.ts`

Both features now follow the same consistent Next.js 15 conventions! 🎉
