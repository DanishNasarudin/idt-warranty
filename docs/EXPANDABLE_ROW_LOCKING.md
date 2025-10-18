# Expandable Row Field Locking

## Overview

This document describes the field locking implementation for expandable row details, which provides the same collaborative editing features as the main table cells.

## Features

All 11 fields in the expandable row now have:

- ✅ **Field Locking** - Prevents concurrent edits
- ✅ **Lock Indicators** - Visual lock icon with tooltips
- ✅ **Optimistic Updates** - Instant UI feedback
- ✅ **Real-time Sync** - Updates from other users
- ✅ **Smart Updates** - Doesn't disrupt focused fields

## Fields with Locking

1. Customer Email
2. Purchase Date
3. Invoice
4. Address (textarea)
5. Status Description (textarea)
6. Remarks (textarea)
7. Received Items
8. PIN
9. Cost
10. Issues (textarea)
11. Solutions (textarea)

## Implementation

### Props Added

```typescript
type ExpandableRowDetailsProps = {
  case_: WarrantyCaseWithRelations;
  onUpdate: (updates: Partial<WarrantyCaseWithRelations>) => void;
  onAcquireFieldLock?: (caseId: number, field: string) => Promise<boolean>;
  onReleaseFieldLock?: (caseId: number, field: string) => Promise<void>;
  userId?: string;
};
```

### Lock Management

```typescript
// Acquire lock when field receives focus
const handleFocus = async (field: string) => {
  setFocusedField(field);

  if (onAcquireFieldLock) {
    const acquired = await onAcquireFieldLock(case_.id, field);
    if (!acquired) {
      // Lock acquisition failed - another user has it
      // Force blur the field
      const element = document.getElementById(`${case_.id}-${field}`);
      if (element) {
        (element as HTMLInputElement | HTMLTextAreaElement).blur();
      }
      return;
    }
  }
};

// Release lock when field loses focus
const handleBlur = async (field: string) => {
  setFocusedField(null);

  // Save changes...

  if (onReleaseFieldLock) {
    await onReleaseFieldLock(case_.id, field);
  }
};
```

### Lock Status Check

```typescript
const getFieldLockStatus = (field: string) => {
  if (!userId) return { isLocked: false };

  const lock = isFieldLocked(case_.id, field, userId);
  return {
    isLocked: lock !== null,
    lockedBy: lock?.userName,
  };
};
```

### Visual Indicators

```tsx
const lockStatus = getFieldLockStatus(field.name);

<Label className={cn(
  "text-sm font-medium flex items-center gap-1",
  lockStatus.isLocked && "text-muted-foreground"  // Muted when locked
)}>
  {lockStatus.isLocked && (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Lock className="h-3 w-3" />  {/* Lock icon */}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>Locked by {lockStatus.lockedBy}</p>  {/* Tooltip */}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )}
  {field.label}
</Label>

<Input
  onFocus={() => handleFocus(field.name)}
  onBlur={() => handleBlur(field.name)}
  disabled={lockStatus.isLocked}  // Disabled when locked
  className={cn(
    lockStatus.isLocked && "bg-muted/50"  // Muted background
  )}
/>
```

## User Experience Flow

### Scenario 1: Successful Lock Acquisition

1. User clicks into "Issues" field
2. `handleFocus` called → lock acquired
3. Lock icon appears for other users
4. User types their changes (instant UI updates)
5. User clicks out of field
6. `handleBlur` called → changes saved → lock released
7. Lock icon disappears for other users

### Scenario 2: Lock Already Held

1. User A is typing in "Issues" field (has lock)
2. User B clicks into "Issues" field on same case
3. Lock acquisition fails (User A has it)
4. Field automatically blurs (can't edit)
5. User B sees lock icon with tooltip: "Locked by [User A's name]"
6. Field is disabled with muted background
7. User A finishes editing → lock released
8. User B can now click and edit the field

### Scenario 3: Real-time Updates

1. User A is typing in "Issues" field
2. User B updates "Solutions" field
3. User A's "Issues" field continues typing (not disrupted)
4. User A's "Solutions" field updates in real-time
5. Both users see synchronized data

## Visual States

### Unlocked Field

```
┌─────────────────────────────┐
│ Customer Email              │ ← Normal label
├─────────────────────────────┤
│ john@example.com            │ ← Normal background
│ (cursor here)               │ ← Can focus and type
└─────────────────────────────┘
```

### Locked Field (by another user)

```
┌─────────────────────────────┐
│ 🔒 Customer Email           │ ← Lock icon + muted label
│    ↑ "Locked by Alice"      │ ← Tooltip on hover
├─────────────────────────────┤
│ john@example.com            │ ← Muted background
│ (cannot focus)              │ ← Disabled, no cursor
└─────────────────────────────┘
```

## Lock Duration

- **Automatic Expiry**: 30 seconds if user doesn't release
- **Manual Release**: On blur (when clicking out of field)
- **Cleanup**: Server cleans up expired locks every 10 seconds

## Edge Cases Handled

### 1. User Closes Browser While Editing

- Lock expires after 30 seconds
- Other users can then acquire the lock
- No permanent lock situation

### 2. User Loses Network Connection

- SSE reconnects automatically (exponential backoff)
- Lock is maintained during reconnection
- If reconnection takes >30s, lock expires

### 3. Rapid Field Switching

- Each field has independent lock
- Switching from "Issues" to "Solutions" releases first lock, acquires second
- No conflict between fields

### 4. Multiple Expandable Rows

- Each case has independent locks
- User A can edit Case 1's "Issues"
- User B can edit Case 2's "Issues" simultaneously
- No conflict between different cases

## Testing Guide

### Test 1: Basic Locking

```
Setup: Two users (Alice, Bob) on same warranty case page

1. Alice expands a warranty case
2. Alice clicks into "Issues" field
   ✅ Field is editable, no lock icon

3. Bob expands the same warranty case
4. Bob sees lock icon next to "Issues" label
   ✅ Tooltip says "Locked by Alice"
   ✅ Field is disabled with muted background

5. Alice clicks out of "Issues" field
6. Bob's view updates
   ✅ Lock icon disappears
   ✅ Field becomes editable
```

### Test 2: Optimistic Updates

```
Setup: Single user

1. User expands a warranty case
2. User clicks into "Address" field
3. User types new address
   ✅ Characters appear instantly
   ✅ No lag or delay

4. User clicks out (blur)
   ✅ Changes saved to server
   ✅ Lock released
```

### Test 3: Real-time Sync

```
Setup: Two users (Alice, Bob) on same warranty case

1. Alice expands case, types in "Issues" field
2. Bob expands same case, types in "Solutions" field
3. Both users should see:
   ✅ Their own field updates instantly
   ✅ Other user's field updates in real-time
   ✅ No disruption to their typing
   ✅ Lock icons show correctly
```

### Test 4: Lock Expiry

```
Setup: Two users (Alice, Bob)

1. Alice clicks into "Remarks" field
2. Bob sees field is locked
3. Alice leaves tab idle for 30+ seconds
4. Bob's view updates
   ✅ Lock icon disappears after 30s
   ✅ Bob can now edit the field
```

## Comparison with Table Cells

| Feature            | Table Cells             | Expandable Row Fields  |
| ------------------ | ----------------------- | ---------------------- |
| Field Locking      | ✅ Yes                  | ✅ Yes                 |
| Lock Indicators    | ✅ Lock icon + tooltip  | ✅ Lock icon + tooltip |
| Optimistic Updates | ✅ Instant              | ✅ Instant             |
| Real-time Sync     | ✅ SSE                  | ✅ SSE                 |
| Debouncing         | ✅ 1s text, 0s dropdown | ✅ 1s all fields       |
| Lock Duration      | ✅ 30s                  | ✅ 30s                 |
| Visual Feedback    | ✅ Muted background     | ✅ Muted background    |

## Benefits

1. **Consistent UX** - Same behavior as table cells
2. **Prevents Data Loss** - No overwriting from concurrent edits
3. **Clear Communication** - Users know when fields are locked
4. **Instant Feedback** - No delay in UI updates
5. **Network Resilient** - Works well even with slow connections

## Related Documentation

- [OPTIMISTIC_UPDATES.md](./OPTIMISTIC_UPDATES.md) - Optimistic update patterns
- [REALTIME_COLLABORATIVE_EDITING.md](./REALTIME_COLLABORATIVE_EDITING.md) - Full system overview
- [REALTIME_IMPLEMENTATION_GUIDE.md](./REALTIME_IMPLEMENTATION_GUIDE.md) - Technical details
