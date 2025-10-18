# Search Params Default Values Implementation

## Overview

This document describes the implementation of safe search parameter parsing with default values throughout the application, ensuring that missing or invalid search parameters always fall back to sensible defaults.

## Problem Solved

Previously, search parameters were parsed with inline fallback logic (e.g., `parseInt(page || "1")`), which could lead to:

- Inconsistent default values across different pages
- Invalid values causing NaN or unexpected behavior
- No validation of allowed values for string parameters
- Code duplication for parameter parsing

## Solution

Created a centralized utility module for parsing search parameters with validation and default values.

### New Utility File

**Location:** `/lib/utils/search-params.ts`

#### Key Functions

1. **`parseIntSafe(value, defaultValue, min)`**

   - Safely parses integers with validation
   - Ensures results are always valid positive integers
   - Falls back to default if parsing fails or value is below minimum

2. **`parseStringSafe(value, allowedValues, defaultValue)`**

   - Validates strings against an allowed list
   - Returns default if value is not in allowed list
   - Type-safe with generic constraints

3. **`parseWarrantyCaseFilters(searchParams)`**

   - Comprehensive parsing for warranty case filters
   - Validates all filter parameters
   - Returns `WarrantyCaseFilters` with guaranteed valid values

4. **`parsePaginationParams(searchParams, defaultPage, defaultLimit)`**

   - Generic pagination parameter parser
   - Configurable defaults
   - Ensures positive integers

5. **`parseDateRangePreset(value)`**
   - Parses date range presets
   - Validates against allowed preset values

## Implementation Details

### Default Values

| Parameter       | Default Value             | Min Value | Max Value | Notes                      |
| --------------- | ------------------------- | --------- | --------- | -------------------------- |
| `page`          | 1                         | 1         | -         | 1-indexed pagination       |
| `limit`         | 20 (branch), 50 (history) | 1         | 200       | Configurable per context   |
| `search`        | ""                        | -         | -         | Empty string for no search |
| `searchField`   | "all"                     | -         | -         | Search across all fields   |
| `sortBy`        | "createdAt"               | -         | -         | Sort by creation date      |
| `sortDirection` | "desc"                    | -         | -         | Newest first               |
| `preset`        | "all"                     | -         | -         | Show all dates             |

### Files Updated

#### Server Components (Pages)

1. **`/app/(warranty)/branch/[id]/page.tsx`**

   ```typescript
   // Before
   const filters: WarrantyCaseFilters = {
     page: parseInt(resolvedSearchParams.page || "1"),
     limit: parseInt(resolvedSearchParams.limit || "20"),
     // ... more manual parsing
   };

   // After
   const filters: WarrantyCaseFilters =
     parseWarrantyCaseFilters(resolvedSearchParams);
   ```

2. **`/app/(warranty)/branch/[id]/history/page.tsx`**

   ```typescript
   // Before
   const page = parseInt(pageParam || "1");

   // After
   const page = parseIntSafe(pageParam, 1, 1);
   ```

3. **`/app/(warranty)/dashboard/page.tsx`**

   ```typescript
   // Before
   preset: (params.preset as DateRangePreset) || "all";

   // After
   preset: parseDateRangePreset(params.preset);
   ```

#### Server Actions

**`/app/(warranty)/branch/[id]/actions.ts`**

1. **Enhanced `getWarrantyCasesByBranch()`** with pagination:

   ```typescript
   // Now returns both cases and total count
   export async function getWarrantyCasesByBranch(
     branchId: number,
     filters?: WarrantyCaseFilters
   ): Promise<{
     cases: WarrantyCaseWithRelations[];
     totalCount: number;
   }> {
     // Calculate pagination
     const page = filters?.page || 1;
     const limit = filters?.limit || 20;
     const skip = (page - 1) * limit;

     // Get total count for pagination
     const totalCount = await prisma.warrantyCase.count({
       where: whereClause,
     });

     // Apply skip and take to query
     const cases = await prisma.warrantyCase.findMany({
       // ... other options
       skip,
       take: limit,
     });

     return { cases, totalCount };
   }
   ```

   This ensures:

   - Pagination is actually applied to database queries
   - Total count is returned for accurate pagination UI
   - Skip and take are calculated from page and limit

2. **Enhanced `getWarrantyHistoryByBranch()`** with parameter validation:

   ```typescript
   // Validate and sanitize inputs
   const validPage = Math.max(1, Math.floor(page));
   const validPageSize = Math.max(1, Math.min(200, Math.floor(pageSize)));
   ```

   This ensures:

   - Page is always >= 1
   - PageSize is between 1 and 200
   - Non-integer values are floored to integers

#### Client Components

1. **`/components/custom/dashboard/dashboard-date-filter.tsx`**

   - Updated to use `parseDateRangePreset()` for consistency
   - Ensures "all" is the default preset

2. **`/components/custom/warranty/table-pagination.tsx`**

   - Now receives accurate `totalCount` from server
   - Properly calculates total pages based on actual database count
   - No changes needed as it receives validated `filters` prop

3. **`/components/custom/warranty/table-toolbar.tsx`**

   - Already properly handles defaults via server-provided filters
   - No changes needed as it receives validated `filters` prop

4. **`/components/custom/warranty/warranty-case-table-wrapper.tsx`**
   - Updated to receive `totalCount` prop
   - Passes `totalCount` to `TablePagination` component
   - Ensures pagination UI displays correct total count

## Benefits

1. **Consistency**: All pages use the same default values
2. **Type Safety**: Validated against allowed values with TypeScript
3. **Robustness**: Handles missing, invalid, or malicious parameter values
4. **Maintainability**: Centralized logic, easy to update defaults
5. **Reusability**: Utility functions can be used across the application
6. **Security**: Prevents injection of invalid values (e.g., negative page numbers, excessive limits)
7. **Performance**: Pagination is actually applied at the database level, not just in UI
8. **Accuracy**: Total count reflects actual database records, not just current page

## Usage Examples

### Parsing Warranty Filters (Complete)

```typescript
import { parseWarrantyCaseFilters } from "@/lib/utils/search-params";

const filters = parseWarrantyCaseFilters({
  search: "John",
  searchField: "customerName",
  page: "2",
  limit: "50",
});
// Result: All validated with proper types
```

### Parsing Pagination Only

```typescript
import { parsePaginationParams } from "@/lib/utils/search-params";

const { page, limit } = parsePaginationParams(
  { page: "3", limit: "100" },
  1, // default page
  50 // default limit
);
```

### Parsing Individual Parameters

```typescript
import { parseIntSafe, parseStringSafe } from "@/lib/utils/search-params";

const page = parseIntSafe(searchParams.page, 1, 1);
const sortDirection = parseStringSafe(
  searchParams.sort,
  ["asc", "desc"],
  "desc"
);
```

## Testing Considerations

When testing pages with search params:

1. Test with missing parameters - should use defaults
2. Test with invalid values (negative, NaN, out-of-range)
3. Test with string values not in allowed list
4. Test boundary values (0, 1, very large numbers)

## Future Enhancements

Potential improvements:

- Add maximum page validation (don't exceed total pages)
- Add logging for invalid parameter attempts
- Create React hooks for client-side parameter parsing
- Add zod schema validation for more complex parameter structures

## Related Documentation

- [Next.js 15 Conventions](./NEXT15_CONVENTIONS.md) - Server/client component patterns
- [Warranty Case Types](./lib/types/search-params.ts) - Parameter type definitions
