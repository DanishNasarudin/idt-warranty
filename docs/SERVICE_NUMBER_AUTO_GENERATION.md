# Warranty Service Number Auto-Generation Implementation

## Overview

Implemented automatic service number generation for warranty cases with the format: **W[CODE][YYMM][###]**

### Examples

- `WSA2510001` - First case for SA branch in October 2025
- `WAP2510001` - First case for AP branch in October 2025
- `WSA2510002` - Second case for SA branch in October 2025
- `WSA2511001` - First case for SA branch in November 2025

## Changes Made

### 1. Branch Management Enhancement

**File:** `/components/custom/settings/branch-management.tsx`

- Added a live preview of how the branch code will affect service numbers
- Shows format example when creating or editing a branch
- Helper function `generateServiceNoPreview()` displays: `W[CODE]YYMM###`

**User Experience:**

- When creating branch "SA", user sees preview: `WSA2510001`
- When creating branch "AP", user sees preview: `WAP2510001`
- Preview updates in real-time as user types the branch code

### 2. Service Number Utilities

**File:** `/lib/utils/service-number.ts` (NEW)

Created comprehensive utility functions:

#### `generateServiceNumber(branchCode, sequenceNumber, date?)`

Generates formatted service number from components.

#### `parseServiceNumber(serviceNo)`

Parses service number to extract branch code, year, month, and sequence.

#### `getCurrentMonthKey(date?)`

Returns YYMM format for current or specified date.

#### `isCurrentMonth(serviceNo, date?)`

Checks if a service number belongs to current month.

#### `getNextSequenceNumber(existingServiceNumbers, branchCode, date?)`

Determines the next sequence number for a branch in current month.

- Filters by branch code and current month
- Returns 1 if no cases exist for current month
- Returns max sequence + 1 otherwise

### 3. Server Action for Auto-Generation

**File:** `/app/branch/[id]/actions.ts`

Added `generateNextServiceNumber(branchId)` function:

1. Fetches branch code from database
2. Retrieves all existing service numbers for the branch
3. Calculates next sequence number for current month
4. Returns formatted service number

### 4. Warranty Case Creation Update

**File:** `/app/branch/[id]/actions.ts`

Modified `createWarrantyCase()` function:

- **Removed:** `serviceNo` from input parameters
- **Added:** Automatic generation via `generateNextServiceNumber()`
- Service number is now generated server-side before creating the case
- No manual input required

### 5. Create Warranty Case Dialog Update

**File:** `/components/custom/warranty/create-warranty-case-dialog.tsx`

**Removed:**

- Service number input field
- Service number validation
- `serviceNo` from `CreateWarrantyCaseFormData` type

**Added:**

- Note in dialog description: "The service number will be generated automatically"

**User Experience:**

- Service number field no longer visible
- Users only fill in customer details
- Service number automatically generated in backend

## How It Works

### When Creating a Warranty Case:

1. **User Action:** Opens create case dialog and fills customer information
2. **Submission:** User clicks "Create Case"
3. **Backend Process:**
   - Server action `createWarrantyCase()` is called
   - `generateNextServiceNumber(branchId)` is invoked
   - System fetches branch code (e.g., "SA")
   - System queries all existing service numbers for this branch
   - System filters for current month (e.g., October 2025 → "2510")
   - System finds highest sequence number (e.g., 5)
   - System generates next number: `WSA2510006`
4. **Database:** Warranty case saved with auto-generated service number
5. **User Feedback:** Success message shown

### Month Rollover:

- When a new month starts, sequence resets to 001
- Example: Last case in October is `WSA2510050`
- First case in November becomes `WSA2511001`

### Multi-Branch Support:

- Each branch maintains its own sequence counter
- SA branch: `WSA2510001`, `WSA2510002`, ...
- AP branch: `WAP2510001`, `WAP2510002`, ...
- Sequences are independent per branch

## Benefits

1. **Consistency:** All service numbers follow the same format
2. **No Duplicates:** Backend ensures unique sequential numbering
3. **Automatic:** No manual input reduces errors
4. **Traceable:** Format includes branch, date, and sequence
5. **User-Friendly:** Less fields to fill in create dialog
6. **Month-Based:** Easy to identify case creation period

## Technical Notes

- Service numbers are generated at the moment of case creation
- Format is strictly enforced: `W` + `BranchCode` + `YYMM` + `###`
- Sequence numbers are zero-padded to 3 digits (001-999)
- System handles sequence overflow gracefully (can extend beyond 999)
- Branch code is always uppercase in service numbers
- Uses current server time for YYMM generation

## Future Considerations

- If more than 999 cases per branch per month are expected, consider extending sequence to 4 digits
- Could add admin override for custom service numbers if needed
- Could implement service number preview before final creation
- Could add bulk import with automatic number generation
