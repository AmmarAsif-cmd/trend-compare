# TikTok Integration Setup Guide

This guide explains how to set up the TikTok integration for TrendArc using the Apify TikTok Scraper API.

## Overview

The TikTok integration allows users to compare TikTok creators by fetching their profile data, including:
- Profile pictures (avatars)
- Follower counts
- Engagement metrics
- Verification status
- Bio and display names

## Getting Your Apify API Key

### Step 1: Sign Up for Apify

1. **Visit Apify**: Go to [https://apify.com](https://apify.com)
2. **Sign Up**: Click "Sign Up" in the top right corner
   - You can sign up with:
     - Google account
     - GitHub account
     - Email address
3. **Verify Your Email**: Check your email and click the verification link

### Step 2: Navigate to API Tokens

1. **Go to Settings**: Click on your profile picture/avatar in the top right
2. **Select "Settings"**: From the dropdown menu
3. **Open "Integrations" Tab**: Click on "Integrations" in the settings menu
4. **Find "API Tokens"**: Scroll down to the "API Tokens" section

**OR** use the direct link:
- [https://console.apify.com/account/integrations](https://console.apify.com/account/integrations)

### Step 3: Create API Token

1. **Click "Create Token"**: In the API Tokens section
2. **Token Name**: Give it a descriptive name (e.g., "TrendArc TikTok Integration")
3. **Token Type**: Select "Full Access" (or "Custom" if you want to limit permissions)
4. **Click "Create"**: The token will be generated
5. **Copy the Token**: ⚠️ **IMPORTANT**: Copy the token immediately - you won't be able to see it again!

The token will look something like:
```
apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 4: Add Token to Your Environment

1. **Open your `.env.local` file** in the project root directory
2. **Add the API key**:

```env
APIFY_API_KEY=apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. **Save the file**

⚠️ **Security Note**: 
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Keep your API key secret
- Don't share it publicly

### Step 5: Restart Your Development Server

After adding the API key, restart your Next.js development server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Testing the Integration

### Test the API Endpoint

You can test if the integration is working by making a request to:

```
GET /api/tiktok/user/[username]
```

**Example:**
```
http://localhost:3000/api/tiktok/user/charlidamelio
```

**Expected Response:**
```json
{
  "id": "...",
  "username": "charlidamelio",
  "displayName": "Charli D'Amelio",
  "avatarUrl": "https://p16-sign-va.tiktokcdn.com/...",
  "followerCount": 152000000,
  "followingCount": 500,
  "videoCount": 5000,
  "likeCount": 10000000000,
  "engagementRate": 6.58,
  "verified": true,
  "bio": "...",
  "profileUrl": "https://www.tiktok.com/@charlidamelio",
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

### Test with cURL

```bash
curl http://localhost:3000/api/tiktok/user/charlidamelio
```

### Test in Browser

1. Start your dev server: `npm run dev`
2. Open browser: `http://localhost:3000/api/tiktok/user/charlidamelio`
3. You should see JSON response with user data

## Apify Pricing & Limits

### Free Tier

Apify offers a **free tier** with:
- **$5 credit** per month (approximately 1,000-5,000 API calls, depending on usage)
- Perfect for development and testing
- No credit card required

### Paid Plans

If you need more:
- **Personal**: $49/month - Includes $500 credit
- **Team**: $499/month - Includes $5,000 credit
- **Enterprise**: Custom pricing

### TikTok Scraper Costs

The TikTok Profile Scraper actor costs approximately:
- **$0.001 - $0.005 per profile scrape** (very affordable!)
- Free tier gives you ~1,000-5,000 profile fetches per month

## Troubleshooting

### Error: "Apify API key not configured"

**Solution**: 
- Make sure `APIFY_API_KEY` is set in `.env.local`
- Restart your development server
- Check that the key starts with `apify_api_`

### Error: "Apify API quota exceeded"

**Solutions**:
- You've used up your free tier credits
- Wait for monthly reset, or upgrade your plan
- Check your usage at [Apify Console](https://console.apify.com/account/billing)

### Error: "User not found"

**Possible causes**:
- Username doesn't exist on TikTok
- Username is misspelled
- User's profile is private or deleted

**Solution**: Verify the username exists on TikTok before testing

### Error: "Request to Apify API timed out"

**Solutions**:
- Apify service might be experiencing issues
- Try again after a few minutes
- Check [Apify Status Page](https://status.apify.com/)

### Database Migration Issues

If you see Prisma errors:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

## API Usage Best Practices

1. **Caching**: User profiles are cached for 24 hours to reduce API calls
2. **Error Handling**: The system gracefully handles API failures with fallbacks
3. **Rate Limiting**: Be mindful of Apify's rate limits (check their documentation)

## Additional Resources

- **Apify Documentation**: [https://docs.apify.com](https://docs.apify.com)
- **Apify Console**: [https://console.apify.com](https://console.apify.com)
- **TikTok Scraper Actor**: [https://apify.com/apidojo/tiktok-profile-scraper](https://apify.com/apidojo/tiktok-profile-scraper)
- **Apify Support**: [https://apify.com/support](https://apify.com/support)

## Security & Compliance

⚠️ **Important Notes**:

1. **TikTok Terms of Service**: Make sure your usage complies with TikTok's ToS
2. **Data Privacy**: Handle user data responsibly (GDPR, CCPA compliance)
3. **Rate Limiting**: Don't abuse the API - use caching appropriately
4. **API Key Security**: Never expose your API key in client-side code

---

## Quick Setup Checklist

- [ ] Signed up for Apify account
- [ ] Created API token
- [ ] Added `APIFY_API_KEY` to `.env.local`
- [ ] Restarted development server
- [ ] Tested API endpoint with a real username
- [ ] Verified response includes user data

✅ **Once all steps are complete, your TikTok integration is ready to use!**

