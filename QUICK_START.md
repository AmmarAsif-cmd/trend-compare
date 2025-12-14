# ⚡ Quick Start - Run Locally

## 🚀 Fastest Way to Start

```bash
# 1. Navigate to project
cd C:\Users\User\Desktop\trend-compare

# 2. Start dev server
npm run dev
```

**That's it!** The server is starting now.

---

## 🌐 Access Your Site

Once the server starts (takes ~10-30 seconds), open:

**http://localhost:3000**

You should see the TrendArc homepage!

---

## ✅ What's Already Set Up

- ✅ **Dependencies:** Installed (`node_modules` exists)
- ✅ **Environment:** `.env.local` configured with all API keys
- ✅ **Database:** Connected to Neon PostgreSQL
- ✅ **Prisma:** Client generated

---

## 📋 Available Commands

### Start Development Server
```bash
npm run dev
```
**Runs on:** http://localhost:3000

### View Database
```bash
npx prisma studio
```
**Opens:** http://localhost:5555

### Generate Blog Posts
```bash
npm run blog:generate
```

### Build for Production
```bash
npm run build
npm start
```

---

## 🎯 Quick Test

1. **Homepage:** http://localhost:3000
2. **Try a comparison:** Enter "iPhone" vs "Android"
3. **View blog:** http://localhost:3000/blog
4. **Admin dashboard:** http://localhost:3000/admin/blog

---

## 🛑 Stop the Server

Press `Ctrl + C` in the terminal where it's running.

---

## 📝 Full Setup Guide

For detailed instructions, see: **LOCAL_SETUP_GUIDE.md**

---

**Your dev server should be starting now! Check http://localhost:3000 in a few seconds.**

