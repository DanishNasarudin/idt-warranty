# Lock UI Reactivity Fix

## Issue

The lock UI was not updating when field locks were acquired or released by other users. The lock icons and disabled states were not appearing/disappearing in real-time.

## Root Cause

Components were calling `isFieldLocked()` function but **not subscribing** to the `fieldLocks` state in the Zustand store. This meant:

1. SSE receives `field-locked` message ✅
2. Store's `setFieldLock()` is called ✅
3. `fieldLocks` Map is updated ✅
4. **BUT components don't re-render** ❌

Components need to explicitly subscribe to state they want to react to in Zustand.

## Solution

### 1. Subscribe to `fieldLocks` in Components

**Before:**

```typescript
const { isFieldLocked, getDisplayValue } = useCollaborativeEditingStore();
```

**After:**

```typescript
const { isFieldLocked, getDisplayValue, fieldLocks } =
  useCollaborativeEditingStore();
```

By adding `fieldLocks` to the destructured values, the component now subscribes to changes in that state and will re-render when it changes.

### 2. Fixed Components

1. **`warranty-case-table.tsx`**

   - Added `fieldLocks` to store subscription
   - Added debug logging in `getFieldLockStatus`
   - Fixed return type to always include `lockedBy`

2. **`expandable-row-details.tsx`**

   - Added `fieldLocks` to store subscription
   - Added debug logging in `getFieldLockStatus`
   - Fixed return type to always include `lockedBy`

3. **`collaborative-editing-store.ts`**
   - Added console logs in `setFieldLock` and `removeFieldLock`
   - Logs show when locks are added/removed and how many remain

## How It Works Now

### Lock Acquisition Flow

```
User A clicks field
  ↓
acquireFieldLock() called
  ↓
Server creates lock
  ↓
SSE broadcasts "field-locked" to all users
  ↓
Store's setFieldLock() called
  ↓
[Store] Setting field lock: { caseId, field, userId, userName }
  ↓
fieldLocks Map updated (new Map created)
  ↓
Components subscribed to fieldLocks RE-RENDER ✨
  ↓
getFieldLockStatus() called with new lock data
  ↓
Returns { isLocked: true, lockedBy: "John Doe" }
  ↓
UI updates: Lock icon appears, field disabled
```

### Lock Release Flow

```
User A clicks out of field
  ↓
releaseFieldLock() called
  ↓
Server removes lock
  ↓
SSE broadcasts "field-unlocked" to all users
  ↓
Store's removeFieldLock() called
  ↓
[Store] Removing field lock: case X, field Y
  ↓
fieldLocks Map updated (lock deleted, new Map created)
  ↓
Components subscribed to fieldLocks RE-RENDER ✨
  ↓
getFieldLockStatus() called with no lock
  ↓
Returns { isLocked: false, lockedBy: undefined }
  ↓
UI updates: Lock icon disappears, field enabled
```

## Debug Console Logs

When testing, you should see these logs in the console:

### When User A Acquires Lock

**User A's Console:**

```
[Lock Status] Case 1, Field serviceNo: { isLocked: false, lockedBy: undefined }
// (acquires lock)
[Store] Setting field lock: { caseId: 1, field: "serviceNo", userId: "...", userName: "Alice" }
[Store] Field locks after set: 1 locks
```

**User B's Console:**

```
[SSE] Field locked: { caseId: 1, field: "serviceNo", userId: "...", userName: "Alice" }
[Store] Setting field lock: { caseId: 1, field: "serviceNo", userId: "...", userName: "Alice" }
[Store] Field locks after set: 1 locks
[Lock Status] Case 1, Field serviceNo: { isLocked: true, lockedBy: "Alice" }
```

### When User A Releases Lock

**User A's Console:**

```
// (blurs field)
[Store] Removing field lock: case 1, field serviceNo
[Store] Lock deleted: true, remaining: 0
```

**User B's Console:**

```
[SSE] Field unlocked: { caseId: 1, field: "serviceNo", userId: "..." }
[Store] Removing field lock: case 1, field serviceNo
[Store] Lock deleted: true, remaining: 0
[Lock Status] Case 1, Field serviceNo: { isLocked: false, lockedBy: undefined }
```

## Testing Instructions

### Test 1: Table Cell Locking

1. Open two browser windows (Alice and Bob)
2. Navigate to the same warranty case table
3. Open browser console (F12) in both windows

**Alice's Window:**

- Click into "Service No" field on Case #1
- Watch console: Should NOT see lock status log (you're editing)
- Field should be editable

**Bob's Window:**

- Watch console for SSE message:
  ```
  [SSE] Field locked: ...
  [Store] Setting field lock: ...
  [Lock Status] Case 1, Field serviceNo: { isLocked: true, lockedBy: "Alice" }
  ```
- UI should show:
  - 🔒 Lock icon appears on the field
  - Field has muted background
  - Tooltip shows "Locked by Alice"
  - Cannot click into field

**Alice's Window:**

- Click out of "Service No" field
- Watch console: Lock released logs

**Bob's Window:**

- Watch console:
  ```
  [SSE] Field unlocked: ...
  [Store] Removing field lock: ...
  ```
- UI should update:
  - 🔒 Lock icon disappears
  - Field background normal
  - Can now click into field

### Test 2: Expandable Row Field Locking

1. Same two windows (Alice and Bob)
2. Expand the same warranty case row

**Alice's Window:**

- Click into "Issues" textarea
- Start typing

**Bob's Window:**

- Should see lock icon next to "Issues" label
- Textarea should be disabled (muted background)
- Tooltip: "Locked by Alice"

**Alice's Window:**

- Click out of "Issues" field

**Bob's Window:**

- Lock icon should disappear
- Textarea should become enabled
- Can now type in the field

### Test 3: Multiple Fields

1. Same two windows
2. Alice clicks "Service No"
3. Bob clicks "Customer Name" (different field)
4. Both should be able to edit simultaneously
5. Both should see lock icons on the OTHER field only

## Zustand Reactivity Explanation

### Why Subscribing Matters

Zustand uses React's state subscription model. Components only re-render when:

1. **State they subscribe to changes**
2. **The reference changes** (new object/array/map)

```typescript
// ❌ NOT REACTIVE - only using function
const { isFieldLocked } = useCollaborativeEditingStore();
// Component won't re-render when fieldLocks changes

// ✅ REACTIVE - subscribing to fieldLocks
const { isFieldLocked, fieldLocks } = useCollaborativeEditingStore();
// Component re-renders when fieldLocks changes
```

### Why We Create New Maps

```typescript
setFieldLock: (lock) => {
  set((state) => {
    const newLocks = new Map(state.fieldLocks); // ✅ New Map instance
    newLocks.set(key, lock);
    return { fieldLocks: newLocks }; // New reference triggers re-render
  });
};
```

If we mutated the existing Map:

```typescript
// ❌ WRONG - mutates existing Map
state.fieldLocks.set(key, lock); // Same reference, no re-render!
```

## Files Modified

1. **`components/custom/warranty/warranty-case-table.tsx`**

   - Added `fieldLocks` to store subscription
   - Added debug logging
   - Fixed return type

2. **`components/custom/warranty/expandable-row-details.tsx`**

   - Added `fieldLocks` to store subscription
   - Added debug logging
   - Fixed return type

3. **`lib/stores/collaborative-editing-store.ts`**
   - Added debug logging to track lock changes

## Expected Behavior

✅ Lock icons appear immediately when another user starts editing
✅ Lock icons disappear immediately when another user stops editing
✅ Fields become disabled/enabled in real-time
✅ Tooltips show correct user names
✅ No lag or delay in UI updates
✅ Works for both table cells and expandable row fields

## Troubleshooting

If locks still don't update:

1. **Check console logs** - Should see SSE messages and store updates
2. **Verify fieldLocks subscription** - Make sure it's in the destructured values
3. **Check SSE connection** - Should see "Connection established" log
4. **Clear browser cache** - Old code might be cached
5. **Check network tab** - SSE connection should be open
