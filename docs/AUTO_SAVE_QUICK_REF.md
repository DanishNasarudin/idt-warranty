# Auto-Save Quick Reference

## TL;DR

**Problem:** Users lose data when typing during auto-save  
**Solution:** Queue changes during save, automatically re-save after completion  
**Status:** ✅ Fixed and ready to use

---

## For Developers

### What Changed?

**In `collaborative-editing-store.ts`:**

- Added save state tracking (`isSaving`, `hasNewerChanges`)
- Auto-queues changes during save
- Auto re-schedules save if needed

**New helpers:**

```tsx
isFieldSaving(caseId, field)      // Is this field saving?
hasUnsavedChanges(caseId?)        // Any unsaved changes?
getPendingSaveCount()             // How many pending saves?
```

### Migration

**Existing code:** ✅ No changes needed! It just works.

**New code:** 💡 Use helper methods for better UX.

---

## Quick Usage

### Basic Auto-Save Input

```tsx
import { useCollaborativeEditingStore } from "@/lib/stores/collaborative-editing-store";

const { scheduleUpdate } = useCollaborativeEditingStore();

<input
  value={value}
  onChange={(e) => {
    setValue(e.target.value);
    scheduleUpdate(caseId, "fieldName", e.target.value, onUpdate, 1000);
  }}
/>;
```

### Show Save Status

```tsx
import { SaveStatusIndicator } from "@/components/custom/warranty/save-status-indicator";

<SaveStatusIndicator caseId={caseId} />;
```

### Check Save State

```tsx
const { isFieldSaving, hasUnsavedChanges } = useCollaborativeEditingStore();

const isSaving = isFieldSaving(caseId, "customerName");
const hasChanges = hasUnsavedChanges(caseId);
```

---

## Testing

### Quick Test

1. Type rapidly in a field
2. Don't pause between keystrokes
3. Verify all text is saved ✅

### Visual Test

Add `<SaveStatusIndicator />` and watch:

- "Saving..." → "Saved!" → "All changes synced" → fade out

---

## Troubleshooting

**Changes not saving?**

- Check console for errors
- Verify `onUpdate` function works
- Use `hasUnsavedChanges()` to check state

**Too many saves?**

- Increase debounce: `scheduleUpdate(..., 2000)` // 2 seconds

**Save indicator won't hide?**

- Check for errors in API calls
- Check network tab for failed requests

---

## Files

- **Store:** `lib/stores/collaborative-editing-store.ts`
- **Component:** `components/custom/warranty/save-status-indicator.tsx`
- **Docs:** `docs/AUTO_SAVE_SUMMARY.md`
- **Examples:** `docs/AUTO_SAVE_EXAMPLES.md`
- **Diagrams:** `docs/AUTO_SAVE_DIAGRAMS.md`

---

## Best Practices

✅ **Do:**

- Show save status to users
- Use appropriate debounce times (1-2 seconds)
- Warn before navigation with unsaved changes
- Test with rapid typing

❌ **Don't:**

- Make debounce too short (< 500ms)
- Hide save errors from users
- Assume saves complete instantly
- Skip testing race conditions

---

## Common Patterns

### Input with Save Indicator

```tsx
<div className="relative">
  <Input value={value} onChange={handleChange} />
  {isFieldSaving(caseId, field) && (
    <Spinner className="absolute right-2 top-1/2 -translate-y-1/2" />
  )}
</div>
```

### Unsaved Changes Warning

```tsx
{
  hasUnsavedChanges() && (
    <Alert variant="warning">You have unsaved changes</Alert>
  );
}
```

### Prevent Navigation

```tsx
useEffect(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges()) {
      e.preventDefault();
      e.returnValue = "Unsaved changes";
    }
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [hasUnsavedChanges]);
```

---

**Questions?** See full docs in `docs/AUTO_SAVE_*.md` files.

---

**Last Updated:** October 20, 2025  
**Version:** 2.0  
**Status:** Production Ready ✅
