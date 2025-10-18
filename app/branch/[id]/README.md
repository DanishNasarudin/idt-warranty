# Warranty Case Management Table

## Overview

A comprehensive, Google Sheets-like data manipulation interface for warranty cases built with Next.js 15, React 19, and clean architecture principles.

## Features

### ✅ Implemented

1. **Editable Cells** - Click-to-edit functionality for:

   - Service No
   - Customer Name
   - Customer Contact

2. **Dropdown Cells** - Selectable options with ability to clear/null:

   - IDT PC? (Yes/No/Not set)
   - Received By (Staff selection)
   - Serviced By (Staff selection)
   - Status (IN_QUEUE, IN_PROGRESS, WAITING_FOR, COMPLETED)

3. **Expandable Rows** - Accordion-style expansion showing additional fields:

   - Customer Email
   - Purchase Date
   - Address
   - Invoice
   - Received Items
   - PIN
   - Issues
   - Solutions
   - Status Description
   - Remarks
   - Cost
   - Locker

4. **Auto-save Ready** - Architecture prepared for auto-save mechanism
5. **Socket.io Ready** - Zustand store prepared for real-time updates
6. **Server Components** - Following Next.js conventions with server-side data fetching
7. **Clean Architecture** - Separation of concerns for scalability

## Architecture

### File Structure

```
app/branch/[id]/
├── page.tsx                 # Server component (data fetching)
├── actions.ts               # Server actions (CRUD operations)

components/custom/warranty/
├── warranty-case-table.tsx           # Main table component (client)
├── warranty-case-table-wrapper.tsx   # Error handling wrapper (client)
├── editable-text-cell.tsx            # Text editing cell component
├── dropdown-cell.tsx                 # Dropdown selection cell component
├── expandable-row-details.tsx        # Accordion details component
└── index.ts                          # Barrel export

lib/
├── stores/
│   └── warranty-case-store.ts       # Zustand state management
└── types/
    └── warranty.ts                   # TypeScript types
```

### Component Flow

1. **Server Component** (`page.tsx`)

   - Fetches initial data from database
   - Passes data to client components
   - Provides server action for updates

2. **Client Wrapper** (`warranty-case-table-wrapper.tsx`)

   - Handles errors with toast notifications
   - Wraps main table component

3. **Main Table** (`warranty-case-table.tsx`)

   - Manages table rendering
   - Coordinates cell editing
   - Handles optimistic updates
   - Calls server actions for persistence

4. **Zustand Store** (`warranty-case-store.ts`)
   - Centralized state management
   - Tracks expanded rows
   - Manages editing state
   - Prepared for socket.io real-time updates

## State Management

### Zustand Store

```typescript
{
  cases: WarrantyCaseWithRelations[]      // All warranty cases
  staffOptions: StaffOption[]              // Available staff members
  expandedRows: Set<number>                // IDs of expanded rows
  editingCell: { caseId, field } | null   // Currently editing cell
}
```

### Actions

- `setCases()` - Initialize/update cases
- `setStaffOptions()` - Initialize staff options
- `updateCase()` - Optimistic update for single case
- `toggleRowExpansion()` - Expand/collapse row details
- `setEditingCell()` - Track which cell is being edited
- `handleRemoteUpdate()` - For socket.io updates (prepared)

## Future Enhancements

### Socket.io Integration

The architecture is prepared for real-time collaboration:

1. **Server Setup** (TODO)

   ```typescript
   // In actions.ts
   import { io } from 'socket.io-client';

   export async function updateWarrantyCase(...) {
     // ... existing update logic

     // Emit to all connected clients
     socketServer.to(`branch-${branchId}`).emit('caseUpdated', {
       caseId,
       updates
     });
   }
   ```

2. **Client Setup** (TODO)
   ```typescript
   // In warranty-case-table.tsx
   useEffect(() => {
     const socket = io();

     socket.on("caseUpdated", ({ caseId, updates }) => {
       handleRemoteUpdate(caseId, updates);
     });

     return () => socket.disconnect();
   }, []);
   ```

### Auto-save Enhancement

Currently implements immediate save on blur. Can be enhanced with:

- Debounced auto-save
- Visual indicator for unsaved changes
- Offline queue for failed saves
- Conflict resolution for concurrent edits

## Usage

### Accessing the Page

```
/branch/[branchId]
```

Example: `/branch/1` for branch ID 1

### Editing Data

1. **Text Fields**: Click cell → type → press Enter or click outside
2. **Dropdowns**: Click cell → select option (or click X to clear)
3. **Row Details**: Click expand button (▶) → edit fields → changes auto-save on blur

### Adding New Features

1. **Add Column**: Update `WarrantyCaseTable` component
2. **Add Field**: Update `ExpandableRowDetails` component
3. **Add Validation**: Implement in server actions
4. **Add Permissions**: Check user roles in server actions

## Technologies

- **Next.js 15** - App Router, Server Components, Server Actions
- **React 19** - Latest React features
- **Prisma** - Type-safe database access
- **Zustand** - Lightweight state management
- **Shadcn UI** - Accessible component library
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first styling

## Notes

- All dates are formatted using `date-fns`
- Optimistic updates provide instant feedback
- Server revalidation ensures data consistency
- Clean separation allows easy testing and scaling
