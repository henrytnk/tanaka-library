# Backend Development Guide: Express API & Admin

This guide walks you through building the Express backend that will serve both the public API and admin dashboard.

## Prerequisites

- Node.js 18+ installed
- Database setup completed (see `database.md`)
- Basic JavaScript/Node.js knowledge

## Step 1: Initialize Backend Project

### 1.1 Create Backend Directory
```bash
cd /Users/shigeo/Personal/tanakalibrary
mkdir backend
cd backend
```

### 1.2 Initialize npm Project
```bash
npm init -y
```

### 1.3 Install Core Dependencies
```bash
# Core framework
npm install express

# Database & ORM
npm install @prisma/client
npm install -D prisma

# Middleware
npm install cors
npm install helmet
npm install express-session
npm install cookie-parser

# Authentication
npm install bcrypt

# File uploads
npm install multer

# Environment variables
npm install dotenv

# Template engine (for admin UI)
npm install ejs

# Utilities
npm install express-validator

# Development
npm install -D nodemon
```

### 1.4 Update package.json Scripts
```json
{
  "name": "tanakalibrary-backend",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "prisma:studio": "npx prisma studio",
    "prisma:migrate": "npx prisma migrate dev",
    "prisma:generate": "npx prisma generate"
  }
}
```

## Step 2: Project Structure

Create this folder structure:

```bash
mkdir -p src/{routes,middleware,controllers,views,public}
touch src/index.js
touch .env
touch .gitignore
```

Your structure should look like:
```
backend/
├── package.json
├── .env
├── .gitignore
├── prisma/
│   └── schema.prisma
└── src/
    ├── index.js
    ├── routes/
    │   ├── api.js
    │   └── admin.js
    ├── middleware/
    │   ├── auth.js
    │   └── upload.js
    ├── controllers/
    │   ├── bookController.js
    │   └── reviewController.js
    ├── views/
    │   ├── layout.ejs
    │   ├── login.ejs
    │   ├── dashboard.ejs
    │   ├── books.ejs
    │   └── book-form.ejs
    └── public/
        └── admin.css
```

## Step 3: Configure Environment Variables

### 3.1 Create .env File
```env
# Server
PORT=3001
NODE_ENV=development

# Database (from Supabase)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"

# Session
SESSION_SECRET="generate-a-random-secret-here"

# Admin Auth (temporary - we'll hash this later)
ADMIN_PASSWORD="your-temporary-password"

# Supabase (for storage)
SUPABASE_URL="https://[YOUR-PROJECT].supabase.co"
SUPABASE_KEY="your-anon-key"

# CORS (frontend URL)
FRONTEND_URL="http://localhost:3000"
```

### 3.2 Create .gitignore
```
node_modules/
.env
.DS_Store
uploads/
*.log
dist/
build/
.prisma/
```

## Step 4: Main Express Server (src/index.js)

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// View engine for admin
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Tanaka Library API',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
});
```

## Step 5: Authentication Middleware (src/middleware/auth.js)

```javascript
const bcrypt = require('bcrypt');

// Simple password-based auth
const requireAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  
  // For API requests, return JSON
  if (req.path.startsWith('/api')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // For admin pages, redirect to login
  res.redirect('/admin/login');
};

// Login handler
const login = async (req, res) => {
  const { password } = req.body;
  
  // In production, compare with hashed password from env
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  
  let isValid = false;
  if (adminPasswordHash) {
    // Compare with hashed password
    isValid = await bcrypt.compare(password, adminPasswordHash);
  } else {
    // Development: compare plain text (not secure!)
    isValid = password === process.env.ADMIN_PASSWORD;
  }
  
  if (isValid) {
    req.session.isAuthenticated = true;
    return res.redirect('/admin/dashboard');
  }
  
  res.render('login', { error: 'Invalid password' });
};

// Logout handler
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/admin/login');
  });
};

module.exports = { requireAuth, login, logout };
```

## Step 6: File Upload Middleware (src/middleware/upload.js)

```javascript
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

module.exports = upload;
```

## Step 7: API Routes (src/routes/api.js)

```javascript
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/books - List all books
router.get('/books', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reviews: {
          select: { id: true, title: true }
        }
      }
    });
    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// GET /api/books/:id - Get single book with reviews
router.get('/books/:id', async (req, res) => {
  try {
    const book = await prisma.book.findUnique({
      where: { id: req.params.id },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// GET /api/reviews - List recent reviews
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        book: {
          select: { id: true, title: true, author: true }
        }
      }
    });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/search?q=keyword
router.get('/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }
  
  try {
    const books = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { author: { contains: q, mode: 'insensitive' } },
          { notes: { contains: q, mode: 'insensitive' } }
        ]
      }
    });
    res.json(books);
  } catch (error) {
    console.error('Error searching books:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
```

## Step 8: Admin Routes (src/routes/admin.js)

```javascript
const express = require('express');
const router = express.Router();
const { requireAuth, login, logout } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const upload = require('../middleware/upload');

const prisma = new PrismaClient();

// Login page (public)
router.get('/login', (req, res) => {
  if (req.session.isAuthenticated) {
    return res.redirect('/admin/dashboard');
  }
  res.render('login', { error: null });
});

router.post('/login', login);
router.post('/logout', logout);

// All routes below require authentication
router.use(requireAuth);

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const bookCount = await prisma.book.count();
    const reviewCount = await prisma.review.count();
    const recentBooks = await prisma.book.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    res.render('dashboard', { bookCount, reviewCount, recentBooks });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// Books list
router.get('/books', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.render('books', { books });
  } catch (error) {
    console.error('Error loading books:', error);
    res.status(500).send('Error loading books');
  }
});

// New book form
router.get('/books/new', (req, res) => {
  res.render('book-form', { book: null, error: null });
});

// Create book
router.post('/books', upload.single('coverImage'), async (req, res) => {
  try {
    const { title, author, isbn, notes, rating, tags } = req.body;
    
    const bookData = {
      title,
      author,
      isbn: isbn || null,
      notes: notes || null,
      rating: rating ? parseInt(rating) : null,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      coverUrl: req.file ? `/uploads/${req.file.filename}` : null
    };
    
    await prisma.book.create({ data: bookData });
    res.redirect('/admin/books');
  } catch (error) {
    console.error('Error creating book:', error);
    res.render('book-form', { 
      book: req.body, 
      error: 'Failed to create book' 
    });
  }
});

// Edit book form
router.get('/books/:id/edit', async (req, res) => {
  try {
    const book = await prisma.book.findUnique({
      where: { id: req.params.id }
    });
    
    if (!book) {
      return res.status(404).send('Book not found');
    }
    
    res.render('book-form', { book, error: null });
  } catch (error) {
    console.error('Error loading book:', error);
    res.status(500).send('Error loading book');
  }
});

// Update book
router.post('/books/:id', upload.single('coverImage'), async (req, res) => {
  try {
    const { title, author, isbn, notes, rating, tags } = req.body;
    
    const updateData = {
      title,
      author,
      isbn: isbn || null,
      notes: notes || null,
      rating: rating ? parseInt(rating) : null,
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    };
    
    // Only update cover if new file uploaded
    if (req.file) {
      updateData.coverUrl = `/uploads/${req.file.filename}`;
    }
    
    await prisma.book.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    res.redirect('/admin/books');
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).send('Error updating book');
  }
});

// Delete book
router.post('/books/:id/delete', async (req, res) => {
  try {
    await prisma.book.delete({
      where: { id: req.params.id }
    });
    res.redirect('/admin/books');
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).send('Error deleting book');
  }
});

// Similar routes for reviews would go here...

module.exports = router;
```

## Step 9: Create Admin Views

### src/views/layout.ejs
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin - Tanaka Library</title>
  <link rel="stylesheet" href="/static/admin.css">
</head>
<body>
  <nav class="admin-nav">
    <h1>📚 Tanaka Library Admin</h1>
    <ul>
      <li><a href="/admin/dashboard">Dashboard</a></li>
      <li><a href="/admin/books">Books</a></li>
      <li><a href="/admin/reviews">Reviews</a></li>
      <li>
        <form action="/admin/logout" method="POST" style="display:inline;">
          <button type="submit">Logout</button>
        </form>
      </li>
    </ul>
  </nav>
  
  <main class="admin-content">
    <%- body %>
  </main>
</body>
</html>
```

### src/views/login.ejs
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login - Tanaka Library</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
    }
    .login-form {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
    }
    h1 { margin-top: 0; }
    input {
      width: 100%;
      padding: 0.75rem;
      margin-bottom: 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background: #0070f3;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
    }
    button:hover { background: #0051cc; }
    .error {
      color: red;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="login-form">
    <h1>📚 Admin Login</h1>
    <% if (error) { %>
      <p class="error"><%= error %></p>
    <% } %>
    <form method="POST" action="/admin/login">
      <input 
        type="password" 
        name="password" 
        placeholder="Admin password" 
        required 
        autofocus
      >
      <button type="submit">Login</button>
    </form>
  </div>
</body>
</html>
```

### src/views/dashboard.ejs
```html
<!DOCTYPE html>
<html>
<head>
  <title>Dashboard</title>
</head>
<body>
  <h1>Dashboard</h1>
  
  <div class="stats">
    <div class="stat-card">
      <h3>Total Books</h3>
      <p class="stat-number"><%= bookCount %></p>
    </div>
    <div class="stat-card">
      <h3>Total Reviews</h3>
      <p class="stat-number"><%= reviewCount %></p>
    </div>
  </div>
  
  <h2>Recent Books</h2>
  <ul>
    <% recentBooks.forEach(book => { %>
      <li>
        <strong><%= book.title %></strong> by <%= book.author %>
        <a href="/admin/books/<%= book.id %>/edit">Edit</a>
      </li>
    <% }); %>
  </ul>
  
  <a href="/admin/books/new" class="btn-primary">Add New Book</a>
</body>
</html>
```

## Step 10: Create uploads Directory

```bash
mkdir uploads
echo '*' > uploads/.gitignore
echo '!.gitignore' >> uploads/.gitignore
```

## Step 11: Generate Admin Password Hash

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password-here', 10, (err, hash) => console.log(hash));"
```

Copy the output and add to your `.env`:
```env
ADMIN_PASSWORD_HASH="$2b$10$..."
```

## Step 12: Test Your Backend

### 12.1 Start the Server
```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📚 Admin panel: http://localhost:3001/admin
🔌 API: http://localhost:3001/api
```

### 12.2 Test Endpoints

**Health check:**
```bash
curl http://localhost:3001/
```

**Get books:**
```bash
curl http://localhost:3001/api/books
```

**Admin login:**
Visit `http://localhost:3001/admin` in your browser

## Step 13: API Testing with Thunder Client (VS Code)

1. Install Thunder Client extension
2. Create requests:
   - GET http://localhost:3001/api/books
   - GET http://localhost:3001/api/books/:id
   - GET http://localhost:3001/api/reviews
   - GET http://localhost:3001/api/search?q=test

## Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"
**Solution:** Run `npx prisma generate`

### Issue: "Session secret required"
**Solution:** Add SESSION_SECRET to .env

### Issue: "Port 3001 already in use"
**Solution:** Change PORT in .env or kill the process:
```bash
lsof -ti:3001 | xargs kill -9
```

### Issue: File uploads not working
**Solution:** Ensure uploads/ directory exists with proper permissions

### Issue: CORS errors from frontend
**Solution:** Check FRONTEND_URL in .env matches your Next.js URL

## Next Steps

1. ✅ Backend API is complete
2. ➡️ Move to `frontend.md` to build the Next.js site
3. Connect frontend to this API
4. Deploy both to production

## Additional Features (Optional)

- **Input validation**: Use express-validator
- **Rate limiting**: Add express-rate-limit
- **Logging**: Add morgan or winston
- **Testing**: Add Jest for unit tests
- **API documentation**: Add Swagger/OpenAPI
- **Better error handling**: Custom error classes
- **Pagination**: Add to book/review lists
- **Filtering**: Add query parameters for sorting/filtering

Your Express backend is now ready! 🎉
