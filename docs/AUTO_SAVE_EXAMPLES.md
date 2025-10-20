# Auto-Save Usage Examples

## Basic Field with Auto-Save

```tsx
"use client";

import { useCollaborativeEditingStore } from "@/lib/stores/collaborative-editing-store";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type AutoSaveInputProps = {
  caseId: number;
  field: string;
  initialValue: string;
  onUpdate: (caseId: number, field: string, value: string) => Promise<void>;
};

export function AutoSaveInput({
  caseId,
  field,
  initialValue,
  onUpdate,
}: AutoSaveInputProps) {
  const [value, setValue] = useState(initialValue);
  const { scheduleUpdate, isFieldSaving } = useCollaborativeEditingStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // This will handle the debouncing and queuing automatically
    scheduleUpdate(caseId, field, newValue, onUpdate, 1000);
  };

  const isSaving = isFieldSaving(caseId, field);

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={handleChange}
        placeholder="Type to auto-save..."
        className={isSaving ? "border-blue-400" : ""}
      />
      {isSaving && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        </div>
      )}
    </div>
  );
}
```

## Textarea with Save Status

```tsx
"use client";

import { useCollaborativeEditingStore } from "@/lib/stores/collaborative-editing-store";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Loader2, Check } from "lucide-react";

export function AutoSaveTextarea({
  caseId,
  field,
  initialValue,
  onUpdate,
}: AutoSaveInputProps) {
  const [value, setValue] = useState(initialValue);
  const {
    scheduleUpdate,
    isFieldSaving,
    isEditing,
    startEditing,
    stopEditing,
  } = useCollaborativeEditingStore();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    scheduleUpdate(caseId, field, newValue, onUpdate, 1000);
  };

  const handleFocus = () => {
    startEditing(caseId, field);
  };

  const handleBlur = () => {
    // Don't stop editing immediately - let the save complete
    setTimeout(() => {
      if (!isFieldSaving(caseId, field)) {
        stopEditing(caseId, field);
      }
    }, 500);
  };

  const isSaving = isFieldSaving(caseId, field);
  const isActive = isEditing(caseId, field);

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Type to auto-save..."
        className={isActive ? "ring-2 ring-blue-400" : ""}
      />

      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving changes...</span>
        </div>
      )}
    </div>
  );
}
```

## Form with Global Save Status

```tsx
"use client";

import { useCollaborativeEditingStore } from "@/lib/stores/collaborative-editing-store";
import { SaveStatusIndicator } from "@/components/custom/warranty/save-status-indicator";
import { AutoSaveInput } from "./auto-save-input";

export function WarrantyCaseForm({ caseId, initialData, onUpdate }) {
  const { hasUnsavedChanges, getPendingSaveCount } =
    useCollaborativeEditingStore();

  const hasChanges = hasUnsavedChanges(caseId);
  const pendingCount = getPendingSaveCount();

  return (
    <div className="space-y-4">
      {/* Global save status */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Edit Warranty Case</h3>
        <SaveStatusIndicator caseId={caseId} />
      </div>

      {/* Form fields */}
      <AutoSaveInput
        caseId={caseId}
        field="customerName"
        initialValue={initialData.customerName}
        onUpdate={onUpdate}
      />

      <AutoSaveInput
        caseId={caseId}
        field="customerEmail"
        initialValue={initialData.customerEmail}
        onUpdate={onUpdate}
      />

      {/* Show warning if trying to navigate with unsaved changes */}
      {hasChanges && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You have unsaved changes ({pendingCount} field
            {pendingCount !== 1 ? "s" : ""})
          </p>
        </div>
      )}
    </div>
  );
}
```

## Monitoring Save Progress

```tsx
"use client";

import { useCollaborativeEditingStore } from "@/lib/stores/collaborative-editing-store";
import { useEffect, useState } from "react";

export function useSaveMonitor(caseId?: number) {
  const { pendingUpdates, hasUnsavedChanges, getPendingSaveCount } =
    useCollaborativeEditingStore();

  const [savingFields, setSavingFields] = useState<string[]>([]);

  useEffect(() => {
    // Get list of fields currently being saved
    const fields = Array.from(pendingUpdates.values())
      .filter((update) => {
        const matchesCase = caseId === undefined || update.caseId === caseId;
        return matchesCase && update.isSaving;
      })
      .map((update) => update.field);

    setSavingFields(fields);
  }, [pendingUpdates, caseId]);

  return {
    isSaving: savingFields.length > 0,
    savingFields,
    hasUnsavedChanges:
      caseId !== undefined ? hasUnsavedChanges(caseId) : hasUnsavedChanges(),
    pendingCount: getPendingSaveCount(),
  };
}

// Usage in component
export function WarrantyCaseDetails({ caseId }) {
  const { isSaving, savingFields, hasUnsavedChanges, pendingCount } =
    useSaveMonitor(caseId);

  return (
    <div>
      {isSaving && <p>Currently saving: {savingFields.join(", ")}</p>}
      {hasUnsavedChanges && !isSaving && <p>Pending saves: {pendingCount}</p>}
    </div>
  );
}
```

## Testing the Race Condition Fix

```tsx
// Test component to verify the fix works
export function AutoSaveRaceConditionTest() {
  const { scheduleUpdate, isFieldSaving, hasUnsavedChanges } =
    useCollaborativeEditingStore();

  const [testValue, setTestValue] = useState("");
  const [saveHistory, setSaveHistory] = useState<string[]>([]);

  const mockUpdate = async (caseId: number, field: string, value: string) => {
    // Simulate slow network (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setSaveHistory((prev) => [...prev, `Saved: "${value}"`]);
  };

  const handleFastTyping = () => {
    // Simulate fast typing: type "Hello World" with saves in between
    const chars = "Hello World".split("");
    let accumulated = "";

    chars.forEach((char, i) => {
      accumulated += char;
      setTimeout(() => {
        setTestValue(accumulated);
        scheduleUpdate(999, "testField", accumulated, mockUpdate, 500);
      }, i * 200); // Type every 200ms, faster than debounce
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded">
      <h3 className="font-bold">Race Condition Test</h3>

      <div>
        <button
          onClick={handleFastTyping}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Simulate Fast Typing
        </button>
      </div>

      <div>
        <p>Current Value: {testValue}</p>
        <p>Is Saving: {isFieldSaving(999, "testField") ? "Yes" : "No"}</p>
        <p>Has Unsaved: {hasUnsavedChanges(999) ? "Yes" : "No"}</p>
      </div>

      <div>
        <h4 className="font-semibold">Save History:</h4>
        <ul className="space-y-1">
          {saveHistory.map((entry, i) => (
            <li key={i} className="text-sm">
              {entry}
            </li>
          ))}
        </ul>
      </div>

      <div className="text-sm text-gray-600">
        ✅ Expected: Final value "Hello World" should be saved
        <br />❌ Before fix: Only partial value would be saved
      </div>
    </div>
  );
}
```

## Preventing Navigation with Unsaved Changes

```tsx
"use client";

import { useCollaborativeEditingStore } from "@/lib/stores/collaborative-editing-store";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function usePreventNavigationWithUnsavedChanges(enabled = true) {
  const { hasUnsavedChanges } = useCollaborativeEditingStore();
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, enabled]);
}

// Usage
export function WarrantyCasePage({ caseId }) {
  usePreventNavigationWithUnsavedChanges(true);

  return <div>{/* Your form fields with auto-save */}</div>;
}
```

## Manual Save Trigger

```tsx
"use client";

import { useCollaborativeEditingStore } from "@/lib/stores/collaborative-editing-store";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export function ManualSaveButton({ caseId }: { caseId?: number }) {
  const { hasUnsavedChanges, getPendingSaveCount, pendingUpdates } =
    useCollaborativeEditingStore();

  const hasChanges =
    caseId !== undefined ? hasUnsavedChanges(caseId) : hasUnsavedChanges();

  const handleManualSave = async () => {
    // Force immediate save by resolving all pending updates
    const updates = Array.from(pendingUpdates.values()).filter((update) => {
      return caseId === undefined || update.caseId === caseId;
    });

    // Wait for all to complete (they're already scheduled, just wait)
    // In practice, you might want to expose a "flushAll" method in the store
    await new Promise((resolve) => setTimeout(resolve, 100));
  };

  if (!hasChanges) {
    return null;
  }

  return (
    <Button
      onClick={handleManualSave}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Save className="h-4 w-4" />
      Save Now ({getPendingSaveCount()})
    </Button>
  );
}
```

## Key Takeaways

1. **No Manual Save Needed**: The improved system handles all race conditions automatically
2. **Use Helper Methods**: `isFieldSaving()`, `hasUnsavedChanges()`, `getPendingSaveCount()` for status
3. **Visual Feedback**: Always show users when saves are happening
4. **Field Locking**: Combine with `startEditing()`/`stopEditing()` for collaborative editing
5. **Error Handling**: The store automatically reverts optimistic updates on failure
6. **Testing**: Use the test component to verify the race condition is fixed

## Performance Tips

- Adjust debounce timing based on your needs (default 1000ms)
- Use `caseId` parameter in helper methods to scope checks
- Memoize status indicators to prevent unnecessary re-renders
- Consider batching multiple field updates if changing many fields at once
