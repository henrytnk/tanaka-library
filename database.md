# Database Setup Guide: Supabase PostgreSQL & Prisma

This guide walks you through setting up your PostgreSQL database with Supabase and configuring Prisma ORM.

## Why Supabase + Prisma?

- **Supabase**: Free hosted PostgreSQL, no SQLite persistence issues on serverless
- **Prisma**: Type-safe database client, easy migrations, great developer experience

## Step 1: Create Supabase Account & Project

### 1.1 Sign Up for Supabase
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email

### 1.2 Create New Project
1. Click "New Project"
2. Fill in the details:
   - **Name**: `tanakalibrary` (or your choice)
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose closest to you (e.g., us-east-1, eu-west-1)
   - **Pricing Plan**: Free tier
3. Click "Create new project"
4. Wait 2-3 minutes for provisioning

### 1.3 Get Connection String
1. Once project is ready, click "Settings" (gear icon)
2. Go to "Database" section
3. Scroll to "Connection string"
4. Copy the **Connection pooling** > **URI** format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the password you created

**Important**: Save this connection string securely!

## Step 2: Initialize Prisma in Backend

### 2.1 Navigate to Backend Directory
```bash
cd /Users/shigeo/Personal/tanakalibrary/backend
```

### 2.2 Install Prisma
```bash
npm install -D prisma
npm install @prisma/client
```

### 2.3 Initialize Prisma
```bash
npx prisma init
```

This creates:
- `prisma/` folder
- `prisma/schema.prisma` file
- `.env` file (if it doesn't exist)

## Step 3: Configure Database Connection

### 3.1 Update .env File
```env
# Database (replace with your actual connection string)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"

# Add ?pgbouncer=true for connection pooling if needed
# DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:6543/postgres?pgbouncer=true"
```

**Security Note**: Never commit `.env` files! Ensure `.gitignore` includes `.env`.

## Step 4: Define Prisma Schema

### 4.1 Edit prisma/schema.prisma

Replace the entire file with:

```prisma
// This is your Prisma schema file
// Learn more: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Book model
model Book {
  id        String   @id @default(uuid())
  title     String
  author    String
  isbn      String?  @unique
  coverUrl  String?
  tags      String[] @default([])
  notes     String?  @db.Text
  rating    Int?     @db.SmallInt // 1-5 scale
  readAt    DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  reviews   Review[]
  
  @@index([title])
  @@index([author])
  @@map("books")
}

// Review model
model Review {
  id        String   @id @default(uuid())
  bookId    String?  // Nullable - reviews can exist without books
  title     String
  body      String   @db.Text
  author    String   @default("Admin")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  book      Book?    @relation(fields: [bookId], references: [id], onDelete: SetNull)
  
  @@index([bookId])
  @@index([createdAt])
  @@map("reviews")
}

// Optional: Admin user model for authentication
model AdminUser {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@map("admin_users")
}
```

### 4.2 Understanding the Schema

**Book model**:
- `id`: UUID primary key
- `title`, `author`: Required strings
- `isbn`: Optional unique identifier
- `coverUrl`: Path/URL to cover image
- `tags`: Array of strings (genres, themes)
- `notes`: Personal notes (text field for long content)
- `rating`: 1-5 star rating
- `readAt`: When you finished reading
- Timestamps: `createdAt`, `updatedAt`

**Review model**:
- `id`: UUID primary key
- `bookId`: Foreign key to Book (nullable)
- `title`, `body`: Review content
- `author`: Who wrote the review
- Timestamps

**AdminUser model** (optional):
- For managing multiple admin users
- Stores hashed passwords
- Can be extended with roles/permissions

## Step 5: Create Database Migration

### 5.1 Generate Initial Migration
```bash
npx prisma migrate dev --name init
```

This will:
1. Create SQL migration files in `prisma/migrations/`
2. Apply the migration to your Supabase database
3. Generate Prisma Client

You should see output like:
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
✔ Successfully applied migration: 20240326_init
```

### 5.2 Verify in Supabase
1. Go to your Supabase project dashboard
2. Click "Table Editor"
3. You should see tables: `books`, `reviews`, `admin_users`

## Step 6: Test Database Connection

### 6.1 Create Test Script
Create `backend/test-db.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing database connection...');
  
  // Test creating a book
  const book = await prisma.book.create({
    data: {
      title: 'Test Book',
      author: 'Test Author',
      isbn: '978-0-000000-00-0',
      tags: ['fiction', 'test'],
      notes: 'This is a test book',
      rating: 5
    }
  });
  
  console.log('✅ Created book:', book);
  
  // Test fetching books
  const books = await prisma.book.findMany();
  console.log('✅ Fetched books:', books.length);
  
  // Clean up test data
  await prisma.book.delete({ where: { id: book.id } });
  console.log('✅ Cleaned up test data');
  
  console.log('\n🎉 Database connection successful!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 6.2 Run Test Script
```bash
node test-db.js
```

Expected output:
```
Testing database connection...
✅ Created book: { id: '...', title: 'Test Book', ... }
✅ Fetched books: 1
✅ Cleaned up test data

🎉 Database connection successful!
```

## Step 7: Seed Initial Data (Optional)

### 7.1 Create Seed Script
Create `backend/prisma/seed.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample books
  const book1 = await prisma.book.create({
    data: {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0-7432-7356-5',
      tags: ['fiction', 'classic', 'american'],
      notes: 'A masterpiece of American literature',
      rating: 5,
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg'
    }
  });

  const book2 = await prisma.book.create({
    data: {
      title: '1984',
      author: 'George Orwell',
      isbn: '978-0-452-28423-4',
      tags: ['fiction', 'dystopian', 'classic'],
      notes: 'Chilling vision of the future',
      rating: 5,
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780452284234-L.jpg'
    }
  });

  const book3 = await prisma.book.create({
    data: {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0-06-112008-4',
      tags: ['fiction', 'classic', 'southern'],
      notes: 'Timeless story of justice and morality',
      rating: 5,
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg'
    }
  });

  // Create sample reviews
  await prisma.review.create({
    data: {
      bookId: book1.id,
      title: 'A Timeless Classic',
      body: 'Fitzgerald\'s prose is beautiful and the story remains relevant today. The exploration of the American Dream and its corruption is masterfully done.',
      author: 'Admin'
    }
  });

  await prisma.review.create({
    data: {
      bookId: book2.id,
      title: 'Eerily Prophetic',
      body: 'Orwell\'s vision of totalitarianism is more relevant now than ever. The concepts of doublethink and newspeak are particularly chilling.',
      author: 'Admin'
    }
  });

  console.log('✅ Created 3 books and 2 reviews');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 7.2 Add Seed Command to package.json
```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "prisma:studio": "npx prisma studio",
    "prisma:migrate": "npx prisma migrate dev",
    "prisma:generate": "npx prisma generate",
    "prisma:seed": "node prisma/seed.js"
  },
  "prisma": {
    "seed": "node prisma/seed.js"
  }
}
```

### 7.3 Run Seed
```bash
npm run prisma:seed
```

## Step 8: Prisma Studio (Visual Database Editor)

Prisma Studio is a GUI for viewing and editing your database.

### 8.1 Launch Prisma Studio
```bash
npx prisma studio
```

This opens `http://localhost:5555` in your browser.

### 8.2 Explore Your Data
- View all tables
- Add/edit/delete records
- Test relationships
- Run queries

**Tip**: Keep Prisma Studio open in a browser tab while developing!

## Step 9: Common Prisma Operations

### 9.1 Create Records
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a book
const book = await prisma.book.create({
  data: {
    title: 'Book Title',
    author: 'Author Name',
    tags: ['tag1', 'tag2'],
    rating: 5
  }
});
```

### 9.2 Read Records
```javascript
// Find all books
const books = await prisma.book.findMany();

// Find one book by ID
const book = await prisma.book.findUnique({
  where: { id: 'book-id' },
  include: { reviews: true } // Include related reviews
});

// Find with filters
const fictionBooks = await prisma.book.findMany({
  where: {
    tags: { has: 'fiction' }
  },
  orderBy: { createdAt: 'desc' }
});

// Search
const results = await prisma.book.findMany({
  where: {
    OR: [
      { title: { contains: 'gatsby', mode: 'insensitive' } },
      { author: { contains: 'fitzgerald', mode: 'insensitive' } }
    ]
  }
});
```

### 9.3 Update Records
```javascript
const updatedBook = await prisma.book.update({
  where: { id: 'book-id' },
  data: {
    rating: 4,
    notes: 'Updated notes'
  }
});
```

### 9.4 Delete Records
```javascript
await prisma.book.delete({
  where: { id: 'book-id' }
});

// Delete many
await prisma.book.deleteMany({
  where: { rating: { lt: 3 } }
});
```

### 9.5 Relationships
```javascript
// Create book with review
const book = await prisma.book.create({
  data: {
    title: 'Book Title',
    author: 'Author Name',
    reviews: {
      create: [
        {
          title: 'Great book!',
          body: 'I loved it',
          author: 'Admin'
        }
      ]
    }
  },
  include: { reviews: true }
});

// Get book with reviews
const bookWithReviews = await prisma.book.findUnique({
  where: { id: 'book-id' },
  include: {
    reviews: {
      orderBy: { createdAt: 'desc' }
    }
  }
});
```

## Step 10: Database Migrations

### 10.1 Make Schema Changes
1. Edit `prisma/schema.prisma`
2. Add/modify/delete fields

Example - adding a `publishedYear` field:
```prisma
model Book {
  // ... existing fields
  publishedYear Int?
  // ... rest
}
```

### 10.2 Create Migration
```bash
npx prisma migrate dev --name add_published_year
```

### 10.3 Apply to Production
When deploying:
```bash
npx prisma migrate deploy
```

### 10.4 Reset Database (Development Only)
**⚠️ Warning: This deletes ALL data!**
```bash
npx prisma migrate reset
```

## Step 11: Production Considerations

### 11.1 Connection Pooling
For serverless/production, use connection pooling:

```env
# .env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true"
```

### 11.2 Prisma Client in Production
Generate Prisma Client during build:
```json
{
  "scripts": {
    "build": "npx prisma generate",
    "start": "node src/index.js"
  }
}
```

### 11.3 Environment-Specific Configs
```javascript
// src/db.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error']
});

module.exports = prisma;
```

## Step 12: Backup Strategy

### 12.1 Manual Backup (Supabase Dashboard)
1. Go to Settings > Database
2. Click "Connection string"
3. Use `pg_dump` command:
```bash
pg_dump -h db.[PROJECT].supabase.co -U postgres -d postgres > backup.sql
```

### 12.2 Restore from Backup
```bash
psql -h db.[PROJECT].supabase.co -U postgres -d postgres < backup.sql
```

### 12.3 Automated Backups
- Supabase Pro plan includes automatic backups
- Free tier: set up cron job to run pg_dump weekly

## Step 13: Monitoring & Debugging

### 13.1 Query Logging
Enable in development:
```javascript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
```

### 13.2 Check Supabase Dashboard
- Table Editor: View data
- SQL Editor: Run custom queries
- Database: Check connection stats
- Logs: View query logs

### 13.3 Common Issues

**Issue: Connection timeout**
```
Error: P1001: Can't reach database server
```
**Solution**: Check DATABASE_URL, verify Supabase project is running

**Issue: Migration failed**
```
Error: P3005: The migration is in a failed state
```
**Solution**: 
```bash
npx prisma migrate resolve --rolled-back [migration-name]
npx prisma migrate deploy
```

**Issue: Prisma Client outdated**
```
Error: @prisma/client did not initialize yet
```
**Solution**: 
```bash
npx prisma generate
```

## Step 14: Advanced Features (Optional)

### 14.1 Full-Text Search
```prisma
model Book {
  // ... fields
  @@index([title, author], map: "book_search")
}
```

Query:
```javascript
const results = await prisma.$queryRaw`
  SELECT * FROM books 
  WHERE title ILIKE ${'%' + query + '%'} 
  OR author ILIKE ${'%' + query + '%'}
`;
```

### 14.2 Transactions
```javascript
const [book, review] = await prisma.$transaction([
  prisma.book.create({ data: bookData }),
  prisma.review.create({ data: reviewData })
]);
```

### 14.3 Raw SQL
```javascript
const books = await prisma.$queryRaw`
  SELECT * FROM books 
  WHERE rating >= 4 
  ORDER BY created_at DESC 
  LIMIT 10
`;
```

### 14.4 Middleware
```javascript
prisma.$use(async (params, next) => {
  console.log('Query:', params.model, params.action);
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  console.log(`Query took ${after - before}ms`);
  return result;
});
```

## Checklist

- ✅ Supabase account created
- ✅ Project provisioned
- ✅ Connection string saved
- ✅ Prisma installed and initialized
- ✅ Schema defined
- ✅ Initial migration created
- ✅ Database connection tested
- ✅ Seed data added (optional)
- ✅ Prisma Studio explored
- ✅ Basic CRUD operations understood

## Next Steps

1. ✅ Database is set up and ready
2. ➡️ Read `backend.md` to build Express API
3. ➡️ Read `frontend.md` to build Next.js site
4. ➡️ Start coding!

## Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Supabase Docs**: https://supabase.com/docs
- **Prisma Schema Reference**: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- **PostgreSQL Tutorial**: https://www.postgresql.org/docs/

Your database is ready! 🎉
