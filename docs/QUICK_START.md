# Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

```bash
# Configure your DATABASE_URL in .env
# Example: DATABASE_URL="mysql://user:password@localhost:3306/idt_warranty"

# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# (Optional) Seed database with sample data
npx prisma db seed
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Access the Application

Open [http://localhost:3000/branch/1](http://localhost:3000/branch/1)

Replace `1` with any valid branch ID from your database.

## 📋 Features Overview

### Main Table Columns

1. **Date** - Purchase date (formatted display)
2. **Service No** - Click to edit
3. **IDT PC?** - Dropdown (Yes/No/Not set)
4. **Received By** - Dropdown (select staff)
5. **Serviced By** - Dropdown (select staff)
6. **Name** - Click to edit
7. **Contact** - Click to edit
8. **Status** - Dropdown (4 states)

### Expandable Row Details

Click the expand button (▶) to see:

- Customer Email
- Purchase Date
- Address
- Invoice
- Received Items
- PIN
- Issues
- Solutions
- Status Description
- Remarks
- Cost
- Locker

## 💡 Usage Tips

### Editing Text Fields

1. Click the cell
2. Type your changes
3. Press **Enter** or click outside to save
4. Press **Escape** to cancel

### Using Dropdowns

1. Click the cell to open dropdown
2. Select an option
3. Click **X** to clear (where applicable)
4. Changes save automatically

### Expanding Rows

1. Click the **▶** button on the left
2. Edit any field in the expanded section
3. Changes save automatically when you leave the field

## 🎯 Common Tasks

### View all cases for a branch

```
/branch/[branchId]
```

### Edit a case

Simply click any editable cell and make changes.

### Assign staff to a case

Click the "Received By" or "Serviced By" dropdown and select staff.

### Update case status

Click the "Status" dropdown and select the new status.

### Add detailed information

Click the expand button and fill in the additional fields.

## 🛠 Development

### Project Structure

```
app/branch/[id]/
├── page.tsx         # Main page (server component)
├── actions.ts       # Server actions (database operations)
├── loading.tsx      # Loading state
└── error.tsx        # Error boundary

components/custom/warranty/
├── warranty-case-table.tsx           # Main table
├── editable-text-cell.tsx            # Text editing
├── dropdown-cell.tsx                 # Dropdown selection
└── expandable-row-details.tsx        # Expanded view

lib/
├── stores/warranty-case-store.ts     # State management
└── types/warranty.ts                 # TypeScript types
```

### Key Technologies

- **Next.js 15** - App Router, Server Components
- **React 19** - Latest React
- **Prisma** - Database ORM
- **Zustand** - State management
- **Shadcn UI** - Component library
- **TypeScript** - Type safety

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="mysql://user:password@localhost:3306/idt_warranty"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Clerk Authentication (if configured)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_***
CLERK_SECRET_KEY=sk_***
```

## 📚 Additional Documentation

- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Detailed feature list
- [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md) - System architecture
- [Database Setup](./DATABASE_SETUP.md) - Database configuration
- [Component README](./app/branch/[id]/README.md) - Component details

## ⚠️ Important Notes

### Auto-save

All changes are automatically saved when you:

- Press Enter in a text field
- Click outside a text field
- Select an option in a dropdown
- Move to another field in the expanded view

### Real-time Updates (Coming Soon)

The architecture is prepared for Socket.io integration to enable:

- Live updates across multiple users
- Conflict resolution
- Presence indicators

### Performance

- Server-side rendering for fast initial load
- Optimistic updates for instant feedback
- Efficient state management with Zustand

## 🐛 Troubleshooting

### Issue: Table shows "No warranty cases found"

**Solution**:

1. Check if you have data in the database
2. Verify the branch ID exists
3. Run the seed script: `npx prisma db seed`

### Issue: Changes not saving

**Solution**:

1. Check browser console for errors
2. Verify DATABASE_URL is correct
3. Ensure database is running

### Issue: Cannot access /branch/[id]

**Solution**:

1. Start the dev server: `npm run dev`
2. Verify the branch ID exists in database
3. Check for errors in terminal

## 🎉 Next Steps

1. **Add more branches** - Create branches in the database
2. **Add staff members** - Create staff and assign to branches
3. **Import existing data** - Use Prisma to import from existing sources
4. **Customize fields** - Modify the table columns as needed
5. **Add Socket.io** - Enable real-time collaboration

## 📞 Need Help?

- Review the [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for detailed information
- Check the [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) for system design
- Inspect the component files for inline documentation

---

**Happy warranty case management! 🎊**
