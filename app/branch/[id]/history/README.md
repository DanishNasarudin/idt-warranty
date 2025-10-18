# History Route

This directory contains the warranty history page for each branch.

## Route Structure

```
/branch/[id]/history
```

## Files

- `page.tsx` - Main history page component (Server Component)
- `loading.tsx` - Loading skeleton UI
- `error.tsx` - Error boundary for error handling

## Features

- View all warranty case actions (Create, Update, Delete)
- Pagination support (50 records per page)
- Staff attribution for each action
- Timestamp display
- Snapshot viewer for updates
- Link back to branch page

## Usage

From the branch page, click the "View History" button to access this page.

## Data Flow

1. Server fetches history records from database
2. Records are paginated server-side
3. Client component renders interactive elements (pagination, expandables)
4. Loading states handled automatically by Next.js

## See Also

- [WARRANTY_HISTORY_FEATURE.md](/docs/WARRANTY_HISTORY_FEATURE.md) - Complete documentation
- [history-list.tsx](/components/custom/warranty/history-list.tsx) - List component
