# Auto-Save Flow Diagrams

## Visual Explanation of the Race Condition Fix

### Problem: Original Implementation

```
Timeline:
0ms ────────────────────────────────────────────────────────────>
     User types "H"    User types "ello"   User types " World"
            ↓                  ↓                    ↓
         [Schedule]       [Reset Timer]        [During Save!]
            ↓                  ↓                    ↓
         Timer=1s          Timer=1s          Optimistic only
            ↓                  ↓                    ↓
     [Wait 1 second]    [Wait 1 second]    [No new timer!]
            ↓                  ↓
         [Save "Hello"]   [Pending clear]
            ↓
         ❌ " World" lost!

State of pendingUpdates Map:
T=0ms:     {}
T=100ms:   { "1:name": { value: "H", timer: 1s } }
T=500ms:   { "1:name": { value: "Hello", timer: 1s } }
T=1500ms:  { "1:name": { value: "Hello", isSaving: false } }  ← Save starts
T=1700ms:  { "1:name": { value: "Hello World" } }  ← User types, but...
T=3500ms:  {}  ← Save completes, entry removed
           ❌ "Hello World" never saved!
```

### Solution: Improved Implementation

```
Timeline:
0ms ────────────────────────────────────────────────────────────>
     User types "H"    User types "ello"   User types " World"
            ↓                  ↓                    ↓
         [Schedule]       [Reset Timer]      [Detect isSaving]
            ↓                  ↓                    ↓
         Timer=1s          Timer=1s          Mark hasNewerChanges
            ↓                  ↓                    ↓
     [Wait 1 second]    [Wait 1 second]    Update value
            ↓                                       ↓
         [Save "Hello"]                    [Save completes]
            ↓                                       ↓
         Mark isSaving=true               Check hasNewerChanges
            ↓                                       ↓
         [Save to server]                 ✅ Re-schedule save!
            ↓                                       ↓
         Check flags                      [Save "Hello World"]
            ↓                                       ↓
         hasNewerChanges=true             ✅ Success!

State of pendingUpdates Map:
T=0ms:     {}
T=100ms:   { "1:name": { value: "H", timer: 1s, isSaving: false } }
T=500ms:   { "1:name": { value: "Hello", timer: 1s, isSaving: false } }
T=1500ms:  { "1:name": { value: "Hello", isSaving: true } }  ← Save starts
T=1700ms:  { "1:name": { value: "Hello World", isSaving: true, hasNewerChanges: true } }  ← Detected!
T=3500ms:  {}  ← First save done, clear entry
T=3501ms:  { "1:name": { value: "Hello World", timer: 1s, isSaving: false } }  ← Re-scheduled!
T=4501ms:  { "1:name": { value: "Hello World", isSaving: true } }  ← Second save
T=6501ms:  {}  ← Done!
           ✅ "Hello World" saved successfully!
```

## State Machine Diagram

```
┌─────────────┐
│    IDLE     │
│  (no timer) │
└──────┬──────┘
       │
       │ User types
       ↓
┌─────────────┐
│  SCHEDULED  │
│  (debounce) │◄─────────┐
└──────┬──────┘          │
       │                 │
       │ Timer expires   │ New input
       ↓                 │ (resets timer)
┌─────────────┐          │
│   SAVING    │──────────┘
│  (API call) │          (if NOT saving)
└──────┬──────┘
       │
       ├─► [Check hasNewerChanges]
       │
       ├─► If FALSE ────► Clear & Done
       │
       └─► If TRUE ─────► Re-schedule (back to SCHEDULED)
```

## Component Integration Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Component (e.g., Input Field)                               │
│                                                              │
│  onChange(value) {                                           │
│    1. Update local state                                     │
│    2. Call scheduleUpdate(caseId, field, value, onUpdate)   │
│  }                                                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│  Collaborative Editing Store                                 │
│                                                              │
│  scheduleUpdate() {                                          │
│    • Check if already saving ──► Yes ──► Mark hasNewerChanges│
│                   │                                          │
│                   └─► No ──► Schedule debounced timer        │
│                                                              │
│    • On timer expire:                                        │
│      1. Mark isSaving = true                                 │
│      2. Call onUpdate() [API]                                │
│      3. Check hasNewerChanges                                │
│      4. If true, re-schedule                                 │
│      5. If false, clear pending                              │
│  }                                                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│  Server Action / API                                         │
│                                                              │
│  async updateCase(caseId, updates) {                         │
│    await prisma.case.update({ ... })                         │
│    revalidatePath(...)                                       │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
```

## Race Condition: Before vs After

### Scenario: User Types "Test123" Quickly

#### BEFORE (Broken)

```
Keystroke:  T    e    s    t    1    2    3
Time:       0    50   100  150  200  250  300  ...  1000  1050  2000
            │    │    │    │    │    │    │         │     │     │
Timer:      ─────●────×────×────×────×────×─────────✓─────●─────✓
            new  res  res  res  res  res  res       save  new   save
                                                      ↓     ↓     ↓
Value:      T    Te   Tes  Test Test1 Test12 Test123
Saved:                                        "Test"       (❌ Test123 lost)

Legend:
● = New timer started
× = Timer reset
✓ = Timer fired (save)
```

#### AFTER (Fixed)

```
Keystroke:  T    e    s    t    1    2    3
Time:       0    50   100  150  200  250  300  ...  1000  1050  2000  3000
            │    │    │    │    │    │    │         │     │     │     │
Timer:      ─────●────×────×────×────×────×─────────✓─────●─────×─────✓
            new  res  res  res  res  res  res       save  new   res   save
                                                      ↓     ↓           ↓
Value:      T    Te   Tes  Test Test1 Test12 Test123
Saved:                                        "Test"        "Test123" ✅
                                              (has newer)   (re-save)

Detection:                                    [isSaving=true]
                                                    ↓
                                              [hasNewerChanges=true]
                                                    ↓
                                              [Auto re-schedule]
```

## Implementation Checklist

### ✅ What Was Done

- [x] Add `isSaving` flag to `PendingUpdate` type
- [x] Add `hasNewerChanges` flag to `PendingUpdate` type
- [x] Detect when save is in progress
- [x] Mark newer changes during save
- [x] Re-schedule save after completion if needed
- [x] Add helper methods: `isFieldSaving()`, `hasUnsavedChanges()`, `getPendingSaveCount()`
- [x] Create `SaveStatusIndicator` component
- [x] Write comprehensive documentation
- [x] Create usage examples

### 🎯 What's Different

**Old behavior:**

- User types during save → Changes lost
- No way to track save progress
- Manual save button needed as workaround

**New behavior:**

- User types during save → Automatically queued and re-saved
- Helper methods track exact save state
- Manual save button optional (nice-to-have)

### 💡 Usage Examples

**Detect if field is saving:**

```tsx
const isSaving = isFieldSaving(caseId, "customerName");
```

**Show unsaved changes warning:**

```tsx
const hasChanges = hasUnsavedChanges(caseId);
```

**Count pending saves:**

```tsx
const count = getPendingSaveCount();
```

## Testing Strategy

### Unit Test Cases

1. **Basic Save**

   - Type value → Wait → Verify saved

2. **Debounce**

   - Type multiple times → Wait → Verify only 1 save

3. **Race Condition** (the fix!)

   - Type → Save starts → Type more → Verify both saved

4. **Error Handling**

   - Type → Save fails → Verify rollback

5. **Multiple Fields**
   - Type in field A → Type in field B → Verify independent saves

### Manual Test

```
1. Open warranty case form
2. Click in "Customer Name" field
3. Type "John Doe" very quickly (don't pause)
4. Watch save indicator:
   - Should show "Saving..."
   - Should show "Saved!"
   - Should fade out
5. Check database: Should have "John Doe" ✅
6. Try again with pausing mid-typing:
   - Type "Jane"
   - Wait 2 seconds (save happens)
   - Type " Smith"
   - Wait 2 seconds
   - Check database: Should have "Jane Smith" ✅
```

---

**Result:** Race condition eliminated! All user input is now reliably saved.
