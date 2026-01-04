# 🚀 How to Run TrendArc Locally

Complete step-by-step guide to run the project on your local machine.

---

## 📋 Prerequisites

Before you start, make sure you have:

- ✅ **Node.js 20+** installed ([Download](https://nodejs.org/))
- ✅ **npm** (comes with Node.js)
- ✅ **Git** (for cloning, if needed)
- ✅ **PostgreSQL Database** (or use Neon cloud database)

**Check your versions:**
```bash
node --version  # Should be v20 or higher
npm --version   # Should be 9 or higher
```

---

## 🛠️ Step-by-Step Setup

### Step 1: Navigate to Project Directory

```bash
cd C:\Users\User\Desktop\trend-compare
```

### Step 2: Install Dependencies

```bash
npm install
```

**Expected time:** 2-5 minutes  
**What it does:** Installs all required packages from `package.json`

**If you get PowerShell execution policy errors:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
npm install
```

---

### Step 3: Set Up Environment Variables

You already have `.env.local` file with your credentials! ✅

**Verify it exists:**
```bash
# Check if .env.local exists
Test-Path .env.local
```

**Your current setup includes:**
- ✅ Database URL (Neon PostgreSQL)
- ✅ Anthropic API Key
- ✅ All API keys (News, TMDB, Spotify, YouTube, Best Buy)

**If you need to edit it:**
```bash
# Open in notepad
notepad .env.local
```

---

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

**What it does:** Generates TypeScript types for your database schema

**Expected output:**
```
✔ Generated Prisma Client
```

---

### Step 5: Run Database Migrations

```bash
npx prisma migrate deploy
```

**What it does:** Applies database schema to your PostgreSQL database

**Note:** Your database is already set up, so this should complete quickly.

---

### Step 6: Start the Development Server

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 16.0.7
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

---

### Step 7: Open in Browser

Open your browser and go to:

**http://localhost:3000**

You should see the TrendArc homepage! 🎉

---

## 🎯 Quick Start (All Steps at Once)

If you want to do everything in one go:

```bash
# Navigate to project
cd C:\Users\User\Desktop\trend-compare

# Install dependencies (if not done)
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start dev server
npm run dev
```

Then open: **http://localhost:3000**

---

## 🔧 Troubleshooting

### Issue: "npm install" fails

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
npm install
```

### Issue: "Prisma client not generated"

**Solution:**
```bash
npx prisma generate
```

### Issue: "Database connection failed"

**Check:**
1. Verify `.env.local` has correct `DATABASE_URL`
2. Test connection:
   ```bash
   npx prisma db pull
   ```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm run dev
```

### Issue: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

## 📝 Available Scripts

Once the project is running, you can use these commands:

### Development
```bash
npm run dev          # Start development server (http://localhost:3000)
```

### Building
```bash
npm run build        # Build for production
npm start            # Start production server
```

### Database
```bash
npx prisma studio    # Open database GUI (http://localhost:5555)
npx prisma migrate deploy  # Apply migrations
npx prisma generate  # Generate Prisma client
```

### Testing
```bash
npm test             # Run tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage
```

### Blog Generation
```bash
npm run blog:generate  # Generate blog posts
```

### Linting
```bash
npm run lint         # Check code quality
```

---

## 🌐 Access Points

Once running, you can access:

- **Homepage:** http://localhost:3000
- **Blog:** http://localhost:3000/blog
- **Admin Dashboard:** http://localhost:3000/admin/blog
- **System Dashboard:** http://localhost:3000/admin/system
- **Example Comparison:** http://localhost:3000/compare/chatgpt-vs-gemini

---

## 🔍 Verify Everything Works

### 1. Check Homepage
- Visit: http://localhost:3000
- Should see: Hero section, comparison form, trending keywords

### 2. Test Comparison
- Enter: "iPhone" vs "Android"
- Click "Compare Now"
- Should see: Comparison page with charts and insights

### 3. Check Blog
- Visit: http://localhost:3000/blog
- Should see: List of published blog posts

### 4. Check Admin
- Visit: http://localhost:3000/admin/blog
- Should see: Blog post management dashboard

---

## 🎯 Development Workflow

### Making Changes

1. **Edit files** in your code editor
2. **Save** - Next.js auto-reloads (Hot Module Replacement)
3. **See changes** instantly in browser

### Database Changes

If you modify `prisma/schema.prisma`:

```bash
# Create migration
npx prisma migrate dev --name your_migration_name

# Generate client
npx prisma generate
```

### View Database

```bash
npx prisma studio
```

Opens GUI at: http://localhost:5555

---

## 📊 Project Structure

```
trend-compare/
├── app/              # Next.js pages
│   ├── page.tsx      # Homepage
│   ├── compare/      # Comparison pages
│   ├── blog/         # Blog pages
│   └── api/          # API routes
├── components/      # React components
├── lib/              # Business logic
├── prisma/           # Database schema
├── public/           # Static assets
└── .env.local        # Environment variables
```

---

## 🚨 Common Issues & Solutions

### "Cannot find module '@prisma/client'"

**Fix:**
```bash
npx prisma generate
npm install
```

### "Environment variable not found"

**Fix:**
- Check `.env.local` exists
- Restart dev server after changing `.env.local`
- Verify variable names match exactly

### "Database connection timeout"

**Fix:**
- Check `DATABASE_URL` in `.env.local`
- Verify database is accessible
- Check firewall/network settings

### "Port 3000 already in use"

**Fix:**
```bash
# Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## ✅ Success Checklist

- [ ] Node.js 20+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` configured
- [ ] Prisma client generated
- [ ] Database migrations applied
- [ ] Dev server running (`npm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can create comparisons
- [ ] Can view blog posts

---

## 🎉 You're Ready!

Once you see the homepage at http://localhost:3000, you're all set!

**Next Steps:**
1. Test all features
2. Review blog posts
3. Create some comparisons
4. Check mobile responsiveness

---

## 📞 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review error messages in terminal
3. Check browser console for errors
4. Verify all environment variables are set

---

**Happy coding! 🚀**

