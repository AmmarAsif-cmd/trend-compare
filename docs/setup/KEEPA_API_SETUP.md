# 🔑 Keepa API Key Setup Guide

This guide will walk you through getting a Keepa API key and configuring it in your TrendArc application.

## 📋 What is Keepa?

Keepa provides Amazon product data including:
- Price history tracking
- Sales rank data
- Review and rating information
- Product availability
- Historical trends

This data powers the product research features in TrendArc.

---

## 🚀 Step 1: Sign Up for Keepa

1. **Visit Keepa API Website:**
   - Go to: https://keepa.com/#!api
   - Click on **"Get Started"** or **"Register"**

2. **Create an Account:**
   - Fill in your email address
   - Create a password
   - Accept the terms of service
   - Click **"Sign Up"**

3. **Verify Your Email:**
   - Check your inbox for a verification email
   - Click the verification link

---

## 🔐 Step 2: Generate API Key

1. **Log In to Keepa:**
   - Go to: https://keepa.com/#!api
   - Enter your credentials and log in

2. **Navigate to API Settings:**
   - Once logged in, look for **"API Access"** or **"API Keys"** in the menu
   - Click on it

3. **Generate New API Key:**
   - Click **"Generate New API Key"** or **"Create API Key"**
   - Give it a name (e.g., "TrendArc Development" or "TrendArc Production")
   - Copy the API key immediately (you won't be able to see it again)

   ⚠️ **IMPORTANT:** Save this key securely! You won't be able to view it again later.

---

## 💰 Step 3: Choose a Plan

Keepa offers different pricing tiers:

| Plan | Monthly Requests | Price | Best For |
|------|-----------------|-------|----------|
| **Free** | 100 requests/month | $0 | Testing & Development |
| **Basic** | 5,000 requests/month | ~$10 | Small projects |
| **Professional** | 50,000 requests/month | ~$50 | Medium projects |
| **Enterprise** | Unlimited* | Custom | Large scale |

**Recommendation for Development:**
- Start with the **Free tier** (100 requests/month) to test
- Upgrade to **Basic** if you need more requests

**Note:** Each product search/analysis uses 1 request. With caching enabled in TrendArc, you can significantly reduce API usage.

---

## ⚙️ Step 4: Configure API Key in TrendArc

1. **Locate Your `.env.local` File:**
   - In your project root directory (`C:\Users\User\Desktop\Project\trned-compare-cursor\trend-compare`)
   - If it doesn't exist, create a new file named `.env.local`

2. **Add the Keepa API Key:**
   
   Open `.env.local` and add:

   ```env
   # Keepa API Configuration
   KEEPA_API_KEY=your_keepa_api_key_here
   ```

   **Replace `your_keepa_api_key_here` with your actual API key.**

   Example:
   ```env
   KEEPA_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
   ```

3. **Save the File:**
   - Save the `.env.local` file
   - Make sure there are **no spaces** around the `=` sign
   - Make sure there are **no quotes** around the API key (unless Keepa provides it with quotes)

---

## 🔄 Step 5: Restart Development Server

After adding the API key, you must restart your dev server:

1. **Stop the current server:**
   - Press `Ctrl + C` in your terminal

2. **Start the server again:**
   ```bash
   npm run dev
   ```

3. **Verify it's running on port 3002:**
   - You should see: `Ready - started server on 0.0.0.0:3002`
   - Open: http://localhost:3002

---

## ✅ Step 6: Test the Integration

1. **Navigate to Product Search:**
   - Go to: http://localhost:3002
   - You should see the product search hero section

2. **Search for a Product:**
   - Try searching for a popular product like:
     - "Yoga Mat"
     - "Phone Case"
     - "Resistance Bands"

3. **Check the Results:**
   - You should see product data including:
     - Price history chart
     - Current price
     - Average price
     - Competition metrics
     - AI insights (if Anthropic API is also configured)

4. **Check Server Console:**
   - Look at your terminal where `npm run dev` is running
   - You should see logs like:
     ```
     [Keepa] Fetching product data for: yoga mat
     [Keepa] Product data fetched successfully
     ```

---

## 🐛 Troubleshooting

### Issue 1: "KEEPA_API_KEY is not configured"
**Symptoms:** Console shows error about missing API key

**Solutions:**
- ✅ Make sure `.env.local` file exists in the root directory
- ✅ Check that the file is named exactly `.env.local` (not `.env` or `.env.local.txt`)
- ✅ Verify the variable name is exactly `KEEPA_API_KEY` (case-sensitive)
- ✅ Restart your dev server after adding the key

### Issue 2: "Keepa API error: Invalid API key"
**Symptoms:** API calls fail with authentication error

**Solutions:**
- ✅ Double-check your API key in Keepa dashboard
- ✅ Make sure there are no extra spaces or characters
- ✅ Verify the API key hasn't expired or been revoked
- ✅ Check if you've reached your monthly request limit

### Issue 3: "Keepa API rate limit exceeded"
**Symptoms:** Console shows rate limit error

**Solutions:**
- ✅ Check your Keepa plan and monthly request limit
- ✅ Wait a bit before making more requests
- ✅ Enable caching (already enabled in TrendArc) to reduce API calls
- ✅ Consider upgrading your Keepa plan

### Issue 4: No Product Data Showing
**Symptoms:** Page loads but no product information displays

**Solutions:**
- ✅ Check browser console (F12) for errors
- ✅ Verify Keepa API key is correct
- ✅ Try a different product search term
- ✅ Check if the product exists on Amazon
- ✅ Verify your Keepa account is active

---

## 📊 Monitoring API Usage

TrendArc includes API monitoring features:

1. **Check API Usage:**
   - Visit: http://localhost:3002/api/admin/api-usage
   - View usage statistics and estimated costs

2. **Monitor in Keepa Dashboard:**
   - Log in to https://keepa.com/#!api
   - Check your usage statistics
   - Monitor remaining requests for the month

---

## 🔒 Security Best Practices

1. **Never Commit API Keys:**
   - ✅ `.env.local` is already in `.gitignore`
   - ❌ Never commit API keys to Git
   - ❌ Never share API keys in screenshots or public forums

2. **Use Environment-Specific Keys:**
   - Development: Use Free/Basic tier key
   - Production: Use separate Professional/Enterprise key

3. **Rotate Keys Regularly:**
   - Change API keys every few months
   - Revoke old keys when creating new ones

4. **Monitor Usage:**
   - Set up alerts if you have high usage
   - Review API logs regularly

---

## 📝 Additional Resources

- **Keepa API Documentation:** https://keepa.com/#!api
- **Keepa API Reference:** https://keepa.com/#!discuss/t/keepa-api-documentation/116
- **Keepa Support:** https://keepa.com/#!discuss

---

## 🎯 Next Steps

Once Keepa is configured, you can also set up:

1. **Anthropic API** - For AI-powered product insights
   - Guide: Check `README.md` for Anthropic setup

2. **Upstash Redis** - For better caching (optional but recommended)
   - Helps reduce API costs by caching results

3. **Google Trends** - Already integrated (no API key needed)
   - Provides search trend data

---

## ✅ Checklist

- [ ] Created Keepa account
- [ ] Generated API key
- [ ] Added `KEEPA_API_KEY` to `.env.local`
- [ ] Restarted dev server
- [ ] Tested product search
- [ ] Verified product data displays correctly
- [ ] Checked API usage monitoring

---

**Need Help?** If you encounter any issues, check the troubleshooting section above or review the server console logs for detailed error messages.

