# Design System

A collection of reusable UI components built on top of shadcn/ui to maintain consistency and reduce code duplication throughout the application.

## Components

### ActionButton

A versatile button component for common actions with pre-configured styles, icons, and labels.

#### Features

- Pre-configured action types (create, add, edit, delete, save, cancel, submit, confirm)
- Automatic icon and label assignment
- Built-in loading state support
- Icon-only mode
- Full customization options

#### Usage

```tsx
import { ActionButton } from "@/components/design-system";

// Basic usage with predefined action
<ActionButton action="create" />

// Custom label
<ActionButton action="add" label="Add New Item" />

// With loading state
<ActionButton
  action="save"
  isLoading={isSubmitting}
  loadingText="Saving..."
/>

// Icon only
<ActionButton action="edit" iconOnly />

// Custom action type
<ActionButton
  action="custom"
  label="Custom Action"
  icon={MyCustomIcon}
  variant="secondary"
/>

// As form submit button
<ActionButton
  type="submit"
  action="create"
  label="Create Branch"
/>
```

#### Props

| Prop          | Type            | Default  | Description                                                                        |
| ------------- | --------------- | -------- | ---------------------------------------------------------------------------------- |
| `action`      | `ActionType`    | required | The action type (create, add, edit, delete, save, cancel, submit, confirm, custom) |
| `label`       | `string`        | -        | Custom label to override the default action label                                  |
| `showIcon`    | `boolean`       | `true`   | Whether to show the icon                                                           |
| `icon`        | `LucideIcon`    | -        | Custom icon to override the default action icon                                    |
| `isLoading`   | `boolean`       | `false`  | Whether the button is in a loading state                                           |
| `loadingText` | `string`        | -        | Loading text to show when isLoading is true                                        |
| `variant`     | `ButtonVariant` | -        | Custom variant to override the default action variant                              |
| `iconOnly`    | `boolean`       | `false`  | Whether to show only the icon (no text)                                            |

#### Action Types

| Action    | Icon   | Label   | Variant     |
| --------- | ------ | ------- | ----------- |
| `create`  | Plus   | Create  | default     |
| `add`     | Plus   | Add     | default     |
| `edit`    | Pencil | Edit    | outline     |
| `delete`  | Trash2 | Delete  | destructive |
| `save`    | Save   | Save    | default     |
| `cancel`  | X      | Cancel  | outline     |
| `submit`  | Check  | Submit  | default     |
| `confirm` | Check  | Confirm | default     |
| `custom`  | -      | -       | default     |

---

### IconButton

A button component that displays only an icon, ideal for toolbar actions and table row actions.

#### Features

- Icon-only display with proper accessibility
- Multiple size variants
- Automatic aria-label and title for accessibility
- Full button functionality

#### Usage

```tsx
import { IconButton } from "@/components/design-system";
import { Pencil, Trash2 } from "lucide-react";

// Basic usage
<IconButton
  icon={Pencil}
  label="Edit item"
  onClick={handleEdit}
/>

// Different sizes
<IconButton icon={Trash2} label="Delete" size="sm" />
<IconButton icon={Pencil} label="Edit" size="default" />
<IconButton icon={Save} label="Save" size="lg" />

// Different variants
<IconButton
  icon={Trash2}
  label="Delete item"
  variant="destructive"
  onClick={handleDelete}
/>

<IconButton
  icon={Pencil}
  label="Edit item"
  variant="ghost"
  onClick={handleEdit}
/>

// In a table
<div className="flex gap-2">
  <IconButton
    variant="ghost"
    icon={Pencil}
    label="Edit branch"
    onClick={() => openEditDialog(branch)}
  />
  <IconButton
    variant="ghost"
    icon={Trash2}
    label="Delete branch"
    onClick={() => setDeletingBranch(branch)}
    className="text-destructive hover:text-destructive"
  />
</div>
```

#### Props

| Prop    | Type                        | Default     | Description                           |
| ------- | --------------------------- | ----------- | ------------------------------------- |
| `icon`  | `LucideIcon`                | required    | The icon to display                   |
| `label` | `string`                    | required    | Screen reader label for accessibility |
| `size`  | `"sm" \| "default" \| "lg"` | `"default"` | The size of the button                |

Plus all standard Button props (variant, onClick, disabled, className, etc.)

---

### LoadingButton

A button component with built-in loading state management, automatically showing a spinner when loading.

#### Features

- Automatic loading state handling
- Custom loading text
- Optional icon support
- Auto-disable when loading
- All standard button variants

#### Usage

```tsx
import { LoadingButton } from "@/components/design-system";
import { Save } from "lucide-react";

// Basic usage
<LoadingButton
  isLoading={isSubmitting}
  onClick={handleSubmit}
>
  Submit Form
</LoadingButton>

// With custom loading text
<LoadingButton
  isLoading={isSaving}
  loadingText="Saving changes..."
  onClick={handleSave}
>
  Save
</LoadingButton>

// With icon
<LoadingButton
  isLoading={isCreating}
  icon={Plus}
  onClick={handleCreate}
>
  Create Item
</LoadingButton>

// Different variants
<LoadingButton
  isLoading={isDeleting}
  variant="destructive"
  onClick={handleDelete}
>
  Delete
</LoadingButton>
```

#### Props

| Prop          | Type         | Default  | Description                              |
| ------------- | ------------ | -------- | ---------------------------------------- |
| `isLoading`   | `boolean`    | required | Whether the button is in a loading state |
| `loadingText` | `string`     | -        | Text to display when loading             |
| `icon`        | `LucideIcon` | -        | Icon to display when not loading         |
| `showIcon`    | `boolean`    | `true`   | Whether to show the icon                 |

Plus all standard Button props (variant, size, onClick, disabled, className, etc.)

---

## Examples

### Dialog with Action Buttons

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <ActionButton action="create" label="Create Case" />
  </DialogTrigger>
  <DialogContent>
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Create New Item</DialogTitle>
      </DialogHeader>
      {/* Form fields */}
      <DialogFooter>
        <ActionButton
          type="button"
          action="cancel"
          onClick={() => setOpen(false)}
          disabled={isSubmitting}
        />
        <ActionButton
          type="submit"
          action="create"
          label="Create Item"
          isLoading={isSubmitting}
          loadingText="Creating..."
        />
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Table with Icon Buttons

```tsx
<Table>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>
          <div className="flex gap-2">
            <IconButton
              variant="ghost"
              icon={Pencil}
              label="Edit item"
              onClick={() => handleEdit(item)}
            />
            <IconButton
              variant="ghost"
              icon={Trash2}
              label="Delete item"
              onClick={() => handleDelete(item)}
              className="text-destructive hover:text-destructive"
            />
          </div>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Form with Loading Button

```tsx
<form onSubmit={handleSubmit}>
  <Input name="name" />
  <LoadingButton
    type="submit"
    isLoading={isSubmitting}
    loadingText="Submitting..."
  >
    Submit
  </LoadingButton>
</form>
```

## Best Practices

1. **Use ActionButton for standard actions**: Prefer `ActionButton` over custom `Button` implementations for common actions (create, edit, delete, etc.) to maintain consistency.

2. **Hide icons in dialogs**: For buttons inside dialog footers, set `showIcon={false}` to keep the UI clean and focus on text labels:

   ```tsx
   <DialogFooter>
     <ActionButton action="cancel" showIcon={false} />
     <ActionButton action="save" showIcon={false} />
   </DialogFooter>
   ```

3. **Provide meaningful labels**: Always provide descriptive labels for `IconButton` to ensure accessibility.

4. **Loading states**: Use `ActionButton` with `isLoading` prop or `LoadingButton` for async operations to provide user feedback.

5. **Icon-only buttons in space-constrained areas**: Use `IconButton` in tables, toolbars, or anywhere space is limited.

6. **Consistent variants**: Stick to the predefined variants (default, outline, destructive, etc.) to maintain visual consistency.

## Extending the Design System

To add new components to the design system:

1. Create the component in `components/design-system/`
2. Export it from `components/design-system/index.ts`
3. Document the component in this README
4. Follow the existing patterns for props and styling

## Related

- [shadcn/ui Button](https://ui.shadcn.com/docs/components/button)
- [Lucide Icons](https://lucide.dev/)
