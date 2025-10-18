# Server-Side Search and Filter Implementation

## Summary

Successfully migrated the warranty case search, filter, sort, and pagination logic from client-side (Zustand store) to server-side using Next.js 15 search params conventions. Implemented debounced search to prevent server overload while maintaining responsive UI.

## Changes Made

### 1. Created Search Params Types

**File:** `/lib/types/search-params.ts`

- Defined `SearchField`, `SortField`, `SortDirection` types
- Created `WarrantyCaseFilters` type for type-safe search params

### 2. Updated Server Actions

**File:** `/app/branch/[id]/actions.ts`

- Modified `getWarrantyCasesByBranch()` to accept optional `WarrantyCaseFilters` parameter
- Implemented Prisma query building with:
  - Search across specific fields or all fields
  - Dynamic sorting based on sort field and direction
  - Proper WHERE and ORDER BY clauses

### 3. Updated Page Component

**File:** `/app/branch/[id]/page.tsx`

- Added `searchParams` prop handling (Next.js 15 async pattern)
- Parse search params with defaults
- Pass filters to `getWarrantyCasesByBranch()` for server-side filtering
- Pass filters to `WarrantyCaseTableWrapper` component

### 4. Converted TableToolbar to Use URL Search Params

**File:** `/components/custom/warranty/table-toolbar.tsx`

- Removed Zustand store dependency
- Now uses `useRouter`, `useSearchParams`, and `usePathname` hooks
- Updates URL search params on filter changes
- **Implemented debounced search (500ms delay)** to prevent server overload
- Uses local state (`searchValue`) for immediate UI feedback (optimistic updates)
- Search input never gets disabled, providing better UX
- Dropdown/button changes use `startTransition` for immediate updates
- Automatically resets to page 1 when filters change
- Cleanup timer on component unmount

### 5. Converted TablePagination to Use URL Search Params

**File:** `/components/custom/warranty/table-pagination.tsx`

- Removed Zustand store dependency
- Receives `filters` and `totalCases` as props
- Updates URL search params for page and limit changes
- Uses `useTransition` for pending states

### 6. Updated TableWrapper Component

**File:** `/components/custom/warranty/warranty-case-table-wrapper.tsx`

- Accepts `filters` prop and passes to child components
- Passes `totalCases` to pagination component

### 7. Simplified Zustand Store

**File:** `/lib/stores/warranty-case-store.ts`

- Removed all search, filter, sort, and pagination state
- Removed computed getters (`getFilteredCases`, `getSortedCases`, `getPaginatedCases`, `getTotalPages`)
- Now only manages UI state:
  - `expandedRows` - tracks which table rows are expanded
  - `editingCell` - tracks which cell is being edited
  - `cases` and `staffOptions` - for optimistic updates

### 8. Updated Table Component

**File:** `/components/custom/warranty/warranty-case-table.tsx`

- Removed `getPaginatedCases()` call
- Now displays `initialCases` directly (already filtered/sorted/paginated from server)

### 9. Created Debounce Hooks

**File:** `/lib/hooks/use-debounce.ts`

- Created reusable `useDebounce` hook for debouncing values
- Created `useDebouncedCallback` hook for debouncing callback functions
- Both hooks include proper cleanup on unmount

## Benefits

1. **Better Performance**: Filtering and sorting happens on the database level using Prisma
2. **SEO Friendly**: Search params are in the URL, making pages shareable and bookmarkable
3. **Server-Side Rendering**: Data is filtered before being sent to the client
4. **Next.js 15 Conventions**: Follows modern Next.js patterns with async search params
5. **Cleaner Architecture**: Clear separation between server-side data logic and client-side UI state
6. **Type Safety**: Full TypeScript support with proper types for all search params
7. **Optimized Server Calls**: Debounced search (500ms) prevents excessive server requests
8. **Responsive UI**: Optimistic updates ensure inputs never freeze during typing
9. **Better UX**: Search input remains enabled while typing, dropdowns use transitions for feedback

## How It Works

1. **User types in search box**

   - Local state updates immediately (optimistic UI)
   - Input remains enabled and responsive
   - Debounce timer starts (500ms)

2. **After 500ms of no typing**

   - URL search params update
   - Next.js re-renders the page with new search params
   - Server parses search params and builds Prisma query
   - Database returns filtered/sorted results
   - Page renders with new data

3. **User changes dropdown/button filters**

   - Uses `startTransition` for immediate update
   - URL search params update right away
   - Rest of the flow is the same as above

4. **Optimization Benefits**
   - Typing "hello" triggers only 1 server call (after user stops typing)
   - Without debounce: would trigger 5 server calls (one per character)
   - Reduces server load by ~80-90% for typical search queries

## Search Params Schema

- `search` - Search query string
- `searchField` - Field to search in (`all`, `serviceNo`, `customerName`, `customerContact`, `customerEmail`)
- `sortBy` - Field to sort by (`createdAt`, `updatedAt`, `serviceNo`, `customerName`, `status`)
- `sortDirection` - Sort direction (`asc`, `desc`)
- `page` - Current page number
- `limit` - Items per page (10, 20, 50, 100)

## Example URLs

- `/branch/1?search=john&searchField=customerName&sortBy=createdAt&sortDirection=desc&page=1&limit=20`
- `/branch/1?search=W&searchField=serviceNo&page=2&limit=50`
