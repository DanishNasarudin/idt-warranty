# Search Debounce Implementation Guide

## Overview

The search functionality uses a **500ms debounce** to prevent excessive server calls while maintaining a responsive user interface.

## Visual Flow

```
User Types: "hello"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Character    Local State    Timer         Server Call    UI State
─────────    ───────────    ─────         ───────────    ────────
   h      →  h              Start 500ms   -             Enabled ✓
   e      →  he             Reset 500ms   -             Enabled ✓
   l      →  hel            Reset 500ms   -             Enabled ✓
   l      →  hell           Reset 500ms   -             Enabled ✓
   o      →  hello          Reset 500ms   -             Enabled ✓
[wait]                      500ms done!
                                       →  API Call       Enabled ✓
                                       ←  Results        Enabled ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Result: 1 server call instead of 5!
```

## Without Debounce (Old Behavior)

```
User Types: "hello"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Character    Server Call    UI State
─────────    ───────────    ────────
   h      →  API Call       Disabled ✗
   e      →  API Call       Disabled ✗
   l      →  API Call       Disabled ✗
   l      →  API Call       Disabled ✗
   o      →  API Call       Disabled ✗

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Result: 5 server calls! Input freezes on each keystroke!
```

## Implementation Details

### 1. Optimistic Updates

```typescript
const [searchValue, setSearchValue] = useState(filters.search);

const handleSearchChange = (value: string) => {
  // Update local state immediately - no delay!
  setSearchValue(value);

  // Debounce the server call
  debounceTimerRef.current = setTimeout(() => {
    updateSearchParams({ search: value }, false);
  }, 500);
};
```

### 2. Timer Management

```typescript
const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

// Clear timer on new keystroke
if (debounceTimerRef.current) {
  clearTimeout(debounceTimerRef.current);
}

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };
}, []);
```

### 3. Sync with URL

```typescript
// Sync local state when URL changes (browser back/forward)
useEffect(() => {
  setSearchValue(filters.search);
}, [filters.search]);
```

### 4. Different Behavior for Different Controls

| Control Type | Behavior          | Reason                         |
| ------------ | ----------------- | ------------------------------ |
| Search Input | Debounced (500ms) | Prevents spam during typing    |
| Dropdowns    | Immediate         | User makes deliberate choice   |
| Buttons      | Immediate         | Single click action            |
| Reset Button | Immediate         | Clear action should be instant |

## Performance Metrics

### Average Search Query (8 characters)

- **Without Debounce**: ~8 server calls
- **With Debounce**: 1 server call
- **Reduction**: 87.5%

### Fast Typing Scenario (20 characters in 2 seconds)

- **Without Debounce**: ~20 server calls
- **With Debounce**: 1-2 server calls
- **Reduction**: 90-95%

## Configuration

The debounce delay can be adjusted in `table-toolbar.tsx`:

```typescript
debounceTimerRef.current = setTimeout(() => {
  updateSearchParams({ search: value }, false);
}, 500); // ← Adjust this value (in milliseconds)
```

### Recommended Values

- **300ms**: Very responsive, still prevents most duplicate calls
- **500ms**: Balanced (current setting)
- **700ms**: More conservative, better for slower servers
- **1000ms**: Very conservative, may feel sluggish

## Reusable Hooks

Created in `/lib/hooks/use-debounce.ts`:

### 1. useDebounce (for values)

```typescript
const debouncedSearchTerm = useDebounce(searchTerm, 500);

useEffect(() => {
  // This only runs 500ms after searchTerm stops changing
  fetchResults(debouncedSearchTerm);
}, [debouncedSearchTerm]);
```

### 2. useDebouncedCallback (for functions)

```typescript
const debouncedSave = useDebouncedCallback((data) => {
  saveToServer(data);
}, 500);

// Call it as many times as you want
debouncedSave(formData); // Only saves after 500ms of no calls
```

## Testing

### Manual Testing Checklist

- [ ] Type quickly in search - should only see 1 network request
- [ ] Type, wait, type more - should see 2 requests
- [ ] Change dropdown - should update immediately
- [ ] Click reset - should clear immediately
- [ ] Use browser back button - search value should update
- [ ] Input should never freeze or become disabled

### Edge Cases Handled

✅ Component unmount during debounce (timer cleared)
✅ Rapid filter changes (previous timers cancelled)
✅ Browser navigation (local state syncs with URL)
✅ Reset during pending debounce (timer cleared immediately)
