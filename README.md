# IDT Warranty Management System

A modern, full-featured warranty case management system built with Next.js 15, React 19, and Prisma.

## 🌟 Features

- **Google Sheets-like Interface** - Click-to-edit cells with instant updates
- **Expandable Rows** - Accordion-style details for comprehensive case information
- **Smart Dropdowns** - Selectable options with clear/null functionality
- **Auto-save** - All changes automatically persist to database
- **Type-safe** - Full TypeScript coverage from database to UI
- **Clean Architecture** - Scalable, maintainable codebase
- **Server Components** - Optimal performance with Next.js App Router
- **Real-time Ready** - Architecture prepared for Socket.io integration

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

- **[Quick Start Guide](./QUICK_START.md)** - Get up and running quickly
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Complete feature list and details
- **[Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)** - System architecture and data flow
- **[Database Setup](./DATABASE_SETUP.md)** - Database configuration and seeding
- **[Component Documentation](./app/branch/[id]/README.md)** - Detailed component guide

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI, Lucide React
- **State Management**: Zustand
- **Backend**: Next.js Server Actions, Prisma ORM
- **Database**: MySQL
- **Authentication**: Clerk (optional)

## 📋 Main Features

### Interactive Table

- Purchase Date column with formatted display
- Service Number - click-to-edit
- IDT PC? - dropdown (Yes/No/Not set)
- Received By - staff selection dropdown
- Serviced By - staff selection dropdown
- Customer Name - click-to-edit
- Customer Contact - click-to-edit
- Status - dropdown (4 states)

### Expandable Row Details

- Customer Email
- Purchase Date
- Address
- Invoice
- Received Items
- PIN
- Issues & Solutions
- Status Description
- Remarks
- Cost & Locker

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
