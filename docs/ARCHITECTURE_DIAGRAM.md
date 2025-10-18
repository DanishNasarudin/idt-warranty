# Component Architecture

## Component Hierarchy

```
app/branch/[id]/page.tsx (Server Component)
│
├── Data Fetching
│   ├── getWarrantyCasesByBranch(branchId)
│   └── getStaffByBranch(branchId)
│
└── WarrantyCaseTableWrapper (Client Component)
    │
    └── WarrantyCaseTable (Client Component)
        │
        ├── Zustand Store Integration
        │   ├── cases state
        │   ├── staffOptions state
        │   ├── expandedRows state
        │   └── editingCell state
        │
        ├── Table (Shadcn UI)
        │   │
        │   ├── TableHeader
        │   │   └── 9 TableHead cells
        │   │
        │   └── TableBody
        │       │
        │       └── For each case:
        │           │
        │           ├── TableRow (Main Row)
        │           │   ├── TableCell (Expand Button)
        │           │   ├── TableCell (Date - formatted)
        │           │   ├── TableCell → EditableTextCell (Service No)
        │           │   ├── TableCell → DropdownCell (IDT PC)
        │           │   ├── TableCell → DropdownCell (Received By)
        │           │   ├── TableCell → DropdownCell (Serviced By)
        │           │   ├── TableCell → EditableTextCell (Name)
        │           │   ├── TableCell → DropdownCell (Status)
        │           │   └── TableCell → EditableTextCell (Contact)
        │           │
        │           └── TableRow (Expanded Row - conditional)
        │               └── TableCell (colspan=9)
        │                   └── ExpandableRowDetails
        │                       └── 11 Input/Textarea fields
        │
        └── Update Flow
            ├── handleUpdate (single field)
            └── handleMultiFieldUpdate (multiple fields)
                └── onUpdateCase (Server Action)
                    └── updateWarrantyCase (actions.ts)
                        └── Prisma.warrantyCase.update()
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVER COMPONENT                          │
│  app/branch/[id]/page.tsx                                   │
│                                                              │
│  1. Fetch initial data                                      │
│     ├── getWarrantyCasesByBranch()                         │
│     └── getStaffByBranch()                                 │
│                                                              │
│  2. Pass to client component                                │
│     └── initialCases, initialStaff, onUpdateCase           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT COMPONENT                           │
│  WarrantyCaseTableWrapper                                   │
│                                                              │
│  • Error handling with toast                                │
│  • Wraps main table                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  WarrantyCaseTable                                          │
│                                                              │
│  3. Initialize Zustand store                                │
│     ├── setCases(initialCases)                             │
│     └── setStaffOptions(initialStaff)                      │
│                                                              │
│  4. Render table with cells                                 │
│                                                              │
│  5. User interaction                                        │
│     ├── Click cell → setEditingCell()                      │
│     ├── Change value → Local state update                  │
│     └── Save (blur/enter) → handleUpdate()                 │
│                                                              │
│  6. Optimistic update                                       │
│     └── updateCase() in Zustand store                      │
│                                                              │
│  7. Call server action                                      │
│     └── await onUpdateCase(caseId, updates)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER ACTION                             │
│  app/branch/[id]/actions.ts                                 │
│                                                              │
│  8. Update database                                         │
│     ├── prisma.warrantyCase.update()                       │
│     ├── revalidatePath()                                   │
│     └── [TODO] Emit socket.io event                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              FUTURE: SOCKET.IO FLOW                          │
│                                                              │
│  Server emits → All clients receive                         │
│                      ↓                                      │
│              handleRemoteUpdate()                            │
│                      ↓                                      │
│         Update Zustand store                                 │
│                      ↓                                      │
│         UI reflects changes                                 │
└─────────────────────────────────────────────────────────────┘
```

## State Management (Zustand)

```typescript
WarrantyCaseStore
├── State
│   ├── cases: WarrantyCaseWithRelations[]
│   ├── staffOptions: StaffOption[]
│   ├── expandedRows: Set<number>
│   └── editingCell: { caseId, field } | null
│
└── Actions
    ├── setCases(cases)
    ├── setStaffOptions(staff)
    ├── updateCase(caseId, updates)      // Optimistic update
    ├── toggleRowExpansion(caseId)
    ├── setEditingCell(cell)
    └── handleRemoteUpdate(caseId, updates) // For Socket.io
```

## Cell Components

### EditableTextCell

```
User clicks cell
    ↓
onEditStart() → setEditingCell()
    ↓
Input field shows with focus
    ↓
User types
    ↓
Press Enter or blur
    ↓
onSave(newValue)
    ↓
onEditEnd() → setEditingCell(null)
```

### DropdownCell

```
User clicks cell
    ↓
Dropdown menu opens
    ↓
User selects option (or clicks X to clear)
    ↓
onSelect(value)
    ↓
Menu closes
```

### ExpandableRowDetails

```
User clicks expand button
    ↓
toggleRowExpansion(caseId)
    ↓
Row expands showing all fields
    ↓
User edits field
    ↓
On blur → onUpdate(updates)
    ↓
Server action called
```

## File Organization

```
app/branch/[id]/
├── page.tsx           # Server Component - Entry point
├── actions.ts         # Server Actions - CRUD operations
├── loading.tsx        # Loading UI
├── error.tsx          # Error Boundary
└── README.md          # Component documentation

components/custom/warranty/
├── warranty-case-table-wrapper.tsx  # Error handling wrapper
├── warranty-case-table.tsx          # Main table logic
├── editable-text-cell.tsx           # Text editing component
├── dropdown-cell.tsx                # Dropdown component
├── expandable-row-details.tsx       # Accordion details
└── index.ts                         # Exports

lib/
├── stores/
│   └── warranty-case-store.ts       # Zustand store
└── types/
    └── warranty.ts                  # TypeScript types
```

## Technology Stack

```
Frontend
├── React 19
├── Next.js 15 (App Router)
├── TypeScript
├── Tailwind CSS
└── Zustand (State Management)

UI Components
├── Shadcn UI
│   ├── Table
│   ├── Button
│   ├── Input
│   ├── Dropdown Menu
│   ├── Accordion
│   ├── Label
│   └── Skeleton
└── Lucide React (Icons)

Backend
├── Next.js Server Actions
├── Prisma ORM
└── MySQL Database

Utilities
├── date-fns (Date formatting)
├── clsx (Class names)
└── sonner (Toast notifications)
```

## Performance Considerations

```
Server Component Benefits
├── Data fetching on server
├── Reduced client bundle size
├── Faster initial page load
└── Better SEO

Optimistic Updates
├── Instant UI feedback
├── Better perceived performance
├── Revert on error
└── Consistent with modern UX patterns

Code Splitting
├── Client components loaded separately
├── Lazy loading for expanded rows
└── Dynamic imports where possible
```
