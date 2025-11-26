# Frontend Development Guide: Next.js Public Site

This guide walks you through building the Next.js frontend that will display your book collection and reviews to the public.

## Prerequisites

- Backend API running (see `backend.md`)
- Node.js 18+ installed
- Basic React knowledge helpful

## Step 1: Initialize Next.js Project

### 1.1 Create Frontend Directory
```bash
cd /Users/shigeo/Personal/tanaka-library
npx create-next-app@latest frontend
```

When prompted, choose:
- ✅ TypeScript: **Yes** (recommended)
- ✅ ESLint: **Yes**
- ✅ Tailwind CSS: **Yes** (for easy styling)
- ✅ `src/` directory: **Yes**
- ✅ App Router: **Yes** (modern Next.js)
- ❌ Customize import alias: **No**

### 1.2 Navigate to Frontend
```bash
cd frontend
```

## Step 2: Install Additional Dependencies

```bash
# API fetching and data management
npm install axios swr

# Date formatting
npm install date-fns

# Icons (optional but nice)
npm install lucide-react

# Image optimization (if not using Next.js Image)
# Next.js already includes optimized Image component
```

## Step 3: Configure Environment Variables

### 3.1 Create .env.local
```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Site metadata
NEXT_PUBLIC_SITE_NAME="Tanaka Library"
NEXT_PUBLIC_SITE_DESCRIPTION="My personal book collection and reviews"
```

### 3.2 Update .gitignore (should already include)
```
.env*.local
.next/
node_modules/
```

## Step 4: Project Structure

Your Next.js app should have this structure:
```
frontend/
├── public/
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── books/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── reviews/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── search/
│   │       └── page.tsx
│   ├── components/
│   │   ├── BookCard.tsx
│   │   ├── BookList.tsx
│   │   ├── ReviewCard.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── types.ts
│   └── styles/
│       └── globals.css
├── next.config.js
├── tailwind.config.js
└── package.json
```

## Step 5: Configure Next.js

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // If using Supabase Storage
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
      }
    ],
  },
  // Enable React strict mode
  reactStrictMode: true,
  
  // Optimize production builds
  swcMinify: true,
};

module.exports = nextConfig;
```

## Step 6: Create Type Definitions (src/lib/types.ts)

```typescript
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  coverUrl?: string;
  tags: string[];
  notes?: string;
  rating?: number;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  reviews?: Review[];
}

export interface Review {
  id: string;
  bookId?: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  book?: {
    id: string;
    title: string;
    author: string;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
```

## Step 7: Create API Client (src/lib/api.ts)

```typescript
import axios from 'axios';
import { Book, Review } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Books
export const getBooks = async (): Promise<Book[]> => {
  const response = await api.get('/api/books');
  return response.data;
};

export const getBook = async (id: string): Promise<Book> => {
  const response = await api.get(`/api/books/${id}`);
  return response.data;
};

export const searchBooks = async (query: string): Promise<Book[]> => {
  const response = await api.get('/api/search', { params: { q: query } });
  return response.data;
};

// Reviews
export const getReviews = async (): Promise<Review[]> => {
  const response = await api.get('/api/reviews');
  return response.data;
};

export const getReview = async (id: string): Promise<Review> => {
  const response = await api.get(`/api/reviews/${id}`);
  return response.data;
};

export default api;
```

## Step 8: Create Layout (src/app/layout.tsx)

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'Tanaka Library',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Personal book collection',
  keywords: ['books', 'library', 'reading', 'reviews'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
```

## Step 9: Create Navigation (src/components/Navigation.tsx)

```typescript
import Link from 'next/link';
import SearchBar from './SearchBar';

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            📚 Tanaka Library
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/books" 
              className="text-gray-700 hover:text-gray-900 transition"
            >
              Books
            </Link>
            <Link 
              href="/reviews" 
              className="text-gray-700 hover:text-gray-900 transition"
            >
              Reviews
            </Link>
            <SearchBar />
          </div>
        </div>
      </div>
    </nav>
  );
}
```

## Step 10: Create Home Page (src/app/page.tsx)

```typescript
import Link from 'next/link';
import { getBooks, getReviews } from '@/lib/api';
import BookCard from '@/components/BookCard';
import ReviewCard from '@/components/ReviewCard';

export const dynamic = 'force-dynamic'; // Or use ISR with revalidate

export default async function Home() {
  // Fetch data at build time (SSG) or request time (SSR)
  const books = await getBooks();
  const reviews = await getReviews();
  
  const recentBooks = books.slice(0, 6);
  const recentReviews = reviews.slice(0, 3);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to My Library
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Exploring books, one page at a time
        </p>
        <div className="flex justify-center gap-4">
          <Link 
            href="/books"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Browse Books
          </Link>
          <Link 
            href="/reviews"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            Read Reviews
          </Link>
        </div>
      </section>

      {/* Recent Books */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Recent Additions</h2>
          <Link href="/books" className="text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* Recent Reviews */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Latest Reviews</h2>
          <Link href="/reviews" className="text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="space-y-6">
          {recentReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

## Step 11: Create BookCard Component (src/components/BookCard.tsx)

```typescript
import Image from 'next/image';
import Link from 'next/link';
import { Book } from '@/lib/types';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/books/${book.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
        <div className="relative h-64 bg-gray-200">
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
              📚
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
            {book.title}
          </h3>
          <p className="text-gray-600 text-sm mb-2">{book.author}</p>
          
          {book.rating && (
            <div className="flex items-center mb-2">
              <span className="text-yellow-500">
                {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
              </span>
              <span className="text-gray-500 text-sm ml-2">{book.rating}/5</span>
            </div>
          )}
          
          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {book.tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag}
                  className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
```

## Step 12: Create Books List Page (src/app/books/page.tsx)

```typescript
import { getBooks } from '@/lib/api';
import BookCard from '@/components/BookCard';

export const metadata = {
  title: 'All Books - Tanaka Library',
  description: 'Browse my complete book collection',
};

export default async function BooksPage() {
  const books = await getBooks();

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        All Books ({books.length})
      </h1>
      
      {books.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No books yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## Step 13: Create Book Detail Page (src/app/books/[id]/page.tsx)

```typescript
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBook } from '@/lib/api';
import { format } from 'date-fns';

interface BookPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: BookPageProps) {
  try {
    const book = await getBook(params.id);
    return {
      title: `${book.title} by ${book.author} - Tanaka Library`,
      description: book.notes || `Book details for ${book.title}`,
    };
  } catch {
    return {
      title: 'Book Not Found',
    };
  }
}

export default async function BookPage({ params }: BookPageProps) {
  let book;
  
  try {
    book = await getBook(params.id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link 
        href="/books" 
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        ← Back to all books
      </Link>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Cover Image */}
          <div className="md:w-1/3 bg-gray-200 relative h-96 md:h-auto">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-8xl">
                📚
              </div>
            )}
          </div>
          
          {/* Book Info */}
          <div className="md:w-2/3 p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {book.title}
            </h1>
            <p className="text-xl text-gray-600 mb-4">by {book.author}</p>
            
            {book.rating && (
              <div className="flex items-center mb-4">
                <span className="text-yellow-500 text-2xl">
                  {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
                </span>
                <span className="text-gray-500 ml-2">({book.rating}/5)</span>
              </div>
            )}
            
            {book.isbn && (
              <p className="text-gray-600 mb-4">
                <strong>ISBN:</strong> {book.isbn}
              </p>
            )}
            
            {book.tags && book.tags.length > 0 && (
              <div className="mb-4">
                <strong className="text-gray-700 block mb-2">Tags:</strong>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {book.notes && (
              <div className="mb-4">
                <strong className="text-gray-700 block mb-2">Notes:</strong>
                <p className="text-gray-600 whitespace-pre-wrap">{book.notes}</p>
              </div>
            )}
            
            <p className="text-gray-400 text-sm">
              Added {format(new Date(book.createdAt), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
        
        {/* Reviews Section */}
        {book.reviews && book.reviews.length > 0 && (
          <div className="border-t p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Reviews ({book.reviews.length})
            </h2>
            <div className="space-y-6">
              {book.reviews.map((review) => (
                <div key={review.id} className="border-l-4 border-blue-500 pl-4">
                  <Link 
                    href={`/reviews/${review.id}`}
                    className="text-xl font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {review.title}
                  </Link>
                  <p className="text-gray-600 mt-2 line-clamp-3">{review.body}</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {format(new Date(review.createdAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Step 14: Create Search Bar Component (src/components/SearchBar.tsx)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search books..."
        className="border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button 
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        🔍
      </button>
    </form>
  );
}
```

## Step 15: Create Search Page (src/app/search/page.tsx)

```typescript
import { searchBooks } from '@/lib/api';
import BookCard from '@/components/BookCard';

interface SearchPageProps {
  searchParams: {
    q?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  const books = query ? await searchBooks(query) : [];

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        Search Results
      </h1>
      {query && (
        <p className="text-gray-600 mb-8">
          Found {books.length} result{books.length !== 1 ? 's' : ''} for "{query}"
        </p>
      )}
      
      {!query ? (
        <p className="text-gray-500">Enter a search query to find books.</p>
      ) : books.length === 0 ? (
        <p className="text-gray-500">No books found. Try a different search.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## Step 16: Create Footer Component (src/components/Footer.tsx)

```typescript
export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-12">
      <div className="container mx-auto px-4 py-6 text-center text-gray-600">
        <p>© {new Date().getFullYear()} Tanaka Library. Built with Next.js & Express.</p>
      </div>
    </footer>
  );
}
```

## Step 17: Reviews Pages (Similar Structure)

### src/app/reviews/page.tsx
```typescript
import { getReviews } from '@/lib/api';
import ReviewCard from '@/components/ReviewCard';

export const metadata = {
  title: 'Reviews - Tanaka Library',
  description: 'Read my book reviews and thoughts',
};

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Reviews ({reviews.length})
      </h1>
      
      {reviews.length === 0 ? (
        <p className="text-gray-500">No reviews yet.</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### src/components/ReviewCard.tsx
```typescript
import Link from 'next/link';
import { format } from 'date-fns';
import { Review } from '@/lib/types';

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <Link href={`/reviews/${review.id}`}>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 hover:text-blue-600">
          {review.title}
        </h3>
      </Link>
      
      {review.book && (
        <p className="text-gray-600 mb-3">
          Review of{' '}
          <Link 
            href={`/books/${review.book.id}`}
            className="text-blue-600 hover:underline"
          >
            {review.book.title}
          </Link>
          {' '}by {review.book.author}
        </p>
      )}
      
      <p className="text-gray-700 mb-4 line-clamp-3">{review.body}</p>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>By {review.author}</span>
        <time>{format(new Date(review.createdAt), 'MMMM d, yyyy')}</time>
      </div>
    </article>
  );
}
```

## Step 18: Test Your Frontend

### 18.1 Make sure backend is running
```bash
# In backend directory
cd backend
npm run dev
```

### 18.2 Start Next.js dev server
```bash
# In frontend directory
cd frontend
npm run dev
```

Visit: `http://localhost:3000`

### 18.3 Test all pages:
- Home: `http://localhost:3000`
- Books: `http://localhost:3000/books`
- Single book: `http://localhost:3000/books/[id]`
- Reviews: `http://localhost:3000/reviews`
- Search: `http://localhost:3000/search?q=test`

## Step 19: Optimize for Production

### 19.1 Add Loading States
Create `src/app/books/loading.tsx`:
```typescript
export default function Loading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg h-96 animate-pulse" />
      ))}
    </div>
  );
}
```

### 19.2 Add Error Boundaries
Create `src/app/books/error.tsx`:
```typescript
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Something went wrong!
      </h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
```

### 19.3 Add Not Found Page
Create `src/app/books/[id]/not-found.tsx`:
```typescript
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center py-12">
      <h2 className="text-4xl font-bold text-gray-900 mb-4">Book Not Found</h2>
      <p className="text-gray-600 mb-8">
        The book you're looking for doesn't exist.
      </p>
      <Link 
        href="/books"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        Back to Books
      </Link>
    </div>
  );
}
```

## Step 20: SEO Optimization

### Update src/app/layout.tsx with Open Graph
```typescript
export const metadata: Metadata = {
  title: {
    default: 'Tanaka Library',
    template: '%s | Tanaka Library',
  },
  description: 'My personal book collection and reviews',
  keywords: ['books', 'library', 'reading', 'reviews', 'literature'],
  authors: [{ name: 'Your Name' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yourdomain.com',
    title: 'Tanaka Library',
    description: 'My personal book collection and reviews',
    siteName: 'Tanaka Library',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tanaka Library',
    description: 'My personal book collection and reviews',
  },
};
```

## Step 21: Performance Optimization

### Enable Static Generation where possible
```typescript
// For pages that don't change often
export const revalidate = 3600; // Revalidate every hour

// Or use ISR (Incremental Static Regeneration)
export const revalidate = 60; // Revalidate every minute
```

### Use Image Optimization
Always use Next.js `<Image>` component:
```typescript
import Image from 'next/image';

<Image
  src={book.coverUrl}
  alt={book.title}
  width={300}
  height={400}
  quality={85}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

## Step 22: Build for Production

```bash
npm run build
```

This will:
- Optimize all pages
- Generate static pages where possible
- Minify JavaScript and CSS
- Optimize images

Test the production build locally:
```bash
npm start
```

## Common Issues & Solutions

### Issue: "CORS policy" errors
**Solution:** Ensure backend CORS is configured correctly:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Issue: Images not loading
**Solution:** Add backend domain to `next.config.js` remotePatterns

### Issue: API calls failing
**Solution:** Check `NEXT_PUBLIC_API_URL` in `.env.local`

### Issue: Build fails with type errors
**Solution:** Run `npm run build` to see all TypeScript errors, fix them

### Issue: Slow page loads
**Solution:** Use SSG/ISR instead of SSR where possible:
```typescript
export const revalidate = 3600; // ISR
```

## Mobile Responsiveness

Your Tailwind classes already make the site responsive:
- `md:` = medium screens (768px+)
- `lg:` = large screens (1024px+)
- `xl:` = extra large (1280px+)

Test on mobile:
1. Open Chrome DevTools
2. Click device toolbar (Ctrl+Shift+M)
3. Test different screen sizes

## Accessibility Checklist

- ✅ Use semantic HTML (`<nav>`, `<main>`, `<article>`)
- ✅ Add alt text to all images
- ✅ Ensure color contrast ratios
- ✅ Keyboard navigation works
- ✅ Use ARIA labels where needed

## Next Steps

1. ✅ Frontend is complete
2. ➡️ Test integration with backend
3. ➡️ Read `misc.md` for deployment
4. ➡️ Deploy to Vercel

## Optional Enhancements

- **Dark mode**: Add theme toggle
- **Filters**: Add sorting/filtering on books page
- **Pagination**: Add for large book lists
- **Animations**: Add Framer Motion for transitions
- **PWA**: Add service worker for offline support
- **Analytics**: Add Google Analytics or Plausible
- **Comments**: Add comment system to reviews
- **RSS Feed**: Generate RSS feed for reviews

Your Next.js frontend is ready! 🎉
