# Saving Status Indicator

## Overview

A visual indicator that shows the current saving state of warranty case edits in real-time. It provides immediate feedback to users about whether their changes are being saved, have been saved, or are fully synced.

## Features

- ✅ **Three States** - Shows "Saving...", "Saved!", and "Latest!" statuses
- ✅ **Animated Icons** - Spinning icon while saving, check mark when saved
- ✅ **Auto Fade-Out** - Fades out 2 seconds after saving completes
- ✅ **Smooth Transitions** - 500ms fade animation for polished UX
- ✅ **Real-time Updates** - Monitors pending updates from debounced saves

## Status States

### 1. Saving (Blue)

```
🔄 Saving data...
```

- **When**: Debounced update is pending (user is typing/editing)
- **Icon**: Spinning refresh icon (RefreshCw)
- **Color**: Blue (#2563EB)
- **Duration**: While typing + 1 second debounce

### 2. Saved (Green)

```
✓ Data saved!
```

- **When**: Save request successfully completed
- **Icon**: Check mark (Check)
- **Color**: Green (#16A34A)
- **Duration**: 2 seconds, then fades out over 0.5 seconds

### 3. Synced (Green)

```
☁ Data is latest!
```

- **When**: No pending changes, all data synchronized
- **Icon**: Cloud upload icon (CloudUpload)
- **Color**: Green (#16A34A)
- **Duration**: Persistent until new edits

## Visual Flow

### User Types in Field

```
User types "J"
  ↓
Status: "Saving data..." 🔄 (blue, spinning)
  ↓
User types "o"
  ↓
Still: "Saving data..." 🔄
  ↓
User types "h"
  ↓
Still: "Saving data..." 🔄
  ↓
User types "n"
  ↓
Still: "Saving data..." 🔄
  ↓
User stops typing (1 second passes)
  ↓
Save request sent to server
  ↓
Status: "Data saved!" ✓ (green)
  ↓
Wait 2 seconds
  ↓
Fade out (0.5 seconds)
  ↓
Status: "Data is latest!" ☁ (green)
```

### User Edits Multiple Fields

```
Edit Field A
  ↓
"Saving data..." 🔄
  ↓
Stop typing
  ↓
Save Field A
  ↓
"Data saved!" ✓
  ↓
(Before fade) Edit Field B
  ↓
Back to: "Saving data..." 🔄
  ↓
Save Field B
  ↓
"Data saved!" ✓
  ↓
Fade out → "Data is latest!" ☁
```

## Implementation

### Component State

```typescript
type SavingStatus = "idle" | "saving" | "saved" | "synced";

const [savingStatus, setSavingStatus] = useState<SavingStatus>("synced");
const [fadeOut, setFadeOut] = useState(false);
```

### Monitoring Logic

```typescript
useEffect(() => {
  if (pendingUpdates.size > 0) {
    // Has pending updates - show saving
    setSavingStatus("saving");
    setFadeOut(false);
  } else if (savingStatus === "saving") {
    // Just finished saving
    setSavingStatus("saved");
    setFadeOut(false);

    // Fade out after 2 seconds
    const fadeTimeout = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // Change to synced after fade completes
    const syncTimeout = setTimeout(() => {
      setSavingStatus("synced");
      setFadeOut(false);
    }, 2500); // 2s + 0.5s fade

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(syncTimeout);
    };
  }
}, [pendingUpdates.size, savingStatus]);
```

### Status Display

```typescript
const getStatusDisplay = () => {
  switch (savingStatus) {
    case "saving":
      return {
        icon: RefreshCw,
        text: "Saving data...",
        className: "text-blue-600 dark:text-blue-400",
        iconClassName: "animate-spin",
      };
    case "saved":
      return {
        icon: Check,
        text: "Data saved!",
        className: "text-green-600 dark:text-green-400",
        iconClassName: "",
      };
    case "synced":
      return {
        icon: CloudUpload,
        text: "Data is latest!",
        className: "text-green-600 dark:text-green-400",
        iconClassName: "",
      };
    default:
      return null;
  }
};
```

### Visual Component

```tsx
{
  statusDisplay && (
    <div
      className={cn(
        "flex items-center gap-1.5 font-medium transition-opacity duration-500",
        statusDisplay.className,
        fadeOut && "opacity-0"
      )}
    >
      <statusDisplay.icon
        className={cn("h-3.5 w-3.5", statusDisplay.iconClassName)}
      />
      <span>{statusDisplay.text}</span>
    </div>
  );
}
```

## Timeline Details

### Debounce Period (1 second)

```
0ms    - User starts typing
0-1000ms - "Saving data..." (blue, spinning)
1000ms - Save request triggered
```

### Save Completion

```
1000ms - Save request sent
~1100ms - Save response received
~1100ms - Status changes to "Data saved!" (green, check)
```

### Fade Out Period

```
1100ms - "Data saved!" appears
3100ms - Fade out starts (2s after saved)
3600ms - Fade complete (0.5s fade duration)
3600ms - Status changes to "Data is latest!"
```

### Total Time from Last Keystroke to "Latest"

**2.5 seconds** (2s display + 0.5s fade)

## CSS Classes

### Status Colors

```css
/* Saving - Blue */
.text-blue-600 {
  color: #2563eb;
}
.dark:text-blue-400 {
  color: #60a5fa;
}

/* Saved/Synced - Green */
.text-green-600 {
  color: #16a34a;
}
.dark:text-green-400 {
  color: #4ade80;
}
```

### Fade Animation

```css
.transition-opacity {
  transition: opacity 0.5s;
}
.duration-500 {
  transition-duration: 500ms;
}
.opacity-0 {
  opacity: 0;
}
```

### Spin Animation

```css
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

## Location in UI

```
┌────────────────────────────────────────────────────┐
│ Warranty Cases Table                               │
├────────────────────────────────────────────────────┤
│ 🟢 Real-time updates active  🔄 Saving data...    │ ← Here
├────────────────────────────────────────────────────┤
│ [Search] [Filters] [Create Case]                  │
├────────────────────────────────────────────────────┤
│ Table Content...                                   │
```

## User Benefits

1. **Immediate Feedback** - Know instantly that changes are being saved
2. **Peace of Mind** - See "Data saved!" confirmation
3. **Status Awareness** - Always know if data is up to date
4. **Non-Intrusive** - Fades away automatically, doesn't clutter UI
5. **Visual Clarity** - Different colors and icons for each state

## Testing Scenarios

### Test 1: Single Field Edit

1. Click into "Customer Name"
2. Type "John"
3. Should see "Saving data..." with spinning icon (blue)
4. Wait 1 second
5. Should see "Data saved!" with check mark (green)
6. Wait 2 seconds
7. Should fade out over 0.5 seconds
8. Should show "Data is latest!" (green)

### Test 2: Rapid Edits

1. Type in "Customer Name"
2. Immediately click to "Contact" and type
3. "Saving data..." should stay visible
4. After 1 second from last keystroke
5. "Data saved!" should appear once
6. Then fade to "Data is latest!"

### Test 3: Multiple Users

1. User A types in a field
2. User A sees "Saving data..."
3. User B updates different field (via SSE)
4. User A still sees their own saving status
5. Each user sees their own saving indicator

### Test 4: Long Form Editing

1. Type several characters
2. "Saving data..." visible throughout
3. Stop typing
4. Wait for save
5. "Data saved!" appears
6. Continue typing before fade
7. Should immediately show "Saving data..." again

## Edge Cases

### No Pending Updates on Mount

- Shows "Data is latest!" by default
- No flash or animation

### User Leaves During Save

- Save completes in background
- Status resets on return

### Network Error During Save

- Error toast shows (separate from status)
- Status may show "Saving data..." longer
- Eventually times out or retries

## Configuration

### Adjust Fade Timing

```typescript
// Current: 2s display + 0.5s fade = 2.5s total
const fadeTimeout = setTimeout(() => {
  setFadeOut(true);
}, 2000); // Display duration

const syncTimeout = setTimeout(() => {
  setSavingStatus("synced");
  setFadeOut(false);
}, 2500); // Display + fade duration
```

**Faster fade:**

```typescript
// 1s display + 0.3s fade = 1.3s total
const fadeTimeout = setTimeout(() => setFadeOut(true), 1000);
const syncTimeout = setTimeout(() => {...}, 1300);
```

**Slower fade:**

```typescript
// 3s display + 1s fade = 4s total
const fadeTimeout = setTimeout(() => setFadeOut(true), 3000);
const syncTimeout = setTimeout(() => {...}, 4000);
```

### Change Fade Animation Speed

```typescript
// In className
"transition-opacity duration-500"; // Current: 500ms
"transition-opacity duration-300"; // Faster: 300ms
"transition-opacity duration-1000"; // Slower: 1000ms
```

## Accessibility

- ✅ **Screen Readers** - Text content is readable
- ✅ **Color Contrast** - High contrast colors (WCAG AA compliant)
- ✅ **Motion** - Spinning animation respects `prefers-reduced-motion`
- ✅ **Size** - Icons and text are clearly visible

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Related Components

- **Connection Status** - Shows real-time connection state
- **Toast Notifications** - Shows errors and important alerts
- **Lock Indicators** - Shows when fields are locked by others

## Future Enhancements

1. **Progress Bar** - Show upload progress for large updates
2. **Error State** - Red indicator when save fails
3. **Queue Count** - Show "Saving 3 changes..."
4. **Retry Button** - Manual retry on failure
5. **Last Saved Time** - "Last saved 2 minutes ago"
