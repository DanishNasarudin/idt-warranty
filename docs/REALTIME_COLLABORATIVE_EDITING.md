# Real-Time Collaborative Editing System

## Overview

This document describes the real-time collaborative editing system implemented for warranty case management. The system uses **Server-Sent Events (SSE)** to enable multiple users to edit warranty cases simultaneously with automatic conflict resolution and field locking.

## Architecture

### Technology Choice: SSE vs Socket.IO

We chose **Server-Sent Events (SSE)** over Socket.IO for the following reasons:

1. **Simpler Setup**: No additional server infrastructure needed
2. **Self-Hosted**: Runs directly on Next.js server
3. **HTTP-Based**: Works through firewalls and proxies
4. **Automatic Reconnection**: Built-in browser support
5. **One-Way Push**: Perfect for broadcasting updates from server to clients
6. **Lower Overhead**: More efficient for our use case

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Components                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  WarrantyCaseTableWrapper                                    │
│  ├─ useRealtimeUpdates Hook                                 │
│  ├─ useCollaborativeEditingStore (Zustand)                  │
│  └─ WarrantyCaseTable                                        │
│      ├─ EditableTextCell (with lock indicators)            │
│      └─ DropdownCell (with lock indicators)                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                             ↕️
┌─────────────────────────────────────────────────────────────┐
│                    SSE Connection Layer                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  /api/sse/warranty-updates (Route Handler)                  │
│  ├─ Establishes SSE connection                              │
│  ├─ Authenticates with Clerk                                │
│  └─ Sends heartbeat every 30 seconds                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                             ↕️
┌─────────────────────────────────────────────────────────────┐
│                      Server Layer                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  SSEConnectionManager (Singleton)                            │
│  ├─ Manages all active connections                          │
│  ├─ Handles field locks (30-second expiry)                  │
│  ├─ Broadcasts updates to all clients                       │
│  └─ Auto-cleanup of expired locks                           │
│                                                               │
│  Server Actions                                              │
│  ├─ updateWarrantyCase() - Updates DB + Broadcasts          │
│  ├─ acquireFieldLock() - Lock acquisition                   │
│  └─ releaseFieldLock() - Lock release                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                             ↕️
┌─────────────────────────────────────────────────────────────┐
│                       Database Layer                         │
│                       (Prisma + MySQL)                       │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Field Locking

- **Purpose**: Prevent concurrent edits on the same field
- **Implementation**: When a user starts editing a field, a lock is acquired
- **Visual Indicator**: Locked fields show a 🔒 icon and tooltip with editor's name
- **Auto-Expiry**: Locks expire after 30 seconds to prevent deadlocks
- **Grace Period**: Users can't edit locked fields until released

### 2. Optimistic Updates

- **Local First**: Changes appear immediately in the UI
- **Server Sync**: Changes are sent to server after debounce
- **Rollback**: On error, changes are reverted
- **Smart Merge**: Server data doesn't overwrite fields being edited

### 3. Debounced Saves

- **Delay**: 1-second debounce on text input changes
- **Batch Updates**: Multiple rapid changes are batched
- **Immediate for Dropdowns**: No debounce for dropdown selections
- **Cancel on Navigate**: Pending updates are cancelled if user leaves

### 4. Race Condition Handling

**Problem**: Two users edit the same field simultaneously

**Solution**:

```typescript
User A starts editing → Acquires lock → Types value → Save
User B tries to edit  → Lock denied → Shows warning → Can't edit
User A stops editing  → Releases lock
User B can now edit   → Acquires lock → Types value → Save
```

### 5. Connection Management

**Automatic Reconnection**:

- Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s...
- Max 10 attempts before showing error
- Reconnects on page visibility change

**Heartbeat**:

- Server sends heartbeat every 30 seconds
- Detects dead connections
- Auto-removes stale connections

### 6. Data Consistency

**Periodic Sync**:

- Full sync every 60 seconds
- Sync on page visibility change
- Sync on reconnection

**Smart Update**:

```typescript
// Only update fields not being edited
Object.entries(updates).forEach(([field, value]) => {
  if (!isEditing(caseId, field)) {
    applyUpdate(field, value);
  }
});
```

### 7. User Experience

**Real-Time Indicators**:

- ��� Connection status indicator
- 🔒 Lock icon on locked fields
- Tooltip showing who is editing
- Visual feedback on save

**Non-Disruptive Updates**:

- Updates don't clear user input
- Cursor position preserved
- No jarring UI changes
- Smooth optimistic updates

## File Structure

```
lib/
├── types/
│   └── realtime.ts                    # SSE message types, locks
├── utils/
│   └── sse-manager.ts                 # Connection & lock management
├── stores/
│   └── collaborative-editing-store.ts # Zustand store for state
└── hooks/
    └── use-realtime-updates.ts        # SSE connection hook

app/
├── api/
│   └── sse/
│       └── warranty-updates/
│           └── route.ts               # SSE endpoint
└── branch/
    └── [id]/
        ├── actions.ts                 # Server actions (with broadcast)
        └── lock-actions.ts            # Lock management actions

components/
└── custom/
    └── warranty/
        ├── warranty-case-table-wrapper.tsx  # Main integration
        ├── warranty-case-table.tsx          # Table with lock support
        ├── editable-text-cell.tsx           # With lock indicator
        └── dropdown-cell.tsx                # With lock indicator
```

## Message Types

### SSE Messages (Server → Client)

```typescript
type SSEMessage =
  | { type: "connection-established"; data: { userId; branchId } }
  | { type: "field-locked"; data: FieldLock }
  | { type: "field-unlocked"; data: { caseId; field; userId } }
  | { type: "case-updated"; data: { caseId; updates } }
  | { type: "sync-required"; data: { caseId } }
  | { type: "heartbeat"; data: { timestamp } };
```

### Field Lock Structure

```typescript
type FieldLock = {
  caseId: number;
  field: string;
  userId: string;
  userName: string;
  timestamp: number;
  expiresAt: number; // timestamp + 30000ms
};
```

## Usage Example

### Editing a Field

```typescript
// 1. User clicks on field
handleEditStart(caseId, "customerName");
  ↓
// 2. Attempt to acquire lock
acquireFieldLock(caseId, "customerName", branchId);
  ↓
// 3. If successful, show input
setEditingCell({ caseId, field: "customerName" });
  ↓
// 4. User types (debounced)
onInput → scheduleUpdate(caseId, "customerName", value, 1000ms);
  ↓
// 5. After debounce, save to server
updateWarrantyCase(caseId, { customerName: value });
  ↓
// 6. Server broadcasts to other users
sseManager.broadcast(branchId, {
  type: "case-updated",
  data: { caseId, updates: { customerName: value } }
});
  ↓
// 7. User stops editing
handleEditEnd(caseId, "customerName");
  ↓
// 8. Release lock
releaseFieldLock(caseId, "customerName", branchId);
```

## Configuration

### Timing Constants

```typescript
// Lock expiry
const LOCK_EXPIRY_MS = 30000; // 30 seconds

// Debounce delay
const DEBOUNCE_MS = 1000; // 1 second

// Heartbeat interval
const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds

// Lock cleanup interval
const LOCK_CLEANUP_INTERVAL_MS = 10000; // 10 seconds

// Sync interval
const SYNC_INTERVAL_MS = 60000; // 60 seconds

// Reconnect settings
const BASE_RECONNECT_DELAY_MS = 1000; // 1 second
const MAX_RECONNECT_ATTEMPTS = 10;
```

### Environment Variables

No additional environment variables required. System works with existing:

- `DATABASE_URL`: For Prisma
- Clerk authentication (already configured)

## Testing Scenarios

### Scenario 1: Concurrent Editing

**Setup**: Two users (Alice, Bob) viewing same warranty case

1. Alice clicks on "Customer Name" field
2. Lock acquired for Alice
3. Bob tries to click on "Customer Name" field
4. Bob sees lock icon and tooltip: "Locked by Alice"
5. Bob cannot edit the field
6. Alice finishes editing and clicks away
7. Lock released
8. Bob can now edit the field

**Expected**: No data loss, no overwrites

### Scenario 2: Connection Loss

**Setup**: User editing, then loses internet

1. User types in field
2. Change saved optimistically
3. Internet disconnects
4. SSE connection closed
5. System attempts to reconnect (exponential backoff)
6. Internet restored
7. SSE reconnects
8. Full sync triggered
9. Data consistency verified

**Expected**: Changes preserved, no data loss

### Scenario 3: Page Refresh

**Setup**: User editing, then refreshes page

1. User editing field
2. User refreshes page (F5)
3. All locks for that user released (on disconnect)
4. Page reloads
5. New SSE connection established
6. Fresh data loaded from server
7. Other users can now edit previously locked fields

**Expected**: Locks properly released, no deadlocks

### Scenario 4: Rapid Typing

**Setup**: User typing quickly

1. User types "H"
2. Debounce timer starts (1s)
3. User types "e"
4. Previous timer cancelled, new timer starts
5. User types "l", "l", "o"
6. Each keypress cancels and restarts timer
7. User stops typing
8. After 1 second, save to server
9. Single database update for "Hello"

**Expected**: Only one server call, not 5

### Scenario 5: Multiple Field Updates

**Setup**: User updates multiple fields rapidly

1. User updates "Status" dropdown → Immediate save
2. User updates "Name" field → Debounced
3. User updates "Contact" field → Debounced
4. Both debounced fields save after 1 second
5. Each broadcasts separately to other users
6. Other users see all updates in real-time

**Expected**: Dropdowns save immediately, text debounced

## Troubleshooting

### Issue: Locks Not Releasing

**Symptoms**: Fields permanently locked

**Causes**:

- Server crash before cleanup
- Client disconnect without cleanup

**Solutions**:

- Locks auto-expire after 30 seconds
- Lock cleanup runs every 10 seconds
- Page refresh releases all user locks

### Issue: Updates Not Appearing

**Symptoms**: Changes made by others not visible

**Causes**:

- SSE connection lost
- Not in same branch
- Firewall blocking SSE

**Solutions**:

- Check connection status indicator
- Verify branchId matches
- Check browser network tab for SSE connection
- Check server logs for connection

### Issue: Duplicate Updates

**Symptoms**: Same update appearing multiple times

**Causes**:

- Multiple SSE connections for same user
- Race condition in broadcast

**Solutions**:

- Ensure only one SSE connection per user
- Check connection manager logs
- Verify userId uniqueness

## Performance Considerations

### Memory Usage

- **SSE Connections**: ~1KB per connection
- **Field Locks**: ~200 bytes per lock
- **Optimistic Updates**: Stored in Zustand (in-memory)

**Estimate for 100 concurrent users**:

- Connections: 100 KB
- Locks (avg 5 per user): 100 KB
- Optimistic updates: < 1 MB
- **Total**: ~1.2 MB server memory

### Network Usage

- **Heartbeat**: 50 bytes every 30s per connection
- **Field Lock**: 200 bytes
- **Case Update**: 500 bytes (varies by field)

**Estimate for 100 users editing actively**:

- Heartbeats: 167 bytes/sec
- Updates: ~1 KB/sec (20 updates)
- **Total**: ~1.2 KB/sec

### Database Load

- **Without Debounce**: 1 query per keystroke
- **With Debounce**: 1 query per field per second max

**Improvement**: 90-95% reduction in database queries

## Future Enhancements

### Phase 2 (Optional)

1. **Conflict Resolution Dialog**

   - Show when concurrent edits detected
   - Let user choose which version to keep

2. **Edit History**

   - Track who made what changes
   - Show in expandable row details

3. **Presence Indicators**

   - Show who is viewing the page
   - Avatar bubbles for active users

4. **Undo/Redo**

   - Collaborative undo/redo
   - Preserve edit history

5. **Field-Level Timestamps**

   - Show "Last edited by X, 2 minutes ago"
   - Hover tooltip on each field

6. **Offline Mode**
   - Queue changes when offline
   - Sync when back online
   - Handle conflicts intelligently

## Security Considerations

1. **Authentication**: All SSE connections authenticated via Clerk
2. **Authorization**: Users can only edit cases in their branch
3. **Lock Validation**: Server validates lock ownership before updates
4. **XSS Protection**: All user input sanitized
5. **Rate Limiting**: Consider adding if abuse detected

## Conclusion

This real-time collaborative editing system provides a robust, scalable solution for multi-user warranty case management. The use of SSE, field locking, optimistic updates, and smart conflict resolution ensures a smooth user experience while maintaining data consistency.

**Key Benefits**:

- ✅ Real-time collaboration
- ✅ No data loss from concurrent edits
- ✅ Smooth UX with optimistic updates
- ✅ Automatic reconnection
- ✅ No UI disruption during updates
- ✅ Self-hosted (no external dependencies)
- ✅ 90%+ reduction in server calls (via debouncing)
