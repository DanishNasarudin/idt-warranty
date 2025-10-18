# Warranty History Feature Documentation

## Overview

The warranty history feature provides a comprehensive audit trail of all actions performed on warranty cases within a branch. This includes tracking when cases are created, updated, or deleted, along with who performed the action and what changes were made.

## Database Schema

### WarrantyHistory Table

```prisma
model WarrantyHistory {
  id               Int        @id @default(autoincrement())
  caseId           Int
  case             WarrantyCase @relation(fields: [caseId], references: [id], onUpdate: Cascade, onDelete: Cascade)
  changeType       ChangeType
  changeTs         DateTime   @default(now()) @db.DateTime(3)
  changedByStaffId Int?
  changedBy        Staff?     @relation(fields: [changedByStaffId], references: [id], onUpdate: SetNull, onDelete: SetNull)
  snapshotJson     String?    @db.Text

  @@index([caseId, changeTs], name: "ix_case_changeTs")
}

enum ChangeType {
  INSERT
  UPDATE
  DELETE
}
```

## Features

### 1. Automatic History Tracking

History is automatically recorded when:

- A new warranty case is **created** (INSERT)
- An existing warranty case is **updated** (UPDATE)
- A warranty case is **deleted** (DELETE)

### 2. History Page

Location: `/branch/[id]/history`

The history page displays:

- List of all actions performed on warranty cases in the branch
- Action type (Created, Updated, Deleted) with color-coded badges
- Timestamp of the action
- Staff member who performed the action
- Case details (service number, customer name, status)
- Snapshot of changes (for updates)

### 3. Pagination

- Default: 50 records per page
- Navigation with Previous/Next buttons
- Shows current page and total pages
- Display count of total records

## Implementation Details

### Server Actions

#### `createWarrantyHistory()`

```typescript
async function createWarrantyHistory(
  caseId: number,
  changeType: "INSERT" | "UPDATE" | "DELETE",
  changedByStaffId?: number,
  snapshotJson?: string
): Promise<void>;
```

Creates a new history record in the database.

#### `getWarrantyHistoryByBranch()`

```typescript
async function getWarrantyHistoryByBranch(
  branchId: number,
  page: number = 1,
  pageSize: number = 50
): Promise<{
  records: HistoryRecord[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}>;
```

Fetches paginated history records for a branch.

### Components

#### HistoryList (Client Component)

Location: `/components/custom/warranty/history-list.tsx`

Props:

```typescript
{
  records: HistoryRecord[];
  pagination: Pagination;
  branchId: number;
}
```

Features:

- Displays history records with icons and color-coding
- Expandable details for UPDATE actions showing JSON snapshot
- Staff badge integration
- Pagination controls
- Empty state handling

## Integration Points

### 1. Branch Page Navigation

The main branch page includes a "View History" button in the header that links to the history page.

### 2. Warranty Case Actions

History tracking is integrated into:

- `createWarrantyCase()` - Logs INSERT
- `updateWarrantyCase()` - Logs UPDATE with snapshot
- `deleteWarrantyCase()` - Logs DELETE

## User Interface

### Action Type Indicators

| Action  | Icon     | Color |
| ------- | -------- | ----- |
| Created | FileText | Green |
| Updated | Edit     | Blue  |
| Deleted | Trash2   | Red   |

### History Record Card

Each history record displays:

```
[Icon] [Action Badge] [Service Number] • [Customer Name]
       [Timestamp] • by [Staff Badge]
       [Status Badge]
       [View changes] (expandable for updates)
```

## Future Enhancements

Potential improvements for the history feature:

1. **User-Staff Mapping**: Link Clerk user IDs to Staff records to automatically populate `changedByStaffId`
2. **Filtering**: Add filters for action type, date range, staff member
3. **Search**: Search history by service number or customer name
4. **Export**: Export history to CSV/Excel
5. **Diff Viewer**: Better UI for viewing before/after changes
6. **Case-Specific History**: View history for a single warranty case
7. **Activity Dashboard**: Summary statistics and charts
8. **Real-time Updates**: SSE integration for live history updates

## Usage Example

### Accessing History Page

1. Navigate to a branch page: `/branch/1`
2. Click "View History" button in the header
3. View all historical actions for that branch
4. Use pagination to navigate through records
5. Click "View changes" on UPDATE records to see the snapshot

### Reading History Records

- **Green badge**: A new case was created
- **Blue badge**: A case was updated (click "View changes" to see what changed)
- **Red badge**: A case was deleted

## Technical Notes

### Snapshot Format

For UPDATE actions, the `snapshotJson` field contains a JSON string of the updated fields:

```json
{
  "status": "COMPLETED",
  "solutions": "Replaced battery",
  "cost": 50.0
}
```

### Performance Considerations

- Index on `[caseId, changeTs]` ensures fast queries
- Pagination prevents loading too many records at once
- Server-side rendering provides fast initial load
- Client component for interactive features

### Error Handling

- Custom error page for history route
- Loading states with skeleton UI
- Graceful handling of missing data
- Empty state when no history exists

## API Reference

### Route: `/branch/[id]/history`

**Method**: GET

**Query Parameters**:

- `page` (optional): Page number, default 1

**Response**: Server-rendered HTML page with history records

## Code Files

### New Files Created

1. `/app/branch/[id]/history/page.tsx` - History page component
2. `/app/branch/[id]/history/loading.tsx` - Loading state
3. `/app/branch/[id]/history/error.tsx` - Error boundary
4. `/components/custom/warranty/history-list.tsx` - History list component

### Modified Files

1. `/app/branch/[id]/actions.ts`
   - Updated `updateWarrantyCase()` to log history
   - Added `getWarrantyHistoryByBranch()` function
2. `/app/branch/[id]/page.tsx`
   - Added "View History" navigation button

## Testing Checklist

- [ ] Create a warranty case and verify INSERT history
- [ ] Update a warranty case and verify UPDATE history with snapshot
- [ ] Delete a warranty case and verify DELETE history
- [ ] Navigate to history page and view records
- [ ] Test pagination (create 50+ history records)
- [ ] Verify staff badges display correctly
- [ ] Test expandable change details
- [ ] Verify timestamps display correctly
- [ ] Test empty state (new branch with no history)
- [ ] Test error handling (invalid branch ID)

## Conclusion

The warranty history feature provides complete audit trail capabilities for warranty case management. It automatically tracks all actions, provides an intuitive UI for viewing history, and sets the foundation for future enhancements like filtering, search, and analytics.
