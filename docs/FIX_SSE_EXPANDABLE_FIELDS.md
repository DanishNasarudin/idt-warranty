# Fix: SSE Updates Not Reflecting in Expandable Fields

## Problem

When SSE (Server-Sent Events) updates came in from other users, the expandable row detail fields weren't updating in the UI, even though the `case_` prop was changing correctly.

## Root Cause

The sync effect in `expandable-row-details.tsx` was checking the DOM's `activeElement` to determine which field was focused, but it wasn't properly using the component's `focusedField` state. This caused the logic to fail in detecting which field was actually being edited.

### Before (Broken)

```tsx
useEffect(() => {
  // Check DOM activeElement
  const activeElement = document.activeElement;
  const activeFieldId = activeElement?.id;
  let focusedFieldName: string | null = null;

  if (activeFieldId?.startsWith(`${case_.id}-`)) {
    focusedFieldName = activeFieldId.replace(`${case_.id}-`, "");
  }

  setLocalData((prev) => {
    const newData = { ...case data... };

    // This check often failed
    if (focusedFieldName && prev[focusedFieldName as keyof typeof prev]) {
      return {
        ...newData,
        [focusedFieldName]: prev[focusedFieldName as keyof typeof prev],
      };
    }

    return newData;
  });
}, [case_]); // ❌ Missing focusedField dependency
```

**Issues:**

1. ❌ DOM `activeElement` check was unreliable
2. ❌ Not using the `focusedField` state managed by `handleFocus`/`handleBlur`
3. ❌ Missing `focusedField` in dependencies array
4. ❌ Complex field name extraction logic

## Solution

Use the component's `focusedField` state directly, which is already properly managed by the `handleFocus` and `handleBlur` handlers.

### After (Fixed)

```tsx
useEffect(() => {
  setLocalData((prev) => {
    const newData = {
      customerEmail: case_.customerEmail || "",
      address: case_.address || "",
      // ... all other fields
    };

    // If a field is currently focused, keep its local value
    if (focusedField && prev[focusedField as keyof typeof prev] !== undefined) {
      return {
        ...newData,
        [focusedField]: prev[focusedField as keyof typeof prev],
      };
    }

    return newData;
  });
}, [case_, focusedField]); // ✅ Proper dependencies
```

**Improvements:**

1. ✅ Uses reliable `focusedField` state
2. ✅ Simpler logic - no DOM querying needed
3. ✅ Proper React dependency tracking
4. ✅ Updates immediately when `focusedField` changes

## How It Works Now

### Scenario 1: User is NOT editing any field

```
SSE update arrives
  ↓
case_ prop changes
  ↓
useEffect triggers
  ↓
focusedField is null
  ↓
✅ All fields update from case_ prop
  ↓
User sees changes immediately
```

### Scenario 2: User IS editing "issues" field

```
SSE update arrives (updates "solutions" field)
  ↓
case_ prop changes
  ↓
useEffect triggers
  ↓
focusedField = "issues"
  ↓
setLocalData updates:
  - solutions: ✅ Updates from case_.solutions
  - issues: 🔒 Keeps prev["issues"] (user's input)
  - all other fields: ✅ Update from case_
  ↓
User's typing in "issues" is preserved
Other fields update correctly
```

### Scenario 3: User finishes editing "issues"

```
User clicks away (blur event)
  ↓
handleBlur called
  ↓
setFocusedField(null)
  ↓
useEffect triggers (focusedField changed)
  ↓
focusedField is now null
  ↓
✅ All fields update from case_ prop
  ↓
Including any SSE updates that came during editing
```

## Testing

### Test Case 1: Updates to non-focused fields

1. ✅ Open expandable row
2. ✅ Focus on "Issues" field
3. ✅ Have another user update "Solutions" field
4. ✅ Verify "Solutions" updates in UI while "Issues" stays editable

### Test Case 2: Updates to all fields when not editing

1. ✅ Open expandable row
2. ✅ Don't focus any field
3. ✅ Have another user update any field
4. ✅ Verify all fields update immediately

### Test Case 3: Updates after finishing edit

1. ✅ Open expandable row
2. ✅ Focus and type in "Issues" field
3. ✅ While typing, another user updates "Issues"
4. ✅ Your typing is preserved (not overwritten)
5. ✅ When you blur, your changes save
6. ✅ If you re-focus, you see your saved value

## Code Changes

**File:** `components/custom/warranty/expandable-row-details.tsx`

**Changes:**

1. Removed DOM `activeElement` querying
2. Removed field name extraction logic
3. Use `focusedField` state directly
4. Added `focusedField` to dependencies array
5. Simplified the preserve logic

## Benefits

### 🐛 Bug Fixes

- ✅ SSE updates now properly reflect in UI
- ✅ Non-focused fields update in real-time
- ✅ Focused field input is preserved correctly

### 🎯 Reliability

- ✅ No reliance on DOM state
- ✅ Proper React state management
- ✅ Correct dependency tracking

### 🧹 Code Quality

- ✅ Simpler logic (less code)
- ✅ More maintainable
- ✅ Follows React best practices

## Related Features

This fix works seamlessly with:

- ✅ Auto-save with race condition protection (from previous fix)
- ✅ Field locking system
- ✅ Real-time collaboration via SSE
- ✅ Optimistic updates
- ✅ Debounced saves

## Additional Notes

### Why focusedField works better than activeElement

**activeElement issues:**

- Can be `null` or point to wrong element
- Timing issues (might not be updated yet)
- Doesn't track React component state
- Can be affected by other UI interactions

**focusedField benefits:**

- Directly managed by our handlers
- Always in sync with component state
- Explicit and predictable
- Works with React's reconciliation

### Cell Updates

**Question:** Are table cells using the new saving feature?

**Answer:** Yes! Table cells (`EditableTextCell`) already use the improved saving:

- They call `onSave` → `handleUpdate` → `onUpdateField`
- `onUpdateField` uses the improved `scheduleUpdate` from store
- Race condition protection applies automatically
- Saves happen on blur/enter (not real-time typing)

The difference is:

- **Expandable fields**: Save as you type (1.5s debounce)
- **Table cells**: Save on blur/enter (immediate)

Both use the race condition fix, so no data loss in either case!

---

**Status:** ✅ Fixed and Tested  
**Date:** October 20, 2025  
**Impact:** Critical - Enables proper real-time collaboration
