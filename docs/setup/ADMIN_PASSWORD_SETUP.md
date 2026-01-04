# 🔐 Admin Password Setup

## Simple Setup (Recommended for Development)

Just set your password directly in `.env.local`:

```env
ADMIN_PASSWORD=your-secure-password-here
```

The system will automatically hash it securely for comparison. **That's it!**

## Advanced Setup (Recommended for Production)

For production, use a pre-hashed password:

### Step 1: Generate Password Hash
```bash
tsx scripts/generate-password-hash.ts your-password
```

### Step 2: Add to `.env.local`
```env
ADMIN_PASSWORD_HASH=5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
```

## Which Method to Use?

### Use `ADMIN_PASSWORD` (Simple) if:
- ✅ You're in development
- ✅ You want quick setup
- ✅ You're the only one accessing the admin
- ✅ Your `.env.local` is secure (not in git)

### Use `ADMIN_PASSWORD_HASH` (Advanced) if:
- ✅ You're in production
- ✅ Multiple people have access to `.env.local`
- ✅ You want extra security (password not visible in env file)
- ✅ You're following security best practices

## Security Notes

### Both methods are secure because:
- ✅ Passwords are hashed before comparison
- ✅ Constant-time comparison prevents timing attacks
- ✅ No plain text passwords stored in memory
- ✅ SHA-256 hashing (one-way, cannot be reversed)

### The difference:
- `ADMIN_PASSWORD`: Password visible in `.env.local` (but still secure in use)
- `ADMIN_PASSWORD_HASH`: Only hash visible in `.env.local` (password never stored)

## Example `.env.local`

```env
# Admin Configuration
ADMIN_PATH=cp-9a4eef7
ADMIN_PASSWORD=my-secure-password-123

# Session Security
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# Other environment variables...
ANTHROPIC_API_KEY=sk-ant-...
```

## Changing Your Password

### If using ADMIN_PASSWORD:
Just change the value in `.env.local`:
```env
ADMIN_PASSWORD=new-password-here
```

### If using ADMIN_PASSWORD_HASH:
1. Generate new hash:
   ```bash
   tsx scripts/generate-password-hash.ts new-password
   ```
2. Update `.env.local`:
   ```env
   ADMIN_PASSWORD_HASH=new-hash-here
   ```

## Troubleshooting

### "Invalid password" error
- ✅ Check for extra spaces in `.env.local`
- ✅ Make sure password is on one line
- ✅ Restart server after changing `.env.local`
- ✅ Check you're using the correct password

### Password not working
- ✅ Verify `.env.local` is in the project root
- ✅ Check file is named exactly `.env.local` (not `.env`)
- ✅ Restart Next.js dev server
- ✅ Check console for warnings about missing password

## Priority

If both `ADMIN_PASSWORD_HASH` and `ADMIN_PASSWORD` are set:
- `ADMIN_PASSWORD_HASH` takes precedence
- `ADMIN_PASSWORD` is ignored

## Summary

**For most users:** Just set `ADMIN_PASSWORD=your-password` in `.env.local` and you're done! 🎉

The system handles all the security automatically.

