# 🔍 Error Debugging Guide

## If You're Seeing "Something went wrong"

The error page has been improved to show more helpful information. Here's how to debug:

### 1. **Check Browser Console**
Open browser DevTools (F12) and check the Console tab for error messages. Look for:
- Red error messages
- Stack traces
- Network errors

### 2. **Check Network Tab**
In DevTools, go to Network tab and look for:
- Failed API requests (red status codes)
- 500 errors (server errors)
- 429 errors (rate limits)
- Timeout errors

### 3. **Common Causes**

#### **API Errors**
- **YouTube API Quota Exceeded**: Check if you've hit YouTube API limits
- **Missing API Keys**: Check `.env.local` for required keys
- **Network Issues**: Check internet connection

#### **Database Errors**
- **Connection Issues**: Check if database is running
- **Schema Issues**: Run `npx prisma migrate deploy`

#### **Build Errors**
- **TypeScript Errors**: Check for type mismatches
- **Missing Dependencies**: Run `npm install`

### 4. **Quick Fixes**

```bash
# Restart development server
npm run dev

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build

# Check environment variables
cat .env.local
```

### 5. **Check Server Logs**

Look at your terminal/console where the dev server is running for:
- Error stack traces
- API call failures
- Database connection errors

### 6. **Specific Error Types**

The improved error page now detects:
- **Network Errors**: Connection issues
- **Timeout Errors**: Request took too long
- **Quota Errors**: API limits reached
- **Not Found Errors**: Missing pages/comparisons

### 7. **Report the Error**

If the error persists, include:
1. Browser console errors
2. Network tab errors
3. Server terminal logs
4. The URL you were trying to access
5. Steps to reproduce

## Improved Error Page Features

The new error page:
- ✅ Shows specific error types
- ✅ Provides helpful suggestions
- ✅ Includes technical details (collapsible)
- ✅ Links to contact page
- ✅ Better visual design

