# Case Transfer Quick Reference

## Summary

✅ **Database:** New `CaseTransfer` model + `originBranchId` field in `WarrantyCase`
✅ **Migration:** Applied (`20251018092619_add_case_transfer_tracking`)
✅ **Server Actions:** 5 new actions in `transfer-actions.ts`
✅ **UI Components:** 3 new components (dialog, history, stats)
✅ **Integration:** Transfer buttons added to case details

## Key Concepts

### Origin Branch

- Set when case is first created
- Tracks where the case originally came from
- Never changes, even after multiple transfers

### Transfer Record

- Complete audit trail
- Tracks: from/to branches, staff, reason, notes, timestamps
- Accessible via "History" button

### Transfer Sequence Example

```
Branch 1 creates case → originBranch = Branch 1, currentBranch = Branch 1
Transfer to Branch 2 → originBranch = Branch 1, currentBranch = Branch 2
Transfer to Branch 3 → originBranch = Branch 1, currentBranch = Branch 3
Transfer back to Branch 1 → originBranch = Branch 1, currentBranch = Branch 1
```

## Quick Code Examples

### Transfer a Case

```typescript
import { transferCaseToBranch } from "@/app/branch/[id]/transfer-actions";

const result = await transferCaseToBranch(
  caseId,
  fromBranchId,
  toBranchId,
  staffId, // optional
  "reason", // optional
  "notes" // optional
);
```

### Get Transfer History

```typescript
import { getCaseTransferHistory } from "@/app/branch/[id]/transfer-actions";

const history = await getCaseTransferHistory(caseId);
```

### Get Branch Statistics

```typescript
import { getBranchTransferStats } from "@/app/branch/[id]/transfer-actions";

const stats = await getBranchTransferStats(branchId);
// Returns: { totalCases, sent: { total, breakdown }, received: { total, breakdown } }
```

### Display Statistics Card

```tsx
import { TransferStatsCard } from "@/components/custom/warranty/transfer-stats-card";

<TransferStatsCard branchId={1} branchName="Ampang" />;
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

## UI Components Reference

### 1. TransferCaseDialog

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

### 2. TransferHistoryDialog

```tsx
<TransferHistoryDialog
  open={showHistory}
  onOpenChange={setShowHistory}
  caseId={123}
  serviceNo="WAP2510001"
/>
```

### 3. TransferStatsCard

```tsx
<TransferStatsCard branchId={1} branchName="Ampang" />
```

## Real-time Events

### Listen for transfers

```typescript
// SSE events are automatically handled by the existing system
// Two new event types:
// - "case-transferred-out": When a case leaves this branch
// - "case-transferred-in": When a case arrives at this branch
```

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

## Best Practices

✅ Always provide a reason for transfers
✅ Use notes to give context to receiving branch
✅ Monitor transfer statistics regularly
✅ Review history before servicing transferred cases
✅ Keep origin branch data intact for reference

## Files Modified/Created

**Created:**

- `app/branch/[id]/transfer-actions.ts`
- `components/custom/warranty/transfer-case-dialog.tsx`
- `components/custom/warranty/transfer-history-dialog.tsx`
- `components/custom/warranty/transfer-stats-card.tsx`
- `docs/CASE_TRANSFER_FEATURE.md`
- `docs/CASE_TRANSFER_IMPLEMENTATION.md`
- `docs/CASE_TRANSFER_QUICK_REFERENCE.md` (this file)

**Modified:**

- `prisma/schema.prisma`
- `app/branch/[id]/actions.ts`
- `lib/types/warranty.ts`
- `lib/types/realtime.ts`
- `components/custom/warranty/expandable-row-details.tsx`

**Migration:**

- `prisma/migrations/20251018092619_add_case_transfer_tracking/`

## Support

For questions or issues:

1. Check `docs/CASE_TRANSFER_FEATURE.md` for detailed documentation
2. Review `docs/CASE_TRANSFER_IMPLEMENTATION.md` for technical details
3. Check browser console for errors
4. Verify database migration applied correctly
