# Fix: SSE Updates Work Even When Expandable Is Open

## Problem

SSE updates weren't reflecting in the expandable row fields because the sync logic was checking `focusedField` state, which was set when ANY field was focused and only cleared on blur. This meant:

❌ When expandable is open and ANY field was previously clicked → No updates
❌ Updates blocked even after clicking away from the field
❌ All fields frozen, not just the one being actively edited

## What User Wanted

✅ Updates should work even when expandable is open
✅ Only prevent updates to the specific field that has active DOM focus (user is typing)
✅ All other fields should update immediately from SSE

## Solution

Changed from using `focusedField` state to checking the actual DOM `activeElement`:

### Before (Broken)

```tsx
useEffect(() => {
  setLocalData((prev) => {
    const newData = { ...case data... };

    // Used focusedField state - stayed set even after blur
    if (focusedField && prev[focusedField] !== undefined) {
      return { ...newData, [focusedField]: prev[focusedField] };
    }

    return newData;
  });
}, [case_, focusedField]); // ❌ Depended on focusedField state
```

### After (Fixed)

```tsx
useEffect(() => {
  // Check actual DOM focus in real-time
  const activeElement = document.activeElement as HTMLElement;
  const activeFieldId = activeElement?.id;
  let currentlyFocusedField: string | null = null;

  if (activeFieldId?.startsWith(`${case_.id}-`)) {
    currentlyFocusedField = activeFieldId.replace(`${case_.id}-`, "");
  }

  setLocalData((prev) => {
    const newData = { ...case data... };

    // Only preserve field that has DOM focus RIGHT NOW
    if (currentlyFocusedField && prev[currentlyFocusedField] !== undefined) {
      return { ...newData, [currentlyFocusedField]: prev[currentlyFocusedField] };
    }

    return newData;
  });
}, [case_]); // ✅ Only depends on case_ - checks DOM each time
```

## How It Works Now

### Scenario 1: Expandable Open, No Field Focused

```
User opens expandable row
  ↓
SSE update arrives
  ↓
useEffect checks document.activeElement
  ↓
Result: null (nothing focused)
  ↓
✅ ALL fields update from case_ prop
```

### Scenario 2: User Typing in "Issues" Field

```
User clicks and types in "Issues"
  ↓
document.activeElement = input#123-issues
  ↓
SSE update arrives (updates "Solutions")
  ↓
useEffect checks document.activeElement
  ↓
Result: "issues" has focus
  ↓
Update localData:
  - issues: 🔒 Keep current value (user typing)
  - solutions: ✅ Update from case_.solutions
  - all other fields: ✅ Update from case_
```

### Scenario 3: User Clicks Away from Field

```
User clicks outside input (blur)
  ↓
document.activeElement = body (or other element)
  ↓
SSE update arrives
  ↓
useEffect checks document.activeElement
  ↓
Result: null (nothing in this case focused)
  ↓
✅ ALL fields update from case_ prop
✅ Including the field that was just edited
```

### Scenario 4: User Switches Between Fields

```
User typing in "Issues"
  ↓
SSE updates "Solutions"
  ↓
✅ "Solutions" updates, "Issues" protected
  ↓
User tabs to "Solutions" field
  ↓
document.activeElement = input#123-solutions
  ↓
SSE updates "Issues"
  ↓
✅ "Issues" updates, "Solutions" protected
```

## Key Differences

| Aspect                | Before (Broken)                 | After (Fixed)            |
| --------------------- | ------------------------------- | ------------------------ |
| **Check Method**      | `focusedField` state            | `document.activeElement` |
| **When Protected**    | From focus until blur           | Only while DOM focused   |
| **Updates when open** | ❌ Blocked if any field touched | ✅ Works fine            |
| **Granularity**       | All or nothing                  | Per-field, real-time     |
| **Dependency**        | `case_` + `focusedField`        | `case_` only             |

## What focusedField Is Still Used For

The `focusedField` state is STILL used for:

1. ✅ Lock management (knowing which field to lock/unlock)
2. ✅ Showing/hiding copy button per field
3. ✅ Visual UI state

But NOT for:

- ❌ ~~Controlling sync updates~~

## Testing

### Test Case 1: Updates When Expandable Open

1. ✅ Open expandable row
2. ✅ Don't click any fields
3. ✅ Have another user update any field via SSE
4. ✅ Verify field updates immediately in your UI

### Test Case 2: Protected While Typing

1. ✅ Open expandable row
2. ✅ Click in "Issues" field and start typing
3. ✅ Have another user update "Issues" via SSE
4. ✅ Verify your typing continues (not overwritten)
5. ✅ Click away from field
6. ✅ Verify field now shows the other user's update

### Test Case 3: Other Fields Update While One Focused

1. ✅ Open expandable row
2. ✅ Click in "Issues" field
3. ✅ Have another user update "Solutions" via SSE
4. ✅ Verify "Solutions" updates while "Issues" stays focused

### Test Case 4: Rapid Field Switching

1. ✅ Open expandable row
2. ✅ Click "Issues" → type → click "Solutions" → type
3. ✅ Have SSE updates come for various fields
4. ✅ Verify only the currently focused field is protected

## Benefits

### 🎯 Precise Protection

- Only the field being actively edited is protected
- All other fields update in real-time

### 🚀 Real-Time Collaboration

- See other users' changes immediately
- Expandable state doesn't block updates

### 🐛 Bug Fixes

- No more "frozen" fields
- No more stale data when expandable is open

### 💡 Simpler Logic

- Checks DOM state directly
- No complex state management
- More predictable behavior

---

**Status:** ✅ Fixed and Ready to Test  
**Date:** October 20, 2025  
**Impact:** Critical for real-time collaboration UX
