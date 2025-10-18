# Database Setup Guide

## Prerequisites

- MySQL database running
- `.env` file with `DATABASE_URL` configured

## Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="mysql://user:password@localhost:3306/idt_warranty"
```

## Generate Prisma Client

The Prisma client is already configured to output to `lib/generated/prisma/`.

Run the following command to generate the client:

```bash
npx prisma generate
```

This will create the Prisma Client in `lib/generated/prisma/` which is already configured in your schema.

## Apply Migrations

To apply existing migrations:

```bash
npx prisma migrate deploy
```

Or to create a new migration (in development):

```bash
npx prisma migrate dev --name your_migration_name
```

## Seed Database (Optional)

Create a seed file `prisma/seed.ts`:

```typescript
import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Create branches
  const branch1 = await prisma.branch.create({
    data: {
      code: "AP",
      name: "Ampang Park",
    },
  });

  // Create case scopes
  const localScope = await prisma.caseScope.create({
    data: {
      code: "LOCAL",
    },
  });

  const otherScope = await prisma.caseScope.create({
    data: {
      code: "OTHER",
    },
  });

  // Create staff
  const staff1 = await prisma.staff.create({
    data: {
      name: "John Doe",
      color: "#3B82F6",
      branches: {
        create: {
          branchId: branch1.id,
        },
      },
    },
  });

  const staff2 = await prisma.staff.create({
    data: {
      name: "Jane Smith",
      color: "#10B981",
      branches: {
        create: {
          branchId: branch1.id,
        },
      },
    },
  });

  // Create sample warranty cases
  await prisma.warrantyCase.create({
    data: {
      serviceNo: "SRV-001",
      branchId: branch1.id,
      scopeId: localScope.id,
      status: "IN_QUEUE",
      customerName: "Alice Johnson",
      customerContact: "+60123456789",
      customerEmail: "alice@example.com",
      purchaseDate: new Date("2024-01-15"),
      receivedItems: "Laptop, Charger",
      issues: "Screen not turning on",
      idtPc: true,
      receivedByStaffId: staff1.id,
    },
  });

  await prisma.warrantyCase.create({
    data: {
      serviceNo: "SRV-002",
      branchId: branch1.id,
      scopeId: localScope.id,
      status: "IN_PROGRESS",
      customerName: "Bob Wilson",
      customerContact: "+60129876543",
      customerEmail: "bob@example.com",
      purchaseDate: new Date("2024-02-20"),
      receivedItems: "Desktop PC",
      issues: "Won't boot up",
      solutions: "Checking hardware components",
      idtPc: false,
      receivedByStaffId: staff1.id,
      servicedByStaffId: staff2.id,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Install tsx if needed:

```bash
npm install -D tsx
```

Run the seed:

```bash
npx prisma db seed
```

## Verify Setup

Check if everything is working:

```bash
# Open Prisma Studio to view data
npx prisma studio
```

## Troubleshooting

### Issue: Prisma Client not found

**Solution**: Run `npx prisma generate`

### Issue: Migration failed

**Solution**:

1. Check DATABASE_URL is correct
2. Ensure MySQL is running
3. Check user permissions

### Issue: Cannot connect to database

**Solution**:

1. Verify MySQL is running: `mysql -u root -p`
2. Check firewall settings
3. Verify DATABASE_URL format

## Production Deployment

For production, use:

```bash
npm run server-build
```

This runs:

1. `prisma migrate deploy` - Apply migrations
2. `prisma generate` - Generate client
3. `next build` - Build Next.js app

## Quick Reference

```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations (production)
npx prisma migrate deploy

# Create migration (development)
npx prisma migrate dev

# Reset database (development only!)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Validate schema
npx prisma validate

# Format schema
npx prisma format
```
