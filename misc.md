# Miscellaneous: Deployment, DNS, and Production Setup

This guide covers deployment, DNS configuration, connecting frontend to backend, and other production concerns.

## Part 1: Connecting Frontend & Backend

### 1.1 Development Environment

**Backend runs on**: `http://localhost:3001`  
**Frontend runs on**: `http://localhost:3000`

#### Configure Backend CORS
In `backend/src/index.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Backend `.env`:
```env
FRONTEND_URL=http://localhost:3000
```

#### Configure Frontend API URL
Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 1.2 Test Connection

**Start both servers:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Test API call from frontend:**
Visit `http://localhost:3000` and check browser console. You should see books loaded.

### 1.3 Troubleshooting Connection Issues

**Problem: CORS errors**
```
Access to fetch at 'http://localhost:3001/api/books' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
1. Check CORS configuration in backend
2. Ensure `credentials: true` is set
3. Restart backend server

**Problem: Network error / API not responding**
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```

**Solution:**
1. Ensure backend is running on port 3001
2. Check `NEXT_PUBLIC_API_URL` is correct
3. Test backend directly: `curl http://localhost:3001/api/books`

**Problem: 404 Not Found on API calls**
```
GET http://localhost:3001/api/books 404 (Not Found)
```

**Solution:**
1. Check backend routes are registered correctly
2. Verify URL in frontend matches backend routes
3. Check backend console for errors

## Part 2: Deploy Backend to Render

### 2.1 Prepare Backend for Deployment

#### Update package.json
```json
{
  "name": "tanakalibrary-backend",
  "version": "1.0.0",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "build": "npx prisma generate",
    "prisma:migrate": "npx prisma migrate deploy"
  }
}
```

#### Create render.yaml (optional but recommended)
```yaml
services:
  - type: web
    name: tanakalibrary-api
    env: node
    buildCommand: npm install && npx prisma generate
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: SESSION_SECRET
        generateValue: true
      - key: ADMIN_PASSWORD_HASH
        sync: false
      - key: NODE_ENV
        value: production
```

### 2.2 Deploy to Render

1. **Sign up for Render**: https://render.com (use GitHub to sign in)

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Select the repository

3. **Configure Service**:
   - **Name**: `tanakalibrary-api`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend` (if monorepo)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Add Environment Variables**:
   Click "Environment" → "Add Environment Variable":
   ```
   DATABASE_URL = postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   SESSION_SECRET = [generate random string]
   ADMIN_PASSWORD_HASH = $2b$10$...your-hash...
   NODE_ENV = production
   FRONTEND_URL = https://yourdomain.com
   PORT = 10000
   ```

5. **Deploy**:
   - Click "Create Web Service"
   - Wait 5-10 minutes for first deploy
   - Check logs for errors

6. **Your API URL**:
   ```
   https://tanakalibrary-api.onrender.com
   ```

### 2.3 Run Database Migrations on Production

After first deploy, you need to run migrations:

1. Go to Render dashboard → your service
2. Click "Shell" tab (or use Render CLI)
3. Run:
   ```bash
   npx prisma migrate deploy
   ```

Or add to build command:
```
npm install && npx prisma generate && npx prisma migrate deploy
```

### 2.4 Test Production API

```bash
# Health check
curl https://tanakalibrary-api.onrender.com/

# Get books
curl https://tanakalibrary-api.onrender.com/api/books
```

### 2.5 Keep Free Instance Awake (Optional)

Render free tier sleeps after 15 minutes of inactivity. Use UptimeRobot:

1. Sign up: https://uptimerobot.com
2. Add monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://tanakalibrary-api.onrender.com/`
   - **Interval**: 5 minutes
3. This pings your API every 5 minutes to keep it warm

## Part 3: Deploy Frontend to Vercel

### 3.1 Prepare Frontend for Deployment

#### Update .env.local to .env.production
Create `frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://tanakalibrary-api.onrender.com
NEXT_PUBLIC_SITE_NAME="Tanaka Library"
```

**Note**: Don't commit `.env.production` if it has secrets. Set in Vercel dashboard instead.

### 3.2 Deploy to Vercel

1. **Sign up for Vercel**: https://vercel.com (use GitHub)

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend` (if monorepo, click "Edit" and set)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

4. **Environment Variables**:
   Click "Environment Variables":
   ```
   NEXT_PUBLIC_API_URL = https://tanakalibrary-api.onrender.com
   NEXT_PUBLIC_SITE_NAME = Tanaka Library
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your site is live!

6. **Your Site URL**:
   ```
   https://tanakalibrary.vercel.app
   ```

### 3.3 Update Backend CORS

After deploying frontend, update backend CORS:

In Render dashboard → Environment:
```env
FRONTEND_URL=https://tanakalibrary.vercel.app
```

Or if using custom domain:
```env
FRONTEND_URL=https://yourdomain.com
```

Redeploy backend for changes to take effect.

### 3.4 Test Production Site

Visit `https://tanakalibrary.vercel.app` and:
- ✅ Home page loads
- ✅ Books are displayed
- ✅ Click on a book to see details
- ✅ Search works
- ✅ No console errors

## Part 4: Custom Domain Setup (Cloudflare DNS)

### 4.1 Overview

You have:
- **Domain**: `yourdomain.com` (purchased on Cloudflare)
- **Frontend**: Vercel
- **Backend**: Render

Configuration:
- `yourdomain.com` → Frontend (Vercel)
- `api.yourdomain.com` → Backend (Render)

### 4.2 Configure Frontend Domain (Vercel)

1. **In Vercel Dashboard**:
   - Go to your project → Settings → Domains
   - Click "Add"
   - Enter: `yourdomain.com`
   - Click "Add"

2. **Vercel provides DNS records**:
   ```
   A     @    76.76.21.21
   CNAME www  cname.vercel-dns.com
   ```

3. **In Cloudflare Dashboard**:
   - Go to DNS → Records
   - Add A record:
     - **Type**: A
     - **Name**: @
     - **IPv4 address**: 76.76.21.21
     - **Proxy status**: DNS only (gray cloud) initially
     - **TTL**: Auto
   - Add CNAME record:
     - **Type**: CNAME
     - **Name**: www
     - **Target**: cname.vercel-dns.com
     - **Proxy status**: DNS only
     - **TTL**: Auto

4. **Verify in Vercel**:
   - Wait 5-10 minutes
   - Vercel will verify ownership and provision SSL
   - Once verified, you can enable Cloudflare proxy (orange cloud)

### 4.3 Configure Backend Subdomain (Render)

1. **In Render Dashboard**:
   - Go to your service → Settings → Custom Domain
   - Click "Add Custom Domain"
   - Enter: `api.yourdomain.com`
   - Render provides a CNAME target

2. **In Cloudflare Dashboard**:
   - Go to DNS → Records
   - Add CNAME record:
     - **Type**: CNAME
     - **Name**: api
     - **Target**: tanakalibrary-api.onrender.com (from Render)
     - **Proxy status**: DNS only (gray cloud)
     - **TTL**: Auto

3. **Verify in Render**:
   - Wait 5-10 minutes for DNS propagation
   - Render will provision SSL automatically
   - Test: `https://api.yourdomain.com/`

### 4.4 Update Environment Variables

**Backend (Render)**:
```env
FRONTEND_URL=https://yourdomain.com
```

**Frontend (Vercel)**:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

Redeploy both services.

### 4.5 Enable Cloudflare Proxy (Optional)

After SSL is provisioned and working:

1. In Cloudflare DNS, change proxy status to "Proxied" (orange cloud)
2. This enables:
   - DDoS protection
   - CDN caching
   - Firewall rules
   - Analytics

**For API subdomain**: Usually keep "DNS only" to avoid Cloudflare timeout issues with long requests.

### 4.6 Test Custom Domain

```bash
# Frontend
curl https://yourdomain.com

# Backend
curl https://api.yourdomain.com/
curl https://api.yourdomain.com/api/books
```

Browser tests:
- Visit `https://yourdomain.com`
- Check books load
- Check console for errors
- Try admin login at `https://api.yourdomain.com/admin`

## Part 5: SSL/HTTPS Configuration

### 5.1 Vercel SSL

- **Automatic**: Vercel provisions Let's Encrypt certificates automatically
- **Renewal**: Auto-renewed every 90 days
- **No action needed**: Works out of the box

### 5.2 Render SSL

- **Automatic**: Render provisions Let's Encrypt certificates automatically
- **Renewal**: Auto-renewed
- **No action needed**: Works out of the box

### 5.3 Force HTTPS

**Frontend (Next.js)**:
Add to `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        }
      ]
    }
  ];
}
```

**Backend (Express)**:
```javascript
// Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

## Part 6: CI/CD & Automatic Deployment

### 6.1 Vercel Auto-Deploy

**Already configured!** Vercel automatically deploys when you push to GitHub.

- Push to `main` → Production deploy
- Push to other branches → Preview deploy

### 6.2 Render Auto-Deploy

**Already configured!** Render automatically deploys when you push to GitHub.

- Push to `main` → Production deploy
- Manual deploys available in dashboard

### 6.3 Deployment Workflow

```bash
# Make changes locally
git add .
git commit -m "Add new feature"
git push origin main

# Automatic deployments triggered:
# 1. Render builds backend (5-10 min)
# 2. Vercel builds frontend (2-3 min)

# Check deployment status:
# - Render dashboard: deployments tab
# - Vercel dashboard: deployments tab
```

### 6.4 Preview Deployments (Vercel)

Every pull request gets a preview URL:
```
https://tanakalibrary-git-feature-branch.vercel.app
```

Use for testing before merging to main.

## Part 7: Monitoring & Logging

### 7.1 Backend Logging (Render)

**View logs**:
1. Render dashboard → Your service
2. Click "Logs" tab
3. Real-time logs stream

**Save logs** (optional):
Integrate with external service:
- Papertrail
- Logtail
- Datadog

### 7.2 Frontend Logging (Vercel)

**View logs**:
1. Vercel dashboard → Your project
2. Click "Functions" → Select function → View logs

**Real-time monitoring**:
- Vercel Analytics (built-in)
- Google Analytics
- Plausible Analytics

### 7.3 Error Tracking

**Recommended: Sentry**

1. Sign up: https://sentry.io
2. Create project for backend and frontend

**Backend setup**:
```bash
npm install @sentry/node
```

```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Add before other middleware
app.use(Sentry.Handlers.requestHandler());

// Add before error handlers
app.use(Sentry.Handlers.errorHandler());
```

**Frontend setup**:
```bash
npm install @sentry/nextjs
```

```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
  {
    // Your Next.js config
  },
  {
    silent: true,
    org: "your-org",
    project: "your-project",
  }
);
```

### 7.4 Uptime Monitoring

**UptimeRobot** (free):
1. Add monitors for:
   - `https://yourdomain.com`
   - `https://api.yourdomain.com/`
2. Get alerts via email/SMS when site is down
3. View uptime history

## Part 8: Database Backups

### 8.1 Manual Backup

```bash
# Export database
pg_dump -h db.[PROJECT].supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -b \
  -v \
  -f backup-$(date +%Y%m%d).dump

# Restore
pg_restore -h db.[PROJECT].supabase.co \
  -U postgres \
  -d postgres \
  -v backup-20240326.dump
```

### 8.2 Automated Backup Script

Create `backend/scripts/backup.sh`:
```bash
#!/bin/bash

# Load environment variables
source .env

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_${DATE}.sql"

mkdir -p $BACKUP_DIR

pg_dump $DATABASE_URL > "${BACKUP_DIR}/${FILENAME}"

# Compress
gzip "${BACKUP_DIR}/${FILENAME}"

# Keep only last 7 backups
ls -t ${BACKUP_DIR}/*.sql.gz | tail -n +8 | xargs rm -f

echo "Backup completed: ${FILENAME}.gz"
```

Run weekly with cron:
```bash
# Edit crontab
crontab -e

# Add line (runs every Sunday at 2 AM)
0 2 * * 0 /path/to/backend/scripts/backup.sh
```

### 8.3 Supabase Backups

**Free tier**: No automatic backups  
**Pro tier**: Daily backups with point-in-time recovery

Export via Supabase dashboard:
1. Settings → Database → Backups
2. Click "Download backup"

## Part 9: Security Best Practices

### 9.1 Environment Variables

**Never commit**:
- `.env`
- `.env.local`
- `.env.production`

**Always in .gitignore**:
```
.env*
!.env.example
```

**Create .env.example**:
```env
DATABASE_URL=
SESSION_SECRET=
ADMIN_PASSWORD_HASH=
NEXT_PUBLIC_API_URL=
```

### 9.2 Admin Password

**Generate strong hash**:
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-strong-password', 10, (err, hash) => console.log(hash));"
```

**Store in environment**:
```env
ADMIN_PASSWORD_HASH="$2b$10$..."
```

**Never hardcode passwords in code!**

### 9.3 Rate Limiting (Backend)

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);

// Stricter for admin
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20
});

app.use('/admin/', adminLimiter);
```

### 9.4 CORS Configuration

Only allow your frontend:
```javascript
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''
  ].filter(Boolean),
  credentials: true
}));
```

### 9.5 Content Security Policy

Add to Next.js headers:
```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        }
      ]
    }
  ];
}
```

## Part 10: Performance Optimization

### 10.1 Frontend Optimization

**Image optimization**:
```typescript
// Always use Next.js Image component
import Image from 'next/image';

<Image
  src={coverUrl}
  alt={title}
  width={300}
  height={400}
  quality={85}
  loading="lazy"
/>
```

**Enable ISR (Incremental Static Regeneration)**:
```typescript
// In page components
export const revalidate = 3600; // Revalidate every hour
```

**Code splitting**: Already handled by Next.js

**Bundle analysis**:
```bash
npm install @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

Run: `ANALYZE=true npm run build`

### 10.2 Backend Optimization

**Database connection pooling**:
```javascript
// src/db.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

module.exports = prisma;
```

**Caching** (optional):
```bash
npm install node-cache
```

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 min TTL

app.get('/api/books', async (req, res) => {
  const cached = cache.get('books');
  if (cached) {
    return res.json(cached);
  }
  
  const books = await prisma.book.findMany();
  cache.set('books', books);
  res.json(books);
});
```

**Compression**:
```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());
```

### 10.3 CDN Configuration (Cloudflare)

If using Cloudflare proxy:

1. **Cache Rules**:
   - Cache static assets: `*.jpg, *.png, *.css, *.js`
   - Don't cache API calls: `/api/*`

2. **Page Rules**:
   - `yourdomain.com/*`: Cache level = Standard
   - `api.yourdomain.com/*`: Cache level = Bypass

## Part 11: Common Production Issues

### Issue: Render instance sleeps (free tier)
**Symptoms**: First request takes 30+ seconds  
**Solution**: Use UptimeRobot to ping every 5 minutes

### Issue: Database connection limit reached
**Symptoms**: `P2024: Timed out fetching a new connection from the pool`  
**Solution**: Use connection pooling URL with pgbouncer

### Issue: CORS errors in production
**Symptoms**: API calls blocked by browser  
**Solution**: Update FRONTEND_URL in backend env vars

### Issue: Images not loading in production
**Symptoms**: 404 or CORS errors on images  
**Solution**: 
1. Check `next.config.js` remotePatterns
2. Ensure images are uploaded to Supabase Storage
3. Check image URLs are absolute

### Issue: Session not persisting
**Symptoms**: Admin logs out immediately  
**Solution**: 
1. Check SESSION_SECRET is set
2. Ensure cookies are allowed
3. Check `secure: true` only in production

### Issue: Build fails on Vercel
**Symptoms**: Deployment fails with TypeScript errors  
**Solution**:
1. Fix all TypeScript errors locally
2. Run `npm run build` before committing
3. Check Vercel build logs

## Part 12: Maintenance Checklist

### Weekly
- [ ] Check error logs (Sentry/Render/Vercel)
- [ ] Review uptime reports (UptimeRobot)
- [ ] Test critical user flows

### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Review database size (Supabase dashboard)
- [ ] Backup database manually
- [ ] Check SSL certificate status
- [ ] Review and clear old logs

### Quarterly
- [ ] Security audit: `npm audit`
- [ ] Performance review (Lighthouse scores)
- [ ] Review and optimize database queries
- [ ] Update documentation

## Part 13: Useful Commands Reference

### Local Development
```bash
# Backend
cd backend
npm run dev                 # Start dev server
npm run prisma:studio      # Open Prisma Studio
npm run prisma:migrate     # Run migrations

# Frontend
cd frontend
npm run dev                # Start dev server
npm run build              # Build for production
npm run start              # Start production server
```

### Deployment
```bash
# Deploy (automatic via git push)
git add .
git commit -m "Update"
git push origin main

# Manual deploy (Vercel CLI)
cd frontend
vercel --prod

# Check deployment status
vercel ls
```

### Database
```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql

# Migrations
npx prisma migrate deploy      # Apply migrations
npx prisma migrate reset       # Reset DB (dev only)
```

### Testing
```bash
# Test backend API
curl https://api.yourdomain.com/api/books

# Test frontend
curl https://yourdomain.com

# Check SSL
curl -I https://yourdomain.com | grep -i ssl
```

## Resources & Documentation

- **Next.js**: https://nextjs.org/docs
- **Express**: https://expressjs.com/
- **Prisma**: https://www.prisma.io/docs
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs
- **Render**: https://render.com/docs
- **Cloudflare**: https://developers.cloudflare.com/

## Getting Help

- **Stack Overflow**: Tag with `next.js`, `express`, `prisma`
- **GitHub Issues**: Check official repos
- **Discord**: 
  - Next.js Discord
  - Prisma Discord
  - Supabase Discord

## Congratulations! 🎉

Your personal library website is now:
- ✅ Built with Express and Next.js
- ✅ Connected to PostgreSQL database
- ✅ Deployed to production
- ✅ Accessible via custom domain
- ✅ Secured with HTTPS
- ✅ Monitored and backed up

You've learned:
- Express API development
- Frontend-backend integration
- Database management with Prisma
- Production deployment
- DNS configuration
- Security best practices

**Now start adding your books and writing reviews!** 📚

Questions or issues? Review the relevant guide file or check the documentation links above.

Happy coding! 🚀
