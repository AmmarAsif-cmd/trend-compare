# Quick Setup: TikTok Integration

## 🚀 Quick Start

### 1. Get Apify API Key (5 minutes)

1. **Sign up**: Go to [https://apify.com](https://apify.com) and create a free account
2. **Get token**: Go to [Settings → Integrations → API Tokens](https://console.apify.com/account/integrations)
3. **Create token**: Click "Create Token", give it a name, copy it
4. **Add to .env.local**:
   ```env
   APIFY_API_KEY=apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 2. Database Migration ✅ (Already Done!)

The database tables have been created. You should see:
- ✅ `TikTokUser` table
- ✅ `TikTokComparison` table

### 3. Test It

Start your server and test:
```bash
npm run dev
```

Then visit: `http://localhost:3000/api/tiktok/user/charlidamelio`

You should see JSON with user data!

## 📚 Full Guide

For detailed instructions, see: [docs/TIKTOK_API_SETUP.md](docs/TIKTOK_API_SETUP.md)

## 💰 Cost

- **Free tier**: $5 credit/month (~1,000-5,000 requests)
- **Per request**: ~$0.001-0.005
- **No credit card needed** for free tier

