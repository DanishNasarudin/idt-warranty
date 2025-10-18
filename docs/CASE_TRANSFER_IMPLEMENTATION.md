# Case Transfer Implementation Summary

## Overview

A comprehensive case transfer tracking system has been implemented to allow warranty cases to be passed between branches with full history and statistics tracking.

## What Was Implemented

### 1. Database Schema Changes ✅

#### New Enum: `TransferStatus`

- `PENDING` - Transfer initiated, awaiting acceptance
- `ACCEPTED` - Transfer accepted by destination
- `REJECTED` - Transfer rejected
- `COMPLETED` - Transfer completed successfully

#### Updated Model: `WarrantyCase`

- Added `originBranchId` (nullable) to track the original creating branch
- Added `originBranch` relation
- Added `transfers` relation to `CaseTransfer[]`

#### New Model: `CaseTransfer`

Complete transfer record tracking:

- `caseId` - The case being transferred
- `fromBranchId` / `toBranchId` - Source and destination branches
- `transferredByStaffId` - Staff who initiated the transfer
- `status` - Current transfer status
- `reason` - Reason for transfer
- `notes` - Additional notes
- `transferredAt` / `acceptedAt` / `completedAt` - Timestamps

### 2. Server Actions ✅

#### Transfer Management

**File:** `app/branch/[id]/transfer-actions.ts`

1. **`transferCaseToBranch`**

   - Validates case and branch existence
   - Prevents same-branch transfers
   - Sets origin branch on first transfer
   - Updates case branch and status
   - Creates transfer record and history
   - Broadcasts SSE updates to both branches
   - Returns success/error response

2. **`getCaseTransferHistory`**

   - Returns complete transfer history for a case
   - Includes branch and staff details
   - Ordered chronologically

3. **`getBranchTransfers`**

   - Gets transfers for a specific branch
   - Filters by direction (incoming/outgoing/both)
   - Includes case details

4. **`getBranchTransferStats`**

   - Gets comprehensive statistics
   - Total cases count
   - Sent/received counts
   - Breakdown by destination/source branches
   - Works for single branch or all branches

5. **`getAvailableTransferBranches`**
   - Returns list of branches (excluding current)
   - For populating transfer dialog

### 3. Type Definitions ✅

#### Updated Types

**File:** `lib/types/warranty.ts`

- Extended `WarrantyCaseWithRelations` to include:

  - `originBranchId`
  - `originBranch` (optional)

- New types added:
  - `CaseTransferWithRelations`
  - `BranchTransferStats`
  - `BranchOption`

#### Real-time Types

**File:** `lib/types/realtime.ts`

- Added SSE message types:
  - `case-transferred-out`
  - `case-transferred-in`

### 4. UI Components ✅

#### TransferCaseDialog

**File:** `components/custom/warranty/transfer-case-dialog.tsx`

Interactive dialog for transferring cases:

- Select destination branch dropdown
- Reason text area
- Notes text area
- Loading states
- Success/error handling
- Automatic page refresh on success

#### TransferHistoryDialog

**File:** `components/custom/warranty/transfer-history-dialog.tsx`

View complete transfer history:

- Chronological list of transfers
- Shows source and destination branches
- Displays transfer status badges
- Shows reason and notes
- Shows who transferred and when
- Loading and empty states

#### TransferStatsCard

**File:** `components/custom/warranty/transfer-stats-card.tsx`

Display branch transfer statistics:

- Total cases in branch
- Cases sent out (with breakdown by destination)
- Cases received (with breakdown by source)
- Visual indicators with icons
- Loading state
- Empty state

### 5. UI Integration ✅

#### Updated Expandable Row Details

**File:** `components/custom/warranty/expandable-row-details.tsx`

Added:

- Transfer button in action bar
- History button in action bar
- Transfer indicator badge (shows origin branch)
- Transfer and history dialogs
- Loads available branches on mount

#### Updated Actions

**File:** `app/branch/[id]/actions.ts`

Modified:

- `getWarrantyCasesByBranch` - Now includes `originBranch` relation
- `createWarrantyCase` - Sets `originBranchId` when creating new cases

### 6. Database Migration ✅

**Migration:** `20251018092619_add_case_transfer_tracking`

Applied changes:

- Created `TransferStatus` enum
- Added `originBranchId` column to `WarrantyCase`
- Created `CaseTransfer` table
- Added foreign keys and indexes
- Added `transferredCases` relation to `Staff`

### 7. Documentation ✅

**File:** `docs/CASE_TRANSFER_FEATURE.md`

Comprehensive documentation including:

- Feature overview
- Database schema details
- Server action specifications
- UI component documentation
- Real-time update details
- Usage examples
- Best practices
- Troubleshooting guide

## How It Works

### Transfer Flow

1. **User initiates transfer**

   - Clicks "Transfer" button in case details
   - TransferCaseDialog opens

2. **User selects destination**

   - Selects branch from dropdown
   - Enters reason (optional)
   - Adds notes (optional)
   - Clicks "Transfer Case"

3. **Server processes transfer**

   - Validates case and branches
   - Sets `originBranchId` if first transfer
   - Updates case `branchId` to destination
   - Resets case status to `IN_QUEUE`
   - Creates `CaseTransfer` record
   - Creates `WarrantyHistory` record
   - Broadcasts SSE events

4. **Real-time updates**

   - Source branch notified: case removed
   - Destination branch notified: case added
   - Both pages revalidated

5. **History tracking**
   - Complete audit trail maintained
   - Accessible via "History" button
   - Shows full transfer sequence

### Statistics Tracking

The system automatically tracks:

- **Per Branch:**

  - Total active cases
  - Cases sent out (by destination)
  - Cases received (by source)

- **Use Cases:**
  - Identify busy branches
  - Track workload distribution
  - Analyze transfer patterns
  - Performance metrics

## Visual Indicators

### In the Table

- Cases showing origin branch if transferred:
  `[From Ampang]` badge in expanded details header

### In Transfer History

- Transfer direction arrows: `Ampang → Johor Bahru`
- Status badges: `COMPLETED`, `PENDING`, etc.
- Timestamps and staff information

### In Statistics

- Icons for sent (↗) and received (↙)
- Color-coded counts
- Breakdown by branch

## Example Usage

### Scenario: Customer Relocates

**Initial State:**

- Case WAP2510001 in Ampang branch
- Customer moving to Johor Bahru
- originBranchId: 1 (Ampang)

**Transfer:**

```typescript
await transferCaseToBranch(
  123, // caseId
  1, // fromBranchId (Ampang)
  2, // toBranchId (Johor Bahru)
  5, // transferredByStaffId
  "Customer relocated to JB", // reason
  "Customer will visit JB branch next week" // notes
);
```

**Result:**

- Case now in Johor Bahru branch
- originBranchId still 1 (Ampang)
- Transfer record created
- History updated
- Both branches notified

**Return Transfer:**

```typescript
// After servicing in JB, return to Ampang
await transferCaseToBranch(
  123, // same caseId
  2, // fromBranchId (JB)
  1, // toBranchId (Ampang)
  7, // different staff
  "Service completed, returning to origin", // reason
  "" // no notes
);
```

**Final State:**

- Case back in Ampang branch
- originBranchId still 1 (Ampang)
- 2 transfer records in history
- Complete audit trail

## Integration Points

### Existing Features

✅ Integrates with SSE real-time updates
✅ Uses existing collaborative editing store
✅ Follows warranty case store patterns
✅ Uses shadcn UI components
✅ Respects Next.js 15 conventions

### New Features Added

✅ Transfer tracking system
✅ Transfer statistics
✅ Transfer history
✅ Origin branch tracking

## What's Ready to Use

1. ✅ Database schema and migration
2. ✅ Server actions for transfers
3. ✅ UI components for transfers
4. ✅ Real-time update integration
5. ✅ Transfer statistics
6. ✅ Complete documentation

## What Needs Configuration

### Optional Enhancements

- Pass `staffId` prop from page level to track who initiates transfers
- Add transfer statistics to dashboard page
- Add bulk transfer functionality
- Implement transfer approval workflow

### Quick Start

1. The migration is already applied ✅
2. Components are ready to use ✅
3. Actions are exported and functional ✅
4. Just use the Transfer button in case details!

## File Structure

```
app/branch/[id]/
  ├── transfer-actions.ts          # NEW: Transfer server actions
  └── actions.ts                   # UPDATED: Added originBranch

components/custom/warranty/
  ├── transfer-case-dialog.tsx     # NEW: Transfer UI
  ├── transfer-history-dialog.tsx  # NEW: History UI
  ├── transfer-stats-card.tsx      # NEW: Statistics UI
  └── expandable-row-details.tsx   # UPDATED: Added transfer buttons

lib/types/
  ├── warranty.ts                  # UPDATED: Added transfer types
  └── realtime.ts                  # UPDATED: Added SSE events

prisma/
  ├── schema.prisma                # UPDATED: Added transfer models
  └── migrations/
      └── 20251018092619_add_case_transfer_tracking/  # NEW: Migration

docs/
  └── CASE_TRANSFER_FEATURE.md     # NEW: Complete documentation
```

## Testing Checklist

- [x] Database migration applied
- [x] Transfer actions created
- [x] UI components created
- [x] Real-time updates configured
- [x] Types updated
- [x] Documentation written

## Next Steps

To fully utilize the feature:

1. **Display Statistics** - Add TransferStatsCard to dashboard or settings page
2. **Staff Tracking** - Pass staffId from authentication context
3. **Notifications** - Add email/push notifications for transfers
4. **Reports** - Generate monthly transfer reports
5. **Analytics** - Add charts for transfer trends

## Notes

- All transfers are currently set to `COMPLETED` status immediately
- For approval workflow, use `PENDING` status and implement acceptance logic
- The system maintains complete audit trail through WarrantyHistory
- Real-time updates ensure all users see transfers immediately
- Origin branch is immutable once set (tracks where case was created)
