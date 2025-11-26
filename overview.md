# Project Overview: Personal Library & Blog Website

## What You're Building

A personal library website where you can:
- Display your book collection publicly
- Show book details with cover images
- Write and publish blog-style reviews
- Manage everything through an admin dashboard

## Architecture Summary

**Frontend (Public Site)**: Next.js → deployed to Vercel  
**Backend (Admin + API)**: Express.js → deployed to Render  
**Database**: PostgreSQL via Supabase (free tier)

```
┌─────────────────┐
│   Visitors      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│   Next.js       │─────▶│   Express API    │
│  (Public Site)  │      │  (Admin + REST)  │
│   on Vercel     │      │   on Render      │
└─────────────────┘      └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │   Supabase       │
                         │   (PostgreSQL)   │
                         └──────────────────┘
```

## Tech Stack Breakdown

### Frontend (Next.js)
- **Purpose**: Public-facing website
- **Features**: Book listings, detail pages, search, blog posts
- **Why**: SEO-friendly, great DX, TypeScript support, static generation
- **Deploy**: Vercel (free tier, automatic CI/CD)

### Backend (Express)
- **Purpose**: Admin dashboard + REST API
- **Features**: CRUD operations for books/reviews, authentication, file uploads
- **Why**: You want to learn Express, perfect for simple APIs
- **Deploy**: Render (free tier, stays alive with UptimeRobot pings)

### Database (Supabase PostgreSQL)
- **Purpose**: Persistent data storage
- **Why**: Free tier, managed, no SQLite issues on serverless
- **ORM**: Prisma for type-safety and migrations

### Storage
- **Supabase Storage**: For book cover images
- **Alternative**: Store URLs to external hosting services

## Repository Structure

**Recommended: Monorepo approach** (single GitHub repo with two folders)

```
tanakalibrary/
├── README.md
├── .gitignore
├── frontend/              # Next.js app
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── .env.local         # Not committed
│   ├── pages/
│   ├── components/
│   ├── public/
│   └── styles/
│
├── backend/               # Express app
│   ├── package.json
│   ├── .env               # Not committed
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── views/         # EJS templates for admin
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
│
└── docs/                  # These guide files
    ├── overview.md
    ├── backend.md
    ├── frontend.md
    ├── database.md
    └── misc.md
```

**Why monorepo?**
- Easier to manage for a small project
- Share types/interfaces if using TypeScript
- Single CI/CD setup
- Each folder deploys independently (Vercel watches `/frontend`, Render watches `/backend`)

**Alternative: Separate repos**
- More "professional" separation
- Better for team collaboration
- More complex to sync shared code
- Two repos to manage

**Recommendation**: Start with monorepo, split later if needed.

## Implementation Order

### Phase 1: Backend First (Week 1-2)
**Why first**: The backend defines your data model and API contract. Once stable, frontend can consume it reliably.

1. **Database Setup** (Day 1)
   - Create Supabase account and project
   - Define Prisma schema
   - Run migrations
   - Test connection

2. **Express API** (Days 2-4)
   - Basic Express server setup
   - Public API endpoints (GET books, GET reviews)
   - Admin CRUD endpoints
   - Authentication middleware
   - Test with Postman/Thunder Client

3. **Admin Dashboard** (Days 5-7)
   - Simple EJS templates for admin UI
   - Forms for adding/editing books
   - Image upload functionality
   - Login page

4. **Deploy Backend** (Day 7)
   - Deploy to Render
   - Set environment variables
   - Test production API

### Phase 2: Frontend (Week 2-3)
**Why second**: With a working API, you can fetch real data immediately.

1. **Next.js Setup** (Day 1)
   - Initialize Next.js project
   - Setup TypeScript (optional but recommended)
   - Configure API URLs

2. **Core Pages** (Days 2-5)
   - Home page (book list)
   - Book detail page
   - Search/filter functionality
   - Navigation and layout

3. **Blog/Reviews** (Days 6-7)
   - Reviews listing page
   - Individual review pages
   - Optional: MDX integration

4. **Deploy Frontend** (Day 8)
   - Deploy to Vercel
   - Configure environment variables
   - Test production site

### Phase 3: Polish & Connect (Week 4)
1. **Integration Testing**
   - Test frontend ↔ backend communication
   - Fix CORS issues
   - Optimize API calls

2. **Domain Setup**
   - Configure Cloudflare DNS
   - Point to Vercel/Render
   - SSL certificates (automatic)

3. **Optional Enhancements**
   - Add loading states
   - Error handling
   - SEO optimization
   - Social sharing

## Development Workflow

### Local Development
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev          # Runs on http://localhost:3001

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev          # Runs on http://localhost:3000

# Terminal 3 - Database (when needed)
cd backend
npx prisma studio    # Visual DB editor
```

### Git Workflow
```bash
# Feature branch workflow
git checkout -b feature/add-book-search
# Make changes
git add .
git commit -m "Add book search functionality"
git push origin feature/add-book-search
# Merge to main when ready
```

### Deployment (Automatic)
- **Push to `main`** → Auto-deploys to production
- **Push to `develop`** → Auto-deploys to staging (optional)

## Environment Variables Strategy

### Backend (.env)
```env
DATABASE_URL="postgresql://..."
SESSION_SECRET="random-secret-here"
ADMIN_PASSWORD_HASH="$2b$10$..."
SUPABASE_URL="https://..."
SUPABASE_KEY="your-anon-key"
PORT=3001
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
# or in production:
# NEXT_PUBLIC_API_URL="https://your-api.render.com"
```

**Security Note**: Never commit `.env` files! Add them to `.gitignore`.

## Data Flow Example

**Visitor views book list:**
```
1. User visits yoursite.com/books
2. Next.js SSR/SSG fetches GET /api/books from Express
3. Express queries Supabase via Prisma
4. Returns JSON to Next.js
5. Next.js renders the page
6. User sees book list
```

**Admin adds a book:**
```
1. Admin logs in at yoursite.com/admin
2. Fills book form with cover upload
3. POST /admin/books to Express
4. Express validates, uploads image to Supabase Storage
5. Creates book record in Postgres via Prisma
6. Returns success
7. Admin sees updated book list
```

## Key Learning Goals

By building this project, you'll learn:

1. **Express fundamentals**
   - Routing and middleware
   - RESTful API design
   - Authentication/sessions
   - File uploads
   - Error handling

2. **Frontend-Backend connection**
   - API consumption
   - CORS configuration
   - Environment variables
   - Production deployment

3. **Database operations**
   - SQL via Prisma ORM
   - Migrations
   - Relationships
   - Queries and filtering

4. **DevOps basics**
   - Git workflow
   - CI/CD with Vercel/Render
   - Environment management
   - DNS configuration

## Success Criteria

Your project is complete when:
- ✅ You can view all books on the public site
- ✅ Clicking a book shows details and reviews
- ✅ Admin can log in securely
- ✅ Admin can add/edit/delete books with covers
- ✅ Admin can write and publish reviews
- ✅ Site is live on your custom domain
- ✅ Everything persists after server restarts

## Estimated Timeline

- **Minimum viable product**: 2-3 weeks (working evenings/weekends)
- **Polished version**: 4-6 weeks
- **With advanced features**: 6-8 weeks

## Next Steps

1. Read `database.md` to set up Supabase and Prisma
2. Read `backend.md` to build your Express API
3. Read `frontend.md` to build your Next.js site
4. Read `misc.md` for deployment and DNS setup

Let's get started! 🚀
