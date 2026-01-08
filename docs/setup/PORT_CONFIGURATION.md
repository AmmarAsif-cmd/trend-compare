# 🔌 Port Configuration Guide

## Current Port Setup

The development server is configured to run on **port 3002** to avoid conflicts with other projects.

---

## 🚀 Running the Development Server

### Standard Command

```bash
npm run dev
```

This will start the server on: **http://localhost:3002**

### Manual Port Override (Optional)

If you need to use a different port temporarily, you can override it:

```bash
# Windows PowerShell
$env:PORT=3005; npm run dev

# Or directly
npx next dev -p 3005
```

---

## 📝 Changing the Default Port

If you want to permanently change the port:

### Option 1: Update package.json (Recommended)

Edit `package.json` and modify the dev script:

```json
{
  "scripts": {
    "dev": "next dev -p YOUR_PORT_NUMBER"
  }
}
```

For example, to use port 4000:
```json
"dev": "next dev -p 4000"
```

### Option 2: Use Environment Variable

Add to your `.env.local`:

```env
PORT=4000
```

Then update `package.json`:
```json
"dev": "next dev -p ${PORT:-3002}"
```

This will use the PORT from `.env.local` or default to 3002.

---

## 🔍 Checking Which Ports Are in Use

### Windows PowerShell

```powershell
# Check if a specific port is in use
netstat -ano | findstr :3002

# See all listening ports
netstat -ano | findstr LISTENING
```

### Windows Command Prompt

```cmd
netstat -ano | findstr :3002
```

---

## 🌐 Accessing the Application

Once the server is running, access it at:

- **Local:** http://localhost:3002
- **Network:** http://YOUR_IP:3002

---

## 🛠️ Common Port Conflicts

| Port | Common Use | Solution |
|------|------------|----------|
| 3000 | Next.js default, React apps | ✅ Using 3002 (current) |
| 3001 | Alternative dev servers | ✅ Using 3002 (current) |
| 8000 | Django, Flask, other Python apps | ✅ Safe to use if needed |
| 8080 | Java apps, alternative HTTP | ✅ Safe to use if needed |

---

## ✅ Current Configuration

- **Development Port:** 3002
- **Production:** Uses hosting platform's default (Vercel, etc.)

The port configuration in `package.json` only affects the development server.

