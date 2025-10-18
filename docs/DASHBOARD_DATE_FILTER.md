# Dashboard Date Range Filter - Implementation Summary

## Overview

Added a comprehensive date range filtering system to the dashboard that filters all warranty case data based on the `createdAt` field. The implementation includes preset options and custom date range selection.

## Features Implemented

### 1. **Filter Options**

- **All Time** (default): Shows all data without date restrictions
- **Last 7 Days**: Shows data from the past week
- **Last 30 Days**: Shows data from the past month
- **Custom Range**: Allows users to select a specific date range using a calendar picker

### 2. **Server-Side Logic**

All filtering is performed on the server side in the database queries for optimal performance.

#### Modified Functions (in `dashboard-actions.ts`):

- `getStaffServiceMetrics()` - Filters COMPLETED cases by createdAt
- `getBranchStatusCounts()` - Filters cases by createdAt
- `getAllBranchTransferStats()` - Filters transfers by createdAt
- `getStaffPerformanceByBranch()` - Filters COMPLETED cases by createdAt
- `getBranchCaseSummary()` - Filters cases by createdAt
- `getDashboardStats()` - Main function that accepts DateRangeFilter parameter

### 3. **Type Safety**

Created new types in `lib/types/search-params.ts`:

```typescript
type DateRangePreset = "all" | "lastWeek" | "lastMonth" | "custom";
type DateRangeFilter = {
  preset: DateRangePreset;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
};
```

### 4. **Date Range Calculation**

Helper function `getDateRange()` converts filter presets to actual date ranges:

- Handles timezone correctly by setting hours appropriately
- Returns null for "all" preset (no filtering)
- Calculates relative dates for "lastWeek" and "lastMonth"
- Parses custom dates from ISO strings

### 5. **UI Component**

Created `DashboardDateFilter` component that:

- Shows a dropdown for preset selection
- Displays a calendar picker when "Custom Range" is selected
- Uses URL search params for state persistence (shareable URLs)
- Updates automatically without full page reload

### 6. **URL Integration**

The filter state is stored in URL search parameters:

- `preset`: The selected preset option
- `startDate`: Custom start date (ISO format)
- `endDate`: Custom end date (ISO format)

Example URLs:

- All time: `/dashboard?preset=all`
- Last week: `/dashboard?preset=lastWeek`
- Custom: `/dashboard?preset=custom&startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z`

## Files Modified/Created

### Created:

1. `components/custom/dashboard/dashboard-date-filter.tsx` - Filter UI component

### Modified:

1. `lib/types/search-params.ts` - Added date filter types and utilities
2. `app/(warranty)/dashboard/dashboard-actions.ts` - Updated all functions to accept and use date filters
3. `app/(warranty)/dashboard/page.tsx` - Added searchParams handling and filter component

## Usage

The dashboard automatically defaults to showing all data. Users can:

1. Select a preset from the dropdown (All Time, Last 7 Days, Last 30 Days)
2. Choose "Custom Range" to pick specific start and end dates
3. Share filtered views using the URL

## Technical Notes

- All date filtering uses the `createdAt` field from the `WarrantyCase` and `CaseTransfer` models
- Date ranges are inclusive (includes both start and end dates)
- Custom date ranges set start time to 00:00:00 and end time to 23:59:59
- The filter persists across page refreshes via URL params
- All database queries are optimized with proper indexing on `createdAt`
