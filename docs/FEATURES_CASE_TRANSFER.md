# Case Transfer Feature

## Overview

The Case Transfer feature allows warranty cases to be transferred between branches with full history tracking and statistics.

## When to Use

- Customer relocates to a different area
- Specialized equipment or expertise required at another branch
- Workload balancing between branches
- Cases need to be returned to the original branch after servicing

## Quick Reference

### Transfer a Case

```typescript
import { transferCaseToBranch } from "@/app/(warranty)/branch/[id]/transfer-actions";

const result = await transferCaseToBranch(
  caseId,
  fromBranchId,
  toBranchId,
  staffId, // optional
  "Customer relocated", // reason (optional)
  "Please handle urgently" // notes (optional)
);
```

### View Transfer History

```typescript
import { getCaseTransferHistory } from "@/app/(warranty)/branch/[id]/transfer-actions";

const history = await getCaseTransferHistory(caseId);
```

### Get Branch Statistics

```typescript
import { getBranchTransferStats } from "@/app/(warranty)/branch/[id]/transfer-actions";

const stats = await getBranchTransferStats(branchId);
// Returns: { totalCases, sent: { total, breakdown }, received: { total, breakdown } }
```

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

```tsx
<TransferCaseDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  caseId={123}
  currentBranchId={1}
  currentBranchName="Ampang"
  serviceNo="WAP2510001"
  availableBranches={branches}
  staffId={5}
  onTransferComplete={() => window.location.reload()}
/>
```

**Features:**

- Select destination branch
- Enter transfer reason
- Add additional notes
- Real-time validation
- Success/error notifications

### 2. TransferHistoryDialog

Modal dialog displaying transfer history for a case.

```tsx
<TransferHistoryDialog
  open={showHistory}
  onOpenChange={setShowHistory}
  caseId={123}
  serviceNo="WAP2510001"
/>
```

**Features:**

- Chronological transfer list
- Shows from/to branches
- Display transfer status
- Shows transfer reason and notes
- Shows who transferred and when

### 3. TransferStatsCard

Card component displaying branch transfer statistics.

```tsx
<TransferStatsCard branchId={1} branchName="Ampang" />
```

**Features:**

- Total cases in branch
- Cases sent out count
- Cases received count
- Breakdown by destination branches
- Breakdown by source branches
- Visual indicators for sent/received

## Real-time Updates

The transfer system integrates with the existing SSE infrastructure:

### SSE Message Types

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

## Visual Indicators

### In the Table

Cases showing origin branch if transferred:
`[From Ampang]` badge in expanded details header

### In Transfer History

- Transfer direction arrows: `Ampang → Johor Bahru`
- Status badges: `COMPLETED`, `PENDING`, etc.
- Timestamps and staff information

### In Statistics

- Icons for sent (↗) and received (↙)
- Color-coded counts
- Breakdown by branch

## Common Use Cases

### 1. Customer Relocation

```typescript
// Transfer case to new location
await transferCaseToBranch(
  caseId,
  currentBranchId,
  newLocationBranchId,
  staffId,
  "Customer relocated to new area",
  "Customer will visit new branch next week"
);
```

### 2. Specialized Equipment Needed

```typescript
// Transfer to branch with required equipment
await transferCaseToBranch(
  caseId,
  currentBranchId,
  specializedBranchId,
  staffId,
  "Requires specialized diagnostic equipment",
  "Equipment available at destination branch"
);
```

### 3. Return to Original Branch

```typescript
// After servicing, return to origin
await transferCaseToBranch(
  caseId,
  currentBranchId,
  case.originBranchId!,
  staffId,
  "Service completed, returning to origin branch",
  ""
);
```

### 4. View Branch Performance

```tsx
// Add to dashboard or branch page
<TransferStatsCard branchId={branchId} branchName={branchName} />
```

## Database Queries

### Find all cases transferred from a branch

```typescript
const transfers = await prisma.caseTransfer.findMany({
  where: { fromBranchId: 1 },
  include: { case: true, toBranch: true },
});
```

### Find all cases currently in a branch that originated elsewhere

```typescript
const transferredCases = await prisma.warrantyCase.findMany({
  where: {
    branchId: 1,
    originBranchId: { not: 1 },
  },
  include: { originBranch: true },
});
```

### Count transfers between two branches

```typescript
const count = await prisma.caseTransfer.count({
  where: {
    fromBranchId: 1,
    toBranchId: 2,
  },
});
```

## Troubleshooting

### Transfer button disabled?

- Check if `availableBranches` array has items
- Verify other branches exist in database
- Check console for errors

### Transfer not showing in destination?

- Wait for page revalidation
- Check SSE connection status
- Verify database transaction completed

### Origin branch not set?

- This is normal for cases created before migration
- Will be set on first transfer
- Or run update script to backfill existing cases

## Backfill Script (Optional)

To set origin branch for existing cases:

```typescript
// Run once to update existing cases
await prisma.warrantyCase.updateMany({
  where: { originBranchId: null },
  data: { originBranchId: prisma.raw("branchId") },
});
```

Or more safely:

```typescript
const cases = await prisma.warrantyCase.findMany({
  where: { originBranchId: null },
});

for (const case_ of cases) {
  await prisma.warrantyCase.update({
    where: { id: case_.id },
    data: { originBranchId: case_.branchId },
  });
}
```

## Files

**Created:**

- `app/(warranty)/branch/[id]/transfer-actions.ts`
- `components/custom/warranty/transfer-case-dialog.tsx`
- `components/custom/warranty/transfer-history-dialog.tsx`
- `components/custom/warranty/transfer-stats-card.tsx`

**Modified:**

- `prisma/schema.prisma`
- `app/(warranty)/branch/[id]/actions.ts`
- `lib/types/warranty.ts`
- `lib/types/realtime.ts`
- `components/custom/warranty/expandable-row-details.tsx`

**Migration:**

- `prisma/migrations/20251018092619_add_case_transfer_tracking/`

---

**Status:** ✅ Implemented and Production Ready
