# Color Reference Guide

## IDT PC Badge Colors

| Value   | Color     | Tailwind Classes                                                     | Visual Description       |
| ------- | --------- | -------------------------------------------------------------------- | ------------------------ |
| Yes     | Primary   | `bg-primary text-primary-foreground border-primary/20`               | Brand color - stands out |
| No      | Gray      | `bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20` | Neutral gray             |
| Not set | Secondary | `bg-secondary/50 text-secondary-foreground/70 border-secondary/20`   | Muted/subtle             |

## Status Badge Colors (Progressive Scale)

Status colors follow a natural progression from urgent (red) to complete (green):

| Status      | Color  | Tailwind Classes                                                             | Visual Description             |
| ----------- | ------ | ---------------------------------------------------------------------------- | ------------------------------ |
| IN_QUEUE    | Red    | `bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20`             | Urgent - needs attention       |
| IN_PROGRESS | Orange | `bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20` | Active - work in progress      |
| WAITING_FOR | Yellow | `bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20` | Blocked - waiting on something |
| COMPLETED   | Green  | `bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20`     | Done - success state           |

## Design Rationale

### Color Progression

The status colors create a visual "traffic light" system that users intuitively understand:

- **Red**: Stop/Urgent - Cases that need to be picked up
- **Orange**: Caution/Active - Cases being worked on
- **Yellow**: Wait/Blocked - Cases waiting for external factors
- **Green**: Go/Success - Cases completed

### Opacity & Contrast

All colors use:

- 10% opacity backgrounds for subtle backgrounds
- Full opacity foreground colors for text
- 20% opacity borders for definition
- Dark mode variants for accessibility

### Hover States

All badges include hover states (e.g., `hover:bg-{color}-500/20`) that:

- Increase opacity by 10% on hover
- Provide clear interactive feedback
- Maintain readability

## Usage Examples

### In Components

```tsx
import { getStatusColor, getIdtPcClassName } from "@/lib/utils/status-colors";

// For status badges
<Badge className={getStatusColor(CaseStatus.IN_PROGRESS)}>
  In Progress
</Badge>

// For IDT PC badges
<Badge className={getIdtPcClassName(true)}>
  Yes
</Badge>
```

### In Options Arrays

```tsx
const STATUS_OPTIONS = [
  {
    label: "In Queue",
    value: CaseStatus.IN_QUEUE,
    className: getStatusColor(CaseStatus.IN_QUEUE),
  },
  // ... more options
];
```

## Accessibility Considerations

1. **Color is not the only indicator**: Labels always accompany colors
2. **High contrast ratios**: All color combinations meet WCAG AA standards
3. **Dark mode support**: Separate color variants for dark mode
4. **Focus states**: Clear focus indicators for keyboard navigation

## Future Extensions

These color utilities can be extended for:

- **Priority levels**: High, Medium, Low
- **Payment status**: Paid, Pending, Overdue
- **Branch indicators**: Different colors per branch
- **Custom status types**: User-defined workflow states
