# Case Transfer Feature Documentation

## Overview

The Case Transfer feature allows warranty cases to be transferred between branches. This is useful when:

- A customer relocates to a different area
- Specialized equipment or expertise is required at another branch
- Workload balancing between branches
- Cases need to be returned to the original branch after servicing

## Features

### 1. Transfer Tracking

- **Origin Branch**: Every case tracks the original branch where it was created
- **Transfer History**: Complete history of all transfers for each case
- **Transfer Metadata**: Reason and notes for each transfer
- **Automatic Status Reset**: Cases are set to `IN_QUEUE` status when transferred

### 2. Database Schema

#### New Fields in `WarrantyCase`

```prisma
originBranchId  Int?          // Tracks the original branch
originBranch    Branch?       // Relation to origin branch
```

#### New `CaseTransfer` Model

```prisma
model CaseTransfer {
  id                   Int            @id @default(autoincrement())
  caseId               Int
  fromBranchId         Int
  toBranchId           Int
  transferredByStaffId Int?
  status               TransferStatus @default(PENDING)
  reason               String?
  notes                String?
  transferredAt        DateTime       @default(now())
  acceptedAt           DateTime?
  completedAt          DateTime?
}
```

#### New `TransferStatus` Enum

```prisma
enum TransferStatus {
  PENDING
  ACCEPTED
  REJECTED
  COMPLETED
}
```

## Server Actions

### `transferCaseToBranch`

Transfers a case from one branch to another.

```typescript
await transferCaseToBranch(
  caseId: number,
  fromBranchId: number,
  toBranchId: number,
  transferredByStaffId?: number,
  reason?: string,
  notes?: string
)
```

**Features:**

- Validates case existence and ownership
- Prevents transfer to the same branch
- Sets origin branch on first transfer
- Creates transfer record and history entry
- Broadcasts real-time updates via SSE
- Revalidates both branch pages

### `getCaseTransferHistory`

Gets complete transfer history for a case.

```typescript
const history = await getCaseTransferHistory(caseId: number)
```

### `getBranchTransfers`

Gets all transfers for a branch (incoming/outgoing/both).

```typescript
const transfers = await getBranchTransfers(
  branchId: number,
  direction?: "incoming" | "outgoing"
)
```

### `getBranchTransferStats`

Gets transfer statistics for a branch or all branches.

```typescript
const stats = await getBranchTransferStats(branchId?: number)
```

Returns:

- Total cases in branch
- Number of cases sent out
- Number of cases received
- Breakdown by source/destination branches

### `getAvailableTransferBranches`

Gets list of branches available for transfer (excludes current branch).

```typescript
const branches = await getAvailableTransferBranches(currentBranchId: number)
```

## UI Components

### 1. TransferCaseDialog

Modal dialog for initiating case transfers.

**Props:**

- `caseId`: ID of the case to transfer
- `currentBranchId`: Current branch ID
- `currentBranchName`: Current branch name
- `serviceNo`: Service number for display
- `availableBranches`: List of target branches
- `staffId`: (Optional) ID of staff initiating transfer
- `onTransferComplete`: Callback after successful transfer

**Features:**

- Select destination branch
- Enter transfer reason
- Add additional notes
- Real-time validation
- Success/error notifications

### 2. TransferHistoryDialog

Modal dialog displaying transfer history for a case.

**Props:**

- `caseId`: ID of the case
- `serviceNo`: Service number for display

**Features:**

- Chronological transfer list
- Shows from/to branches
- Display transfer status
- Shows transfer reason and notes
- Shows who transferred and when

### 3. TransferStatsCard

Card component displaying branch transfer statistics.

**Props:**

- `branchId`: ID of the branch
- `branchName`: Name of the branch

**Features:**

- Total cases in branch
- Cases sent out count
- Cases received count
- Breakdown by destination branches
- Breakdown by source branches
- Visual indicators for sent/received

## Real-time Updates

The transfer system integrates with the existing SSE (Server-Sent Events) infrastructure:

### New SSE Message Types

#### `case-transferred-out`

Notifies the source branch when a case is transferred away.

```typescript
{
  type: "case-transferred-out",
  data: {
    caseId: number,
    toBranchId: number,
    transferId: number
  }
}
```

#### `case-transferred-in`

Notifies the destination branch when a case is transferred in.

```typescript
{
  type: "case-transferred-in",
  data: {
    caseId: number,
    fromBranchId: number,
    transferId: number
  }
}
```

## UI Integration

### Warranty Case Table

#### Transfer Indicator Badge

Cases that were transferred from another branch show a badge:

```tsx
{
  case_.originBranchId && case_.originBranchId !== case_.branchId && (
    <Badge variant="secondary">
      <ArrowRightLeft className="h-3 w-3" />
      From {case_.originBranch.name}
    </Badge>
  );
}
```

#### Action Buttons

In the expanded row details, two new buttons are available:

1. **Transfer Button**: Opens the transfer dialog
2. **History Button**: Opens the transfer history dialog

## Usage Examples

### Example 1: Transfer a Case

```typescript
// User clicks "Transfer" button in the UI
// TransferCaseDialog opens
// User selects branch and enters reason
// On submit:

const result = await transferCaseToBranch(
  123, // caseId
  1, // fromBranchId (Ampang)
  2, // toBranchId (Johor Bahru)
  5, // transferredByStaffId
  "Customer relocated", // reason
  "Please handle urgently" // notes
);

if (result.success) {
  // Case is now in JB branch
  // Origin branch is set to Ampang (if first transfer)
  // Transfer record created
  // Both branches notified via SSE
}
```

### Example 2: View Transfer Statistics

```tsx
import { TransferStatsCard } from "@/components/custom/warranty/transfer-stats-card";

<TransferStatsCard branchId={1} branchName="Ampang" />;

// Displays:
// - Total Cases: 45
// - Sent Out: 5 (to JB: 3, to Subang: 2)
// - Received: 8 (from JB: 5, from Penang: 3)
```

### Example 3: View Transfer History

```tsx
import { TransferHistoryDialog } from "@/components/custom/warranty/transfer-history-dialog";

<TransferHistoryDialog
  open={showHistory}
  onOpenChange={setShowHistory}
  caseId={123}
  serviceNo="WAP2510001"
/>;

// Shows complete transfer history:
// 1. Ampang → JB (Oct 15, 2025)
// 2. JB → Ampang (Oct 18, 2025)
```

## Migration

The database migration has been created and applied:

```
prisma/migrations/20251018092619_add_case_transfer_tracking/
```

The migration adds:

- `TransferStatus` enum
- `originBranchId` field to `WarrantyCase`
- `CaseTransfer` model
- Related indexes and foreign keys

## Future Enhancements

Potential improvements for the transfer system:

1. **Transfer Approval Workflow**

   - Add `PENDING` status requiring acceptance
   - Notification system for pending transfers
   - Ability to reject transfers with reasons

2. **Transfer Notifications**

   - Email notifications to relevant staff
   - Dashboard notifications
   - Mobile push notifications

3. **Transfer Reports**

   - Monthly transfer reports
   - Branch performance metrics
   - Transfer trend analysis

4. **Bulk Transfers**

   - Transfer multiple cases at once
   - CSV import/export for transfers
   - Batch approval system

5. **Transfer Templates**
   - Pre-defined transfer reasons
   - Standard operating procedures
   - Automatic notes generation

## Best Practices

1. **Always provide a reason** when transferring cases
2. **Use notes** to provide context for the receiving branch
3. **Monitor transfer statistics** to identify patterns
4. **Review transfer history** before servicing transferred cases
5. **Keep origin branch information** intact for reference

## Troubleshooting

### Case not appearing in destination branch

- Check if page has been revalidated
- Verify SSE connection is active
- Check browser console for errors

### Transfer button disabled

- Ensure there are other branches available
- Check database connection
- Verify branch records exist

### Statistics not loading

- Check server action permissions
- Verify database queries
- Check browser console for errors
