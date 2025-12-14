# 🔧 Contact Form Troubleshooting

## ❌ **Error: "Failed to send message"**

### **Step 1: Check Environment Variables**

Make sure you have a `.env.local` file in the root directory with:

```env
RESEND_API_KEY=re_GiG3iJJT_P5eF46eG6wSHRDj38XJ9FZFu
CONTACT_EMAIL=manipulator550@gmail.com
RESEND_FROM_EMAIL=TrendArc <onboarding@resend.dev>
```

**Important:** 
- File must be named `.env.local` (not `.env`)
- Must be in the root directory (`C:\Users\User\Desktop\trend-compare\.env.local`)
- No spaces around the `=` sign
- Restart your dev server after creating/updating the file

### **Step 2: Check Server Console**

Look at your terminal/console where `npm run dev` is running. You should see:
- `Sending email with config:` - shows if API key is loaded
- `Resend error details:` - shows the actual error from Resend

### **Step 3: Common Issues**

#### **Issue 1: API Key Not Loaded**
**Symptoms:** Console shows "RESEND_API_KEY is not set"
**Fix:** 
- Make sure `.env.local` exists
- Restart dev server: Stop (Ctrl+C) and run `npm run dev` again

#### **Issue 2: Invalid API Key**
**Symptoms:** Console shows "Resend error: Invalid API key"
**Fix:**
- Verify your API key at [resend.com](https://resend.com/api-keys)
- Make sure there are no extra spaces or quotes in `.env.local`

#### **Issue 3: Domain Not Verified**
**Symptoms:** Console shows "Domain not verified" or "Unauthorized"
**Fix:**
- For testing, use `onboarding@resend.dev` as the FROM email (already set)
- For production, verify your domain in Resend dashboard

#### **Issue 4: Rate Limit**
**Symptoms:** Console shows "Rate limit exceeded"
**Fix:**
- Free tier: 3,000 emails/month
- Wait a bit and try again
- Check your usage in Resend dashboard

### **Step 4: Test the API Key**

You can test if your API key works by checking the Resend dashboard or using their API directly.

### **Step 5: Check Browser Console**

Open browser DevTools (F12) → Console tab → Look for any errors when submitting the form.

---

## ✅ **Quick Checklist**

- [ ] `.env.local` file exists in root directory
- [ ] `RESEND_API_KEY` is set correctly
- [ ] `CONTACT_EMAIL` is set to `manipulator550@gmail.com`
- [ ] Dev server was restarted after creating `.env.local`
- [ ] Resend package is installed: `npm install resend`
- [ ] Check server console for detailed error messages

---

## 🧪 **Testing Steps**

1. **Check environment variables are loaded:**
   - Submit the form
   - Check server console for: `Sending email with config:`
   - Should show `hasApiKey: true`

2. **If API key is loaded but still failing:**
   - Check the `Resend error details:` in console
   - The error message will tell you what's wrong

3. **Test with a simple email:**
   - Fill out the form
   - Submit
   - Check your email: manipulator550@gmail.com

---

## 📞 **Still Not Working?**

1. **Check Resend Dashboard:**
   - Go to [resend.com](https://resend.com)
   - Check API keys section
   - Verify the key is active
   - Check logs/activity

2. **Verify Email in Resend:**
   - For production, you need to verify your domain
   - For testing, `onboarding@resend.dev` should work

3. **Check Network Tab:**
   - Open DevTools → Network tab
   - Submit form
   - Look for `/api/contact` request
   - Check the response for error details

---

**The improved error handling will now show you exactly what's wrong!**

