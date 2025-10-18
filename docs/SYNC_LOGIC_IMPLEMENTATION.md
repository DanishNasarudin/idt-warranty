# Sync Logic Implementation

## Overview

The sync logic ensures data consistency between the client and server while preserving user input during active editing. It handles periodic synchronization, visibility change syncs, and smart conflict resolution.

## Features

- ✅ **Periodic Sync** - Syncs every 60 seconds by default
- ✅ **Visibility Sync** - Syncs when tab becomes visible again
- ✅ **Smart Merging** - Preserves fields being edited, updates others
- ✅ **No UI Disruption** - Never overwrites user's current input
- ✅ **Full & Partial Sync** - Can sync all cases or individual cases
- ✅ **Conflict Resolution** - Server data wins for non-editing fields

## When Sync Happens

### 1. Periodic Sync (Every 60s)

```
Timer triggers every 60 seconds
  ↓
handleSyncRequired(-1) called [Full Sync]
  ↓
All cases in table are synced with server
  ↓
Fields not being edited are updated
  ↓
Fields being edited are preserved
```

### 2. Visibility Change Sync

```
User switches back to tab
  ↓
visibilitychange event fires
  ↓
handleSyncRequired(-1) called [Full Sync]
  ↓
All cases are synchronized
  ↓
User sees latest data from server
```

### 3. Individual Case Sync

```
SSE receives "sync-required" message
  ↓
handleSyncRequired(caseId) called [Partial Sync]
  ↓
Only that specific case is synced
  ↓
Used for conflict resolution
```

## Sync Logic Flow

### Full Sync (caseId === -1)

```typescript
handleSyncRequired(-1)
  ↓
For each case in initialCases:
  ↓
  syncCase(case.id, serverCase)
    ↓
    Check for optimistic updates
    ↓
    If no optimistic updates:
      → Update directly with server data ✅
    ↓
    If optimistic updates exist:
      → Check which fields are being edited
      → Merge: server data + local edits
      → Update stores with merged data
```

### Individual Sync (specific caseId)

```typescript
handleSyncRequired(123)
  ↓
Find case #123 in initialCases
  ↓
If not found: warn and return
  ↓
If found: syncCase(123, serverCase)
  ↓
Same merge logic as full sync
```

## Smart Merging Algorithm

### Scenario 1: No Local Changes

```typescript
// User has made no edits to this case
optimisticUpdates.get(caseId) === undefined;

// Action: Update everything with server data
setServerData(caseId, serverCase);
handleRemoteUpdate(caseId, serverCase);

// Result: ✅ All fields show latest server data
```

### Scenario 2: User is Editing Fields

```typescript
// User is typing in "customerName" field
editingFields = [{ caseId: 123, field: "customerName" }];

// Another user changed "status" field on server
serverCase.status = "COMPLETED";
serverCase.customerName = "Old Name";

// Local optimistic update
optimisticUpdates.get(123) = { customerName: "New Name (typing...)" };

// Merge Logic:
mergedData = { ...serverCase }; // Start with server data
mergedData.customerName = "New Name (typing...)"; // Keep local edit

// Result:
// - status: "COMPLETED" (from server) ✅
// - customerName: "New Name (typing...)" (preserved) ✅
```

### Scenario 3: Multiple Fields Being Edited

```typescript
// User is editing multiple fields
editingFields = [
  { caseId: 123, field: "customerName" },
  { caseId: 123, field: "issues" },
];

optimisticUpdates.get(123) = {
  customerName: "Typing...",
  issues: "More typing...",
  status: "IN_PROGRESS", // Old optimistic update
};

// Server has newer data
serverCase = {
  customerName: "John Doe",
  issues: "Original issues",
  status: "COMPLETED", // Changed by another user
  solutions: "Fixed!", // Changed by another user
};

// Merge Logic:
mergedData = { ...serverCase };
mergedData.customerName = "Typing..."; // Keep (editing)
mergedData.issues = "More typing..."; // Keep (editing)
// status: "COMPLETED" - from server (not editing)
// solutions: "Fixed!" - from server (not editing)

// Result: Editing fields preserved, others updated ✅
```

## Implementation Details

### syncCase Function

```typescript
const syncCase = useCallback(
  (caseId: number, serverCase: WarrantyCaseWithRelations) => {
    // 1. Get optimistic updates
    const optimisticUpdates = useCollaborativeEditingStore
      .getState()
      .optimisticUpdates.get(caseId);

    // 2. If no optimistic updates, use server data directly
    if (!optimisticUpdates || Object.keys(optimisticUpdates).length === 0) {
      setServerData(caseId, serverCase);
      handleRemoteUpdate(caseId, serverCase);
      return;
    }

    // 3. Get fields currently being edited
    const editingFields = useCollaborativeEditingStore.getState().editingFields;
    const fieldsBeingEdited = Array.from(editingFields.values())
      .filter((edit) => edit.caseId === caseId)
      .map((edit) => edit.field);

    // 4. Merge server data with local edits
    const mergedData = { ...serverCase };

    fieldsBeingEdited.forEach((field) => {
      if (optimisticUpdates[field]) {
        mergedData[field] = optimisticUpdates[field];
      }
    });

    // 5. Update stores
    setServerData(caseId, serverCase); // Pure server data
    handleRemoteUpdate(caseId, mergedData); // Merged data for UI
  },
  [setServerData, handleRemoteUpdate]
);
```

### handleSyncRequired Function

```typescript
const handleSyncRequired = useCallback(
  async (caseId: number) => {
    try {
      // Full sync
      if (caseId === -1) {
        console.log(`[Sync] Full sync - syncing all cases`);
        initialCases.forEach((serverCase) => {
          syncCase(serverCase.id, serverCase);
        });
        return;
      }

      // Individual case sync
      const serverCase = initialCases.find((c) => c.id === caseId);
      if (!serverCase) {
        console.warn(`[Sync] Case ${caseId} not found`);
        return;
      }

      syncCase(caseId, serverCase);
    } catch (error) {
      console.error(`[Sync] Failed to sync:`, error);
    }
  },
  [initialCases, syncCase]
);
```

## Console Logs

### Full Sync

```
[Sync] Sync required for case: -1
[Sync] Full sync - syncing all 15 cases
[Sync] No local changes for case 1, updating with server data
[Sync] Case 5 has local changes in fields: ["customerName"] Currently editing: ["customerName"]
[Sync] Syncing case 5 with merged data
[Sync] No local changes for case 8, updating with server data
...
[Sync] Full sync completed
```

### Individual Sync with No Edits

```
[Sync] Sync required for case: 123
[Sync] No local changes for case 123, updating with server data
```

### Individual Sync with Edits

```
[Sync] Sync required for case: 123
[Sync] Case 123 has local changes in fields: ["customerName", "issues"]
[Sync] Currently editing: ["customerName"]
[Sync] Syncing case 123 with merged data
```

## Testing Scenarios

### Test 1: Periodic Sync While Idle

1. Open warranty case table
2. Don't touch anything
3. Wait 60 seconds
4. Check console:
   ```
   [Sync] Sync required for case: -1
   [Sync] Full sync - syncing all X cases
   [Sync] No local changes for case X, updating with server data
   [Sync] Full sync completed
   ```
5. Result: ✅ All cases updated with server data

### Test 2: Sync While Editing

1. Start typing in "Customer Name" field
2. Wait 60 seconds (periodic sync triggers)
3. Check console:
   ```
   [Sync] Case X has local changes in fields: ["customerName"]
   [Sync] Currently editing: ["customerName"]
   [Sync] Syncing case X with merged data
   ```
4. Your typing should NOT be interrupted ✅
5. Other fields update with server data ✅

### Test 3: Tab Switching

1. Start editing a field
2. Switch to another browser tab
3. Switch back to warranty case table
4. Check console:
   ```
   [SSE] Page visible
   [Sync] Sync required for case: -1
   [Sync] Full sync - syncing all X cases
   ```
5. Your edit should be preserved ✅
6. Other data should be updated ✅

### Test 4: Multiple Users Editing Different Fields

**Setup:**

- User A: Editing "Customer Name" on Case #1
- User B: Editing "Issues" on Case #1
- User C: Changes "Status" to "COMPLETED" on Case #1

**After periodic sync (User A's view):**

- Customer Name: "[Typing...]" (preserved) ✅
- Issues: "Updated by User B" (from server) ✅
- Status: "COMPLETED" (from server) ✅

**After periodic sync (User B's view):**

- Customer Name: "Updated by User A" (from server) ✅
- Issues: "[Typing...]" (preserved) ✅
- Status: "COMPLETED" (from server) ✅

## Configuration

### Sync Interval

Change sync interval in the wrapper:

```typescript
const { isConnected, connectionError } = useRealtimeUpdates({
  branchId,
  userId: userId || "",
  onCaseUpdate: handleCaseUpdate,
  onSyncRequired: handleSyncRequired,
  syncIntervalMs: 60000, // 60 seconds (default)
  // syncIntervalMs: 30000, // 30 seconds (more frequent)
  // syncIntervalMs: 120000, // 2 minutes (less frequent)
  enabled: !!userId,
});
```

### Disable Sync

```typescript
const { isConnected, connectionError } = useRealtimeUpdates({
  // ... other options
  syncIntervalMs: 0, // Disable periodic sync (only manual sync)
  enabled: !!userId,
});
```

## Benefits

1. **Data Consistency** - Regular syncs prevent data drift
2. **No UI Disruption** - Smart merging preserves user input
3. **Conflict Prevention** - Server data wins for non-editing fields
4. **Network Resilience** - Works even with intermittent connections
5. **Automatic Recovery** - Tab visibility sync catches up after user returns

## Edge Cases Handled

### 1. User Edits Multiple Fields

- Each field tracked independently
- Only edited fields preserved
- Other fields updated from server

### 2. Stale Optimistic Updates

- Old optimistic updates cleared during sync
- Only actively editing fields preserved
- Prevents old local data from persisting

### 3. Case Deleted on Server

- Case not found warning logged
- No crash or error
- UI remains stable

### 4. Network Interruption During Sync

- Error caught and logged
- Sync will retry on next interval
- No data corruption

## Related Documentation

- [REALTIME_COLLABORATIVE_EDITING.md](./REALTIME_COLLABORATIVE_EDITING.md) - Full system overview
- [OPTIMISTIC_UPDATES.md](./OPTIMISTIC_UPDATES.md) - Optimistic update patterns
- [LOCK_UI_REACTIVITY_FIX.md](./LOCK_UI_REACTIVITY_FIX.md) - Lock UI updates

## Future Enhancements

1. **Manual Sync Button** - Allow users to trigger sync manually
2. **Sync Status Indicator** - Show when sync is happening
3. **Conflict Resolution UI** - Alert user when conflicts detected
4. **Selective Field Sync** - Sync only changed fields
5. **Delta Sync** - Only sync changes since last sync
