# IDT Warranty Management System

A modern, full-featured warranty case management system built with Next.js 15, React 19, and Prisma.

## 🌟 Features

### Core Functionality

- **Google Sheets-like Interface** - Click-to-edit cells with instant updates
- **Expandable Rows** - Accordion-style details for comprehensive case information
- **Smart Dropdowns** - Selectable options with clear/null functionality
- **Auto-save** - All changes automatically persist to database
- **Server-side Search & Filtering** - Fast search with debouncing, multi-filter support
- **Pagination** - Configurable page sizes with total count

### Real-Time Collaboration

- **Live Updates** - Changes appear instantly across all users via SSE
- **Field Locking** - Prevents concurrent edits with visual 🔒 indicators
- **Optimistic Updates** - Instant UI feedback before server confirmation
- **Debounced Saves** - 90% reduction in database queries
- **Auto-Reconnection** - Graceful handling of network issues

### Document Management

- **PDF Generation** - Professional warranty case PDFs with company branding
- **Email Integration** - Send warranty details with PDF attachment to customers
- **Print Support** - Direct PDF download and printing

### Settings & Configuration

- **Branch Management** - Create, edit, delete branches with case counts
- **Staff Management** - Manage staff with color badges and branch assignments
- **Case Scope Management** - Configure warranty case categories
- **Dynamic Sidebar** - Auto-updating navigation based on branches

### Technical

- **Type-safe** - Full TypeScript coverage from database to UI
- **Clean Architecture** - Scalable, maintainable codebase following Next.js 15 conventions
- **Server Components** - Optimal performance with Next.js App Router
- **Authentication** - Secure user authentication with Clerk

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate deploy

# Run development server
npm run dev
```

Visit [http://localhost:3000/branch/1](http://localhost:3000/branch/1)

**For detailed setup instructions, see [QUICK_START.md](./QUICK_START.md)**

## 📚 Documentation

- **[Quick Start Guide](./docs/QUICK_START.md)** - Get up and running quickly
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture and design patterns
- **[Real-Time Collaboration](./docs/REALTIME.md)** - SSE implementation and testing guide
- **[Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md)** - Complete feature list
- **[Database Setup](./docs/DATABASE_SETUP.md)** - Database configuration and seeding
- **[Email Configuration](./docs/EMAIL_CONFIGURATION.md)** - SMTP setup for email features
- **[Settings Documentation](./docs/SETTINGS_DOCUMENTATION.md)** - Settings management guide
- **[Next.js 15 Conventions](./docs/NEXT15_CONVENTIONS.md)** - Next.js patterns and best practices

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI, Lucide React
- **State Management**: Zustand
- **Backend**: Next.js Server Actions, Prisma ORM
- **Real-Time**: Server-Sent Events (SSE)
- **Database**: MySQL
- **Authentication**: Clerk
- **PDF Generation**: @react-pdf/renderer
- **Email**: Nodemailer
- **Forms**: React Hook Form
- **Date Handling**: date-fns

## 📋 Main Features

### Interactive Table

- **Purchase Date** - Formatted display with date picker
- **Service Number** - Click-to-edit with field locking
- **IDT PC?** - Dropdown (Yes/No/Not set)
- **Received By** - Staff selection dropdown with color badges
- **Serviced By** - Staff selection dropdown with color badges
- **Customer Name** - Click-to-edit with field locking
- **Customer Contact** - Click-to-edit with field locking
- **Status** - Dropdown (Pending/In Progress/Completed/Cancelled)
- **Actions** - Print PDF, Send Email buttons

### Expandable Row Details

- Customer Email (with validation)
- Purchase Date (date picker)
- Address (textarea)
- Invoice Number
- Received Items
- PIN Code
- Issues Reported (textarea)
- Solutions Provided (textarea)
- Status Description (textarea)
- Remarks (textarea)
- Cost

### Toolbar Features

- **Search** - Real-time search across case fields (300ms debounce)
- **Status Filter** - Filter by case status
- **Staff Filter** - Filter by assigned staff
- **IDT PC Filter** - Filter by IDT PC flag
- **Date Range** - Filter by date range
- **Create New** - Add new warranty cases
- **Clear Filters** - Reset all filters

### Real-Time Indicators

- **Connection Status** - Green dot (connected), yellow (reconnecting), red (disconnected)
- **Saving Status** - "Saving...", "Saved!", or "Synced!" indicators
- **Field Locks** - 🔒 icon shows when another user is editing a field
- **Tooltips** - Hover to see who is editing locked fields

## 🏗 Project Structure

```
app/
├── branch/[id]/           # Branch-specific warranty cases
│   ├── page.tsx          # Server component
│   ├── actions.ts        # Server actions
│   └── README.md         # Component docs

components/custom/warranty/
├── warranty-case-table.tsx           # Main table
├── editable-text-cell.tsx            # Text editing
├── dropdown-cell.tsx                 # Dropdown selection
└── expandable-row-details.tsx        # Expanded view

lib/
├── stores/               # Zustand stores
├── types/                # TypeScript types
└── generated/prisma/     # Generated Prisma client

prisma/
├── schema.prisma         # Database schema
└── migrations/           # Database migrations
```

## 🎯 Usage

### Editing Data

1. **Click text cells** to edit (Service No, Name, Contact)
2. **Click dropdowns** to select options
3. **Click expand button (▶)** to view/edit all fields
4. **Changes auto-save** on blur or Enter

### Key Shortcuts

- **Enter** - Save and close editing
- **Escape** - Cancel editing
- **Click outside** - Save and close

## 🔄 Future Enhancements

- [ ] Socket.io for real-time collaboration
- [ ] Bulk operations (multi-select)
- [ ] Advanced filtering and search
- [ ] Export to Excel/CSV
- [ ] Audit trail with history
- [ ] Comments and @mentions
- [ ] File attachments
- [ ] Dashboard analytics

## 🤝 Contributing

This project follows clean architecture principles and Next.js best practices. When contributing:

1. Keep server and client components separate
2. Use TypeScript for type safety
3. Follow the existing component patterns
4. Add tests for new features
5. Update documentation

## 📝 Environment Variables

Create a `.env` file:

```env
DATABASE_URL="mysql://user:password@localhost:3306/idt_warranty"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_***
CLERK_SECRET_KEY=sk_***
```

## 🧪 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run server-build # Build with database migrations

# Prisma commands
npx prisma generate       # Generate Prisma Client
npx prisma migrate dev    # Create migration
npx prisma migrate deploy # Apply migrations
npx prisma studio         # Open Prisma Studio
npx prisma db seed        # Seed database
```

## 📄 License

[Your License Here]

## 👥 Authors

[Your Name/Team]

---

**Built with ❤️ using Next.js 15 and React 19**
