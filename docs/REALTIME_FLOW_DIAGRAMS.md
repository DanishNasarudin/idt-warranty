# Real-Time Collaborative Editing - System Flow Diagrams

## 1. Initial Connection Flow

```
┌─────────┐                                      ┌─────────┐
│ User 1  │                                      │ User 2  │
└────┬────┘                                      └────┬────┘
     │                                                │
     │ 1. Navigate to /branch/1                      │
     ├──────────────────────────────────┐            │
     │                                  │            │
     │                                  ▼            │
     │                         ┌──────────────────┐  │
     │                         │  Next.js Page    │  │
     │                         │  (Server)        │  │
     │                         │  - Fetch cases   │  │
     │                         │  - Auth check    │  │
     │                         └────────┬─────────┘  │
     │                                  │            │
     │ 2. Render with SSE hook          │            │
     │◄─────────────────────────────────┘            │
     │                                                │
     │ 3. Connect to SSE                              │
     ├──────────────────────────┐                    │
     │  GET /api/sse/warranty-  │                    │
     │  updates?branchId=1      │                    │
     │                          │                    │
     │                          ▼                    │
     │                    ┌──────────────┐           │
     │                    │ SSE Manager  │           │
     │                    │ - Add conn   │           │
     │                    │ - Auth check │           │
     │                    └──────┬───────┘           │
     │                           │                   │
     │ 4. Connection confirmed   │                   │
     │◄──────────────────────────┘                   │
     │ data: {"type":"connection-                    │
     │        established"}                           │
     │                                                │
     │ 5. UI shows green indicator                   │
     │                                                │
     │                                                │ 6. User 2 also connects
     │                                                ├─────────────────────┐
     │                                                │                     │
     │                                                │                     ▼
     │                                          ┌──────────────┐      (Same flow
     │                                          │ SSE Manager  │       as User 1)
     │                                          │ - Add conn   │
     │                                          └──────────────┘
```

## 2. Field Edit Flow (Happy Path)

```
User 1 Edits Field:
═══════════════════

┌─────────┐                                      ┌─────────┐
│ User 1  │                                      │ User 2  │
└────┬────┘                                      └────┬────┘
     │                                                │
     │ 1. Click "Customer Name"                       │ (Viewing)
     ├──────────────────────────┐                    │
     │ acquireFieldLock()       │                    │
     │                          │                    │
     │                          ▼                    │
     │                    ┌──────────────┐           │
     │                    │ Lock Manager │           │
     │                    │ - Check lock │           │
     │                    │ - Acquire    │           │
     │                    └──────┬───────┘           │
     │                           │                   │
     │ 2. Lock acquired          │ 3. Broadcast      │
     │◄──────────────────────────┴──────────────────►│
     │                                                │
     │ 4. Show input field                           │ 4. Show lock icon 🔒
     │ [John Smith_]                                  │ "Locked by User 1"
     │                                                │
     │ 5. User types "..."                            │
     │ (Debounced 1 second)                           │
     │                                                │
     │ 6. After 1 sec, save                           │
     ├──────────────────────────┐                    │
     │ updateWarrantyCase()     │                    │
     │                          │                    │
     │                          ▼                    │
     │                    ┌──────────────┐           │
     │                    │  Database    │           │
     │                    │  - Update    │           │
     │                    └──────┬───────┘           │
     │                           │                   │
     │                           ▼                   │
     │                    ┌──────────────┐           │
     │                    │ SSE Broadcast│           │
     │                    └──────┬───────┘           │
     │                           │                   │
     │ 7. Success               │ 8. Update          │
     │◄─────────────────────────┴──────────────────►│
     │                                                │
     │                                                │ 9. UI updates
     │                                                │ "John Smith"
     │                                                │ (without disruption)
     │ 10. Click away                                 │
     ├──────────────────────────┐                    │
     │ releaseFieldLock()       │                    │
     │                          ▼                    │
     │                    ┌──────────────┐           │
     │                    │ Lock Manager │           │
     │                    │ - Release    │           │
     │                    └──────┬───────┘           │
     │                           │ 11. Broadcast     │
     │                           └──────────────────►│
     │                                                │
     │                                                │ 12. Remove lock icon
     │                                                │ Field now editable
```

## 3. Concurrent Edit Attempt (Lock Prevents)

```
User 2 Tries to Edit Locked Field:
═══════════════════════════════════

┌─────────┐                                      ┌─────────┐
│ User 1  │                                      │ User 2  │
└────┬────┘                                      └────┬────┘
     │                                                │
     │ 1. Editing "Customer Name"                     │
     │ [John Smith_]                                  │
     │ (Lock active)                                  │
     │                                                │
     │                                                │ 2. Clicks same field
     │                                                ├─────────────────┐
     │                                                │ acquireFieldLock()
     │                                                │                 │
     │                                                │                 ▼
     │                                          ┌──────────────┐
     │                                          │ Lock Manager │
     │                                          │ - Check lock │
     │                                          │ - Denied ❌  │
     │                                          └──────┬───────┘
     │                                                │
     │                                                │ 3. Lock denied
     │                                                │◄────────────────┘
     │                                                │
     │                                                │ 4. Show toast
     │                                                │ ⚠️ "Field is being
     │                                                │    edited by User 1"
     │                                                │
     │                                                │ 5. Cannot edit
     │ 6. User 1 finishes                             │ 🔒 "Locked by User 1"
     │ (Click away)                                   │
     ├──────────────────────────┐                    │
     │ releaseFieldLock()       │                    │
     │                          ▼                    │
     │                    ┌──────────────┐           │
     │                    │ Lock Manager │           │
     │                    │ - Release    │           │
     │                    └──────┬───────┘           │
     │                           │ 7. Broadcast      │
     │                           └──────────────────►│
     │                                                │
     │                                                │ 8. Lock removed
     │                                                │ ✅ Now editable
```

## 4. Connection Loss & Recovery

```
User Loses Connection:
══════════════════════

┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Connected (🟢)
     │◄────────────────SSE Connection──────────►│ Server
     │                                           │
     │ 2. Internet drops ❌                      │
     │                                           │
     │ ✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗✗                   │
     │                                           │ 3. Connection closed
     │ 4. Indicator: 🟡 "Reconnecting..."       │ 4. Remove from manager
     │                                           │ 5. Release all locks
     │ 5. Attempt 1 (1s delay)                  │
     ├──────────────✗✗✗✗✗✗✗✗──────────────────►│
     │                                           │
     │ 6. Attempt 2 (2s delay)                  │
     ├──────────────✗✗✗✗✗✗✗✗──────────────────►│
     │                                           │
     │ 7. Attempt 3 (4s delay)                  │
     ├──────────────✗✗✗✗✗✗✗✗──────────────────►│
     │                                           │
     │ 8. Internet restored ✅                   │
     │                                           │
     │ 9. Attempt 4 (8s delay) - Success!       │
     ├───────────────SSE Connection─────────────►│
     │                                           │
     │◄──────────────Connection OK───────────────┤
     │                                           │
     │ 10. Indicator: 🟢 "Connected"            │
     │                                           │
     │ 11. Full sync triggered                   │
     ├─────────────syncWithServer()─────────────►│
     │                                           │
     │◄──────────────Fresh Data──────────────────┤
     │                                           │
     │ 12. UI updated (without disruption)       │
```

## 5. Debouncing in Action

```
User Types Rapidly:
═══════════════════

┌─────────┐                                      ┌──────────┐
│  User   │                                      │  Server  │
└────┬────┘                                      └────┬─────┘
     │                                                │
     │ 1. Types "J"                                   │
     ├──────────────────────────┐                    │
     │ Start timer (1000ms)     │                    │
     │                          │                    │
     │ 2. Types "o" (100ms later)                    │
     ├──────────────────────────┤                    │
     │ Cancel prev, new timer   │                    │
     │                          │                    │
     │ 3. Types "h" (100ms later)                    │
     ├──────────────────────────┤                    │
     │ Cancel prev, new timer   │                    │
     │                          │                    │
     │ 4. Types "n" (100ms later)                    │
     ├──────────────────────────┤                    │
     │ Cancel prev, new timer   │                    │
     │                          │                    │
     │ 5. Stops typing                               │
     │                          │                    │
     │ 6. Wait 1000ms...        │                    │
     │                          │                    │
     │ 7. Timer fires           │                    │
     │                          ▼                    │
     │                    Save "John"                │
     │                          │                    │
     │ 8. Single server call    │                    │
     ├──────────────────────────┴───────────────────►│
     │                                                │
     │                                                │ 9. Update DB
     │                                                │ (1 query instead of 4)
     │                                                │
     │ 10. Success + Broadcast   │◄───────────────────┤
     │                                                │

Result: 75% reduction in database queries!
```

## 6. Data Flow Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  Component Layer                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ WarrantyCaseTableWrapper                           │    │
│  │  ├─ Connection Status Indicator                    │    │
│  │  └─ WarrantyCaseTable                              │    │
│  │      ├─ EditableTextCell (lock aware)              │    │
│  │      └─ DropdownCell (lock aware)                  │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↕️                                  │
│  State Layer                                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │ CollaborativeEditingStore (Zustand)                │    │
│  │  ├─ fieldLocks: Map<string, FieldLock>            │    │
│  │  ├─ editingFields: Map<string, {caseId, field}>   │    │
│  │  ├─ pendingUpdates: Map<string, PendingUpdate>    │    │
│  │  ├─ optimisticUpdates: Map<number, Updates>       │    │
│  │  └─ serverData: Map<number, Case>                 │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↕️                                  │
│  Hook Layer                                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │ useRealtimeUpdates()                               │    │
│  │  ├─ SSE Connection Management                      │    │
│  │  ├─ Auto-Reconnection                              │    │
│  │  ├─ Message Processing                             │    │
│  │  └─ Periodic Sync                                  │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↕️                                  │
└────────────────────────────────────────────────────────────┘
                           ↕️
┌────────────────────────────────────────────────────────────┐
│                     Next.js Server                          │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  API Route                                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ /api/sse/warranty-updates                          │    │
│  │  ├─ Authenticate user (Clerk)                      │    │
│  │  ├─ Create SSE stream                              │    │
│  │  ├─ Register with SSEManager                       │    │
│  │  └─ Send heartbeats                                │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↕️                                  │
│  Connection Manager                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ SSEConnectionManager (Singleton)                   │    │
│  │  ├─ connections: Map<userId, Connection>          │    │
│  │  ├─ fieldLocks: Map<key, FieldLock>               │    │
│  │  ├─ broadcast(): Send to all users                │    │
│  │  ├─ acquireFieldLock(): Lock management           │    │
│  │  └─ Auto-cleanup: Expired locks                   │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↕️                                  │
│  Server Actions                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ updateWarrantyCase()                               │    │
│  │  ├─ Update database                                │    │
│  │  ├─ Broadcast to SSEManager                        │    │
│  │  └─ Revalidate path                                │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↕️                                  │
└────────────────────────────────────────────────────────────┘
                           ↕️
┌────────────────────────────────────────────────────────────┐
│                    Database (MySQL)                         │
│                    via Prisma ORM                           │
└────────────────────────────────────────────────────────────┘
```

## 7. Message Types Flow

```
Server → Client Messages:
═════════════════════════

connection-established
├─ When: Client connects
├─ Data: { userId, branchId }
└─ Action: Set connected status

field-locked
├─ When: Another user starts editing
├─ Data: { caseId, field, userId, userName, expiresAt }
└─ Action: Show lock icon, disable field

field-unlocked
├─ When: User stops editing
├─ Data: { caseId, field, userId }
└─ Action: Remove lock icon, enable field

case-updated
├─ When: Another user saves
├─ Data: { caseId, updates: { field: value } }
└─ Action: Update UI (skip editing fields)

sync-required
├─ When: Conflict detected
├─ Data: { caseId }
└─ Action: Fetch fresh data from server

heartbeat
├─ When: Every 30 seconds
├─ Data: { timestamp }
└─ Action: Keep connection alive
```

## 8. Lock Lifecycle

```
Lock Lifecycle:
═══════════════

[Create]
   │
   │ acquireFieldLock(caseId, field)
   │
   ▼
[Active] ◄─────────────┐
   │                   │ refreshFieldLock()
   │ expires_in: 30s   │ (optional, extends)
   │                   │
   ├─────────────────────► User edits field
   │
   │ User stops editing
   │ OR
   │ User disconnects
   │ OR
   │ 30 seconds pass
   │
   ▼
[Release]
   │
   │ releaseFieldLock(caseId, field)
   │ OR auto-cleanup
   │
   ▼
[Deleted]
```

## Summary

These diagrams illustrate:

1. **Initial Connection**: How users connect to SSE
2. **Field Edit Flow**: Complete edit cycle with locks
3. **Concurrent Edit**: How locks prevent conflicts
4. **Connection Loss**: Auto-reconnection mechanism
5. **Debouncing**: How rapid typing is batched
6. **Data Flow**: System architecture layers
7. **Messages**: SSE message types and actions
8. **Lock Lifecycle**: From creation to deletion

All flows are designed to:

- ✅ Prevent data conflicts
- ✅ Provide instant feedback
- ✅ Handle edge cases
- ✅ Never disrupt user input
- ✅ Maintain data consistency
