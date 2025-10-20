# Auto-Save Race Condition Fix

## Problem Statement

The previous auto-save implementation had a critical race condition where user input could be lost:

1. User types in a field → change scheduled for save in 1 second
2. After 1 second, save begins to server
3. User continues typing during the save operation
4. Save completes and removes the pending update entry
5. **New changes are lost** - no new save is scheduled

This resulted in users losing their most recent edits when they typed continuously.

## Solution Overview

We implemented a **queuing mechanism** inspired by the auto-save-manager pattern that:

1. **Tracks save state** - Knows when a save is actively in progress
2. **Detects newer changes** - Flags when changes occur during save
3. **Re-schedules automatically** - Automatically triggers another save if needed

## Implementation Details

### Key Changes in `collaborative-editing-store.ts`

#### 1. Enhanced PendingUpdate Type

```typescript
type PendingUpdate = {
  caseId: number;
  field: string;
  value: any;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
  isSaving?: boolean; // NEW: Track if save is in progress
  hasNewerChanges?: boolean; // NEW: Track if newer changes arrived
};
```

#### 2. Improved scheduleUpdate Logic

**When new changes arrive during save:**

```typescript
// If an update is currently being saved, mark that there are newer changes
if (existingUpdate?.isSaving) {
  console.log(`[Store] Save in progress for ${key}, marking newer changes`);
  set((state) => {
    const newPending = new Map(state.pendingUpdates);
    const current = newPending.get(key);
    if (current) {
      newPending.set(key, {
        ...current,
        hasNewerChanges: true,
        value, // Update to the newest value
      });
    }
    return { pendingUpdates: newPending };
  });

  // Apply optimistic update immediately for UI feedback
  state.setOptimisticUpdate(caseId, { [field]: value });
  return; // Don't schedule a new timer, let current save handle it
}
```

**During save operation:**

```typescript
// Mark as saving before starting
set((state) => {
  const newPending = new Map(state.pendingUpdates);
  const current = newPending.get(key);
  if (current) {
    newPending.set(key, {
      ...current,
      isSaving: true,
      hasNewerChanges: false,
    });
  }
  return { pendingUpdates: newPending };
});

// Perform the save...
await onUpdate(caseId, field, saveValue);

// Check if newer changes arrived during save
const afterSave = get().pendingUpdates.get(key);

if (afterSave?.hasNewerChanges) {
  console.log(`[Store] Newer changes detected for ${key}, re-scheduling save`);

  // Clear the current pending update
  set((state) => {
    const newPending = new Map(state.pendingUpdates);
    newPending.delete(key);
    return { pendingUpdates: newPending };
  });

  // Re-schedule with the newer value
  state.scheduleUpdate(caseId, field, afterSave.value, onUpdate, debounceMs);
}
```

## Flow Diagram

### Before Fix (Race Condition)

```
User types "Hello"
  ↓
Schedule save (1s debounce)
  ↓
[Wait 1s]
  ↓
Save starts → "Hello" sent to server
  ↓
User types " World" (during save)
  ↓ (Optimistic update only, no new timer)
Save completes
  ↓
Pending update removed
  ↓
❌ " World" is never saved!
```

### After Fix (Queued Updates)

```
User types "Hello"
  ↓
Schedule save (1s debounce)
  ↓
[Wait 1s]
  ↓
Save starts → Mark isSaving=true
  ↓
User types " World" (during save)
  ↓
Detect isSaving=true → Set hasNewerChanges=true
  ↓
Save "Hello" completes
  ↓
Check hasNewerChanges=true
  ↓
✅ Re-schedule save for " World"
  ↓
Save "Hello World" completes
```

## Benefits

1. **No Lost Data** - All user input is eventually saved
2. **Optimal Batching** - Multiple rapid changes still get batched efficiently
3. **Graceful Handling** - Works seamlessly even with very fast typing
4. **UI Feedback** - Optimistic updates ensure immediate visual response
5. **Efficient** - Doesn't create unnecessary duplicate saves

## Testing Scenarios

### Scenario 1: Slow Typing (No Race Condition)

- Type "Hello"
- Wait 1 second
- Save completes
- Type " World"
- Wait 1 second
- Save completes
- ✅ Both saves successful

### Scenario 2: Fast Typing (Race Condition Prevented)

- Type "Hello"
- After 0.5s, save scheduled
- After 1s, save starts
- During save, type " World"
- Save completes, detects newer changes
- Automatically re-schedules save for " World"
- ✅ Both changes saved

### Scenario 3: Continuous Typing

- Type "H" → schedule save
- Type "e" → reset timer
- Type "l" → reset timer
- Type "l" → reset timer
- Type "o" → reset timer
- Wait 1s after last keystroke
- Save starts
- Type " World" during save
- ✅ Detects and re-saves

## Code Patterns

### Using the Store

```typescript
import { useCollaborativeEditingStore } from "@/lib/stores/collaborative-editing-store";

const { scheduleUpdate } = useCollaborativeEditingStore();

// In your component
const handleFieldChange = (value: string) => {
  scheduleUpdate(
    caseId,
    "fieldName",
    value,
    async (id, field, val) => {
      // Your save logic
      await updateCase(id, { [field]: val });
    },
    1000 // debounce ms
  );
};
```

### Monitoring Save Status

```typescript
const { pendingUpdates } = useCollaborativeEditingStore();

// Check if any saves are pending
const isSaving = pendingUpdates.size > 0;

// Check specific field
const key = `${caseId}:${fieldName}`;
const fieldPending = pendingUpdates.has(key);
const isFieldSaving = pendingUpdates.get(key)?.isSaving;
```

## Related Files

- `/lib/stores/collaborative-editing-store.ts` - Main store with improved logic
- `/lib/hooks/use-warranty-sync.ts` - Hook that uses the store
- `/components/custom/warranty/expandable-row-details.tsx` - UI component example
- `/docs/AUTO_SAVE_IMPROVEMENTS.md` - This documentation

## Migration Notes

This is a **backwards-compatible improvement**. No changes required to existing code that uses `scheduleUpdate()`. The enhancement works transparently behind the scenes.

## Future Enhancements

Potential improvements for consideration:

1. **Conflict Resolution** - Handle simultaneous edits from multiple users
2. **Retry Logic** - Automatic retry on network failures
3. **Offline Queue** - Save changes when offline, sync when online
4. **Analytics** - Track save patterns and optimize debounce timing
5. **Compression** - Batch multiple field updates into single request

## References

- Original pattern: `/components/custom/warranty/auto-save-manager.tsx` (from different project)
- Fast-deep-equal library: Used for efficient change detection
- Zustand store pattern: React state management

---

**Last Updated:** October 20, 2025
**Author:** Engineering Team
**Status:** ✅ Implemented and Tested
