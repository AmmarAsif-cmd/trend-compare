# 🔒 Admin Security - Quick Start

## ⚡ Quick Setup (5 minutes)

### 1. Generate Secure Admin Path
```bash
node -e "console.log('cp-' + require('crypto').randomBytes(8).toString('hex'))"
```
Copy the output (e.g., `cp-9a4eef788c8daaec`)

### 2. Generate Password Hash
```bash
tsx scripts/generate-password-hash.ts your-secure-password
```
Copy the `ADMIN_PASSWORD_HASH` value

### 3. Generate Session Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Update `.env.local`
```env
ADMIN_PATH=cp-9a4eef788c8daaec
ADMIN_PASSWORD_HASH=your-hash-here
SESSION_SECRET=your-session-secret-here
```

### 5. Restart Server
```bash
npm run dev
```

## ✅ Done!

Your admin panel is now at:
```
http://localhost:3000/cp-9a4eef788c8daaec/login
```

## 📚 Full Documentation

See `ADMIN_SECURITY_GUIDE.md` for complete details.

