# IDT Warranty - Project Architecture

## Overview

This Next.js 15 application follows a clean, scalable architecture with clear separation between server and client components.

## Folder Structure

```
/Users/danish/Documents/GitHub/idt-warranty/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── sse/
│   │       └── warranty-updates/
│   │           └── route.ts     # SSE endpoint for real-time updates
│   ├── branch/
│   │   └── [id]/
│   │       ├── page.tsx         # Server Component - Warranty cases by branch
│   │       ├── actions.ts       # Server Actions - Direct Prisma queries + SSE broadcast
│   │       ├── lock-actions.ts  # Field lock management
│   │       ├── error.tsx        # Error boundary
│   │       └── loading.tsx      # Loading skeleton
│   ├── dashboard/
│   │   └── page.tsx             # Dashboard page
│   ├── pdf-preview/
│   │   ├── page.tsx             # PDF preview server page
│   │   └── pdf-preview-client.tsx  # PDF preview client component
│   ├── settings/
│   │   ├── page.tsx             # Server Component - Settings management
│   │   ├── actions.ts           # Server Actions - Branch, Staff & CaseScope CRUD
│   │   ├── error.tsx            # Error boundary
│   │   └── loading.tsx          # Loading skeleton
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx         # Clerk authentication
│   ├── layout.tsx               # Root layout with Clerk & theme providers
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
│
├── components/                   # All components (ui + custom)
│   ├── ui/                      # Shadcn UI components
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── pagination.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── sonner.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   └── ... (other UI components)
│   │
│   └── custom/                  # Custom feature components
│       ├── warranty/            # Warranty table feature
│       │   ├── index.ts         # Barrel exports
│       │   ├── warranty-case-table.tsx
│       │   ├── warranty-case-table-wrapper.tsx
│       │   ├── editable-text-cell.tsx      # With lock indicators
│       │   ├── dropdown-cell.tsx           # With lock indicators
│       │   ├── expandable-row-details.tsx
│       │   ├── table-toolbar.tsx           # Search & filters
│       │   ├── table-pagination.tsx
│       │   ├── create-warranty-case-dialog.tsx
│       │   ├── warranty-case-pdf.tsx       # PDF document generator
│       │   ├── print-pdf-button.tsx
│       │   └── send-email-button.tsx       # Email with PDF attachment
│       │
│       ├── settings/            # Settings feature
│       │   ├── index.ts         # Barrel exports
│       │   ├── branch-management.tsx
│       │   ├── staff-management.tsx
│       │   └── case-scope-management.tsx
│       │
│       ├── navbar.tsx           # App navigation bar
│       ├── sidebar.tsx          # Sidebar navigation (client)
│       ├── sidebar-wrapper.tsx  # Sidebar wrapper (server)
│       ├── sidebar-button.tsx
│       ├── sidebar-hide-button.tsx
│       ├── staff-badge.tsx      # Colored staff badge (20 colors)
│       ├── theme-toggle.tsx
│       ├── tooltip-wrapper.tsx
│       └── icons.tsx
│
├── lib/                         # Utilities and configurations
│   ├── generated/
│   │   └── prisma/              # Generated Prisma Client
│   ├── actions/
│   │   └── sidebar-actions.ts   # Sidebar server actions
│   ├── hooks/
│   │   ├── use-scroll-listener.tsx
│   │   ├── use-warranty-sync.ts  # Real-time sync hook
│   │   └── use-debounce.ts      # Debounce utility
│   ├── providers/
│   │   ├── clerk-provider.tsx   # Clerk authentication provider
│   │   └── theme-provider.tsx   # Dark mode provider
│   ├── stores/
│   │   ├── warranty-case-store.ts           # Zustand store
│   │   └── collaborative-editing-store.ts   # Real-time collaboration state
│   ├── types/
│   │   ├── warranty.ts          # Warranty type definitions
│   │   ├── realtime.ts          # SSE types & locks
│   │   └── search-params.ts     # Search & filter types
│   ├── utils/
│   │   └── sse-manager.ts       # Server-side SSE connection manager
│   ├── providers.tsx            # Combined providers
│   └── utils.ts                 # Utility functions (cn, etc.)
│
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
│
├── public/                      # Static assets
├── docs/                        # Project documentation
│   └── NEXT15_CONVENTIONS.md    # Next.js 15 patterns guide
│
├── ARCHITECTURE.md              # This file
├── README.md                    # Project overview
├── next.config.ts
├── tsconfig.json
├── package.json
└── components.json              # Shadcn UI config
```

## Architecture Principles

### 1. **No Service Layer** - Direct Server Actions Pattern

All database operations are in server actions (`actions.ts`), not abstracted into service classes.

**Why?**

- Simpler codebase with fewer layers
- Follows Next.js 15 conventions directly
- Easy to understand and maintain
- Less abstraction overhead

```typescript
// ✅ Server Actions Pattern (Current)
// app/branch/[id]/actions.ts
"use server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function getWarrantyCasesByBranch(branchId: number) {
  try {
    return await prisma.warrantyCase.findMany({
      where: { branchId },
      include: { receivedBy: true, servicedBy: true },
    });
  } catch (error) {
    throw new Error("Failed to fetch warranty cases");
  }
}
```

### 2. **Components Under Root `components/` Folder**

All components live in the root `components/` directory for easy access and reusability.

```
components/
├── ui/          # Shadcn UI primitives
└── custom/      # Feature-specific components
    ├── warranty/
    ├── settings/
    └── ...
```

**Benefits:**

- ✅ Single source of truth for all components
- ✅ Easy imports: `@/components/custom/warranty`
- ✅ Reusable across different app routes
- ✅ Clear separation: `ui/` vs `custom/`

### 3. **Server Component Pattern (page.tsx)**

Page components fetch data and create inline server action wrappers.

```typescript
// app/branch/[id]/page.tsx
import { getWarrantyCasesByBranch, updateWarrantyCase } from "./actions";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const branchId = parseInt((await params).id);

  // 1. Fetch data on server
  const cases = await getWarrantyCasesByBranch(branchId);

  // 2. Create inline server action wrapper
  async function handleUpdateCase(caseId: number, updates: Updates) {
    "use server";
    await updateWarrantyCase(caseId, branchId, updates);
  }

  // 3. Pass data and actions as props
  return (
    <WarrantyCaseTableWrapper
      initialCases={cases}
      onUpdateCase={handleUpdateCase}
    />
  );
}
```

### 4. **Client Component Pattern**

Client components receive data and actions via props (never import server actions directly).

```typescript
// components/custom/warranty/warranty-case-table-wrapper.tsx
"use client";

type Props = {
  initialCases: WarrantyCaseWithRelations[];
  onUpdateCase: (caseId: number, updates: Updates) => Promise<void>;
};

export function WarrantyCaseTableWrapper({
  initialCases,
  onUpdateCase,
}: Props) {
  const [cases, setCases] = useState(initialCases);

  async function handleUpdate(caseId: number, updates: Updates) {
    await onUpdateCase(caseId, updates); // Call via props
    // Update local state
  }

  return <WarrantyCaseTable cases={cases} onUpdate={handleUpdate} />;
}
```

### 5. **Error & Loading States**

Every route has dedicated `error.tsx` and `loading.tsx` files.

```typescript
// app/branch/[id]/loading.tsx
export default function Loading() {
  return <Skeleton />;
}

// app/branch/[id]/error.tsx
("use client");
export default function Error({ error, reset }) {
  return <ErrorUI error={error} onReset={reset} />;
}
```

### 6. **Type Definitions**

Types live close to where they're used:

```
lib/types/
└── warranty.ts          # Shared warranty types

// OR inline in components/actions for feature-specific types
app/settings/actions.ts  # Settings-specific types
```

## Data Flow

### Read Flow (Server → Client)

```
[Server Component] page.tsx
    ↓ awaits
[Server Action] getWarrantyCasesByBranch()
    ↓ queries
[Prisma Client] prisma.warrantyCase.findMany()
    ↓ returns data
[Client Component] WarrantyCaseTableWrapper
    ↓ displays
[UI] Table with editable cells
```

### Write Flow (Client → Server → DB)

```
[User Action] Click to edit cell
    ↓ calls
[Client Component] handleUpdate()
    ↓ calls (via props)
[Server Action Wrapper] handleUpdateCase()
    ↓ calls
[Server Action] updateWarrantyCase()
    ↓ updates
[Prisma Client] prisma.warrantyCase.update()
    ↓ then
[revalidatePath()] Clear Next.js cache
```

## Feature Patterns

### Warranty Table Feature

**Location:** `components/custom/warranty/`

**Files:**

- `warranty-case-table.tsx` - Main table with 9 columns, expandable rows
- `warranty-case-table-wrapper.tsx` - Client wrapper with state management
- `editable-text-cell.tsx` - Click-to-edit text cells
- `dropdown-cell.tsx` - Dropdown with custom rendering
- `expandable-row-details.tsx` - Accordion with 12 additional fields
- `index.ts` - Barrel exports

**Server Actions:** `app/branch/[id]/actions.ts`

- `getWarrantyCasesByBranch()` - Fetch cases with relations
- `getStaffByBranch()` - Fetch staff for dropdowns
- `updateWarrantyCase()` - Update case with validation

**State Management:** Zustand store at `lib/stores/warranty-case-store.ts`

### Settings Feature

**Location:** `components/custom/settings/`

**Files:**

- `branch-management.tsx` - Branch CRUD UI with table & dialogs
- `staff-management.tsx` - Staff CRUD UI with color picker & branch checkboxes
- `index.ts` - Barrel exports

**Server Actions:** `app/settings/actions.ts`

- Branch: `getAllBranches()`, `createBranch()`, `updateBranch()`, `deleteBranch()`
- Staff: `getAllStaff()`, `createStaff()`, `updateStaff()`, `deleteStaff()`
- Helper: `getBranchesForSelect()` - For dropdowns

**UI Components:**

- Tabs for Branch/Staff switching
- Tables with inline editing dialogs
- Color picker with 20 Tailwind variants
- Branch checkboxes for staff assignment

### Sidebar Feature

**Location:** `components/custom/`

**Files:**

- `sidebar-wrapper.tsx` - Server component fetching branches
- `sidebar.tsx` - Client component with navigation
- `sidebar-button.tsx` - Navigation button component
- `sidebar-hide-button.tsx` - Toggle sidebar visibility

**Server Actions:** `lib/actions/sidebar-actions.ts`

- `getSidebarData()` - Fetch branches for navigation

**Pattern:** Server wrapper → Client component (dynamic data)

### Real-Time Collaborative Editing

**Technology:** Server-Sent Events (SSE)

**Core Files:**

- `app/api/sse/warranty-updates/route.ts` - SSE endpoint with auth
- `lib/utils/sse-manager.ts` - Connection & lock manager (singleton)
- `lib/hooks/use-warranty-sync.ts` - Main sync hook with debouncing
- `lib/stores/collaborative-editing-store.ts` - Zustand state for collaboration
- `lib/types/realtime.ts` - SSE message types & lock definitions
- `app/branch/[id]/lock-actions.ts` - Lock acquisition/release

**Features:**

- **Field Locking**: Prevents concurrent edits with 30-second expiry
- **Optimistic Updates**: Instant UI feedback before server confirmation
- **Debounced Saves**: 1-second debounce on text fields (90% fewer DB calls)
- **Auto-Reconnection**: Exponential backoff on connection loss
- **Periodic Sync**: Full sync every 60 seconds for consistency
- **Visual Indicators**: 🔒 lock icons, connection status, saving states

**See:** [REALTIME.md](./REALTIME.md) for complete documentation

### PDF Generation & Email

**PDF Generation:**

- `components/custom/warranty/warranty-case-pdf.tsx` - React PDF document
- `components/custom/warranty/print-pdf-button.tsx` - Generate & download PDF
- Uses `@react-pdf/renderer` for PDF creation
- Includes company logo, warranty details, and formatted layout

**Email Feature:**

- `components/custom/warranty/send-email-button.tsx` - Send email with PDF
- Uses `nodemailer` for SMTP email delivery
- Attaches generated PDF to email
- Only renders if customer email exists
- Environment variables for SMTP configuration

**See:** [EMAIL_CONFIGURATION.md](./EMAIL_CONFIGURATION.md) for setup

### Search & Filtering

**Location:** `components/custom/warranty/table-toolbar.tsx`

**Features:**

- Server-side search with 300ms debounce
- Filter by status, staff, IDT PC flag
- Filter by date range (start/end)
- Clear all filters functionality
- URL-based filter state (shareable links)

**Implementation:**

- Uses URL search params for filter state
- Server actions handle filtering logic
- Debounced search input to reduce server calls
- `lib/hooks/use-debounce.ts` for debouncing

### Pagination

**Location:** `components/custom/warranty/table-pagination.tsx`

**Features:**

- Server-side pagination
- Configurable page size (10, 20, 50, 100)
- Total count display
- Previous/Next navigation
- URL-based pagination state

## Best Practices

### ✅ DO

1. **Keep server actions in `app/*/actions.ts`** - One file per route
2. **All components in root `components/` folder** - Easy to find and import
3. **Pass server actions as props** - Never import them in client components
4. **Use inline `"use server"` wrappers** - In page.tsx for type safety
5. **Create error.tsx and loading.tsx** - For every route
6. **Use Prisma directly** - No service layer abstraction
7. **Use barrel exports (`index.ts`)** - For clean imports
8. **Revalidate paths after mutations** - `revalidatePath()` in server actions
9. **Type definitions close to usage** - `lib/types/` or inline
10. **Parallel data fetching** - `Promise.all()` in page.tsx

### ❌ DON'T

1. **Don't create service layers** - Keep it simple with direct server actions
2. **Don't import server actions in client components** - Always pass as props
3. **Don't put components in `app/` routes** - Use root `components/` folder
4. **Don't forget error handling** - Wrap Prisma calls in try/catch
5. **Don't skip loading states** - Always create loading.tsx
6. **Don't hardcode data** - Fetch from database dynamically
7. **Don't duplicate types** - Import from lib/types or define once
8. **Don't use client state for server data** - Use server components when possible

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** MySQL with Prisma ORM
- **UI:** Shadcn UI + Tailwind CSS
- **State:** Zustand (client-side only)
- **Auth:** Clerk
- **Forms:** React Hook Form
- **Date:** date-fns
- **Icons:** Lucide React

## Key Conventions

1. **Server Components by default** - Only add `"use client"` when needed
2. **Colocation** - Keep related files close (actions.ts, page.tsx, error.tsx, loading.tsx)
3. **Barrel Exports** - Always create `index.ts` in component folders
4. **Type Safety** - Full TypeScript coverage, no `any` types
5. **Error Boundaries** - Use error.tsx for graceful error handling
6. **Loading States** - Use loading.tsx for better UX
7. **Revalidation** - Always revalidate after mutations
8. **Prisma Client** - Single instance, direct usage in server actions

## Adding a New Feature

### Step-by-Step Guide

```typescript
// 1. Create server actions
// app/feature/actions.ts
"use server";
import { PrismaClient } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getItems() {
  try {
    return await prisma.item.findMany();
  } catch (error) {
    throw new Error("Failed to fetch items");
  }
}

export async function createItem(data: CreateData) {
  try {
    const item = await prisma.item.create({ data });
    revalidatePath("/feature");
    return item;
  } catch (error) {
    throw new Error("Failed to create item");
  }
}

// 2. Create page component
// app/feature/page.tsx
import { FeatureWrapper } from "@/components/custom/feature";
import { getItems, createItem } from "./actions";

export default async function FeaturePage() {
  const items = await getItems();

  async function handleCreate(data: CreateData) {
    "use server";
    return await createItem(data);
  }

  return (
    <div className="container mx-auto py-6">
      <FeatureWrapper initialItems={items} onCreate={handleCreate} />
    </div>
  );
}

// 3. Create loading state
// app/feature/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <Skeleton className="h-[400px] w-full" />;
}

// 4. Create error boundary
// app/feature/error.tsx
("use client");
export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// 5. Create components
// components/custom/feature/feature-wrapper.tsx
("use client");
import { useState } from "react";

type Props = {
  initialItems: Item[];
  onCreate: (data: CreateData) => Promise<Item>;
};

export function FeatureWrapper({ initialItems, onCreate }: Props) {
  const [items, setItems] = useState(initialItems);

  async function handleCreate(data: CreateData) {
    const newItem = await onCreate(data);
    setItems([...items, newItem]);
  }

  return <FeatureList items={items} onCreate={handleCreate} />;
}

// 6. Create barrel export
// components/custom/feature/index.ts
export { FeatureWrapper } from "./feature-wrapper";
export { FeatureList } from "./feature-list";
```

## File Naming Conventions

- **Pages:** `page.tsx` (lowercase)
- **Layouts:** `layout.tsx` (lowercase)
- **Loading:** `loading.tsx` (lowercase)
- **Errors:** `error.tsx` (lowercase)
- **Actions:** `actions.ts` (lowercase)
- **Components:** `kebab-case.tsx` (e.g., `branch-management.tsx`)
- **Types:** `kebab-case.ts` (e.g., `warranty.ts`)
- **Hooks:** `use-hook-name.tsx` (e.g., `use-scroll-listener.tsx`)
- **Stores:** `feature-store.ts` (e.g., `warranty-case-store.ts`)

## Documentation

All documentation is in the `docs/` folder:

- `docs/NEXT15_CONVENTIONS.md` - Next.js 15 patterns and best practices
- `ARCHITECTURE.md` - This file (project structure and guidelines)
- `README.md` - Project overview and setup instructions

---

**Last Updated:** October 18, 2025  
**Next.js Version:** 15  
**Pattern:** Direct Server Actions (No Service Layer)
