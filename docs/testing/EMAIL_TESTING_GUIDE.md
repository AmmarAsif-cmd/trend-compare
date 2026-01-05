# 📧 Email Testing Guide

This guide will help you test and debug email functionality in TrendArc.

## 🚀 Quick Test Methods

### Method 1: Test API Endpoint (Easiest)

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Check email configuration:**
   ```bash
   curl http://localhost:3000/api/test/email
   ```
   Or visit: `http://localhost:3000/api/test/email` in your browser

3. **Send a test email:**
   ```bash
   curl -X POST http://localhost:3000/api/test/email \
     -H "Content-Type: application/json" \
     -d '{"to": "your-email@example.com", "type": "verification"}'
   ```

   Or use the browser console:
   ```javascript
   fetch('/api/test/email', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       to: 'your-email@example.com',
       type: 'verification' // or 'password-reset', 'contact', 'custom'
     })
   }).then(r => r.json()).then(console.log)
   ```

### Method 2: Test Script

1. **Set your test email in `.env`:**
   ```env
   TEST_EMAIL_RECIPIENT=your-email@example.com
   ```

2. **Run the test script:**
   ```bash
   npx tsx scripts/test-resend.ts
   ```

### Method 3: Test via Signup Flow

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Go to signup page:** `http://localhost:3000/signup`

3. **Create a test account** with a real email address

4. **Check your email** for the verification email

5. **Check server logs** for email sending status

## 🔍 Debugging Email Issues

### Check Configuration

1. **Verify environment variables are set:**
   ```bash
   # Check if variables are loaded
   node -e "require('dotenv').config(); console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'NOT SET')"
   ```

2. **Check email configuration status:**
   - Visit: `http://localhost:3000/api/test/email` (GET request)
   - This shows what email service is configured

### Common Issues

#### Issue 1: "No email service configured"

**Symptoms:**
- Email logs show: `[Email] No email service configured`
- No emails are sent

**Solution:**
1. Add `RESEND_API_KEY` to your `.env` file:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM_EMAIL=TrendArc <onboarding@resend.dev>
   ```

2. Or configure SMTP:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   ```

#### Issue 2: "Domain verification issue"

**Symptoms:**
- Error: `Domain not verified` or similar
- Resend API returns domain-related error

**Solution:**
1. **For testing:** Use `onboarding@resend.dev` (limited to 100 emails/day)
   ```env
   RESEND_FROM_EMAIL=TrendArc <onboarding@resend.dev>
   ```

2. **For production:** Verify your domain in Resend dashboard
   - Go to [Resend Dashboard](https://resend.com/domains)
   - Add and verify your domain
   - Update `RESEND_FROM_EMAIL` to use your domain:
     ```env
     RESEND_FROM_EMAIL=TrendArc <noreply@yourdomain.com>
     ```

#### Issue 3: "API key invalid"

**Symptoms:**
- Error: `Unauthorized` or `Invalid API key`
- 401 status code from Resend

**Solution:**
1. Verify your API key in [Resend Dashboard](https://resend.com/api-keys)
2. Make sure the key starts with `re_`
3. Check that the key is active (not revoked)
4. Ensure `.env` file is loaded (restart dev server after changes)

#### Issue 4: "SMTP authentication failed"

**Symptoms:**
- SMTP error: `Invalid login` or `Authentication failed`

**Solution:**
1. **For Gmail:**
   - Enable 2-Factor Authentication
   - Create an [App Password](https://myaccount.google.com/apppasswords)
   - Use the 16-character app password (not your regular password)

2. **Check SMTP settings:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   ```

## 📊 Test Email Types

The test endpoint supports different email types:

- `verification` - Email verification email (default)
- `password-reset` - Password reset email
- `contact` - Contact form email
- `custom` - Simple test email

## 🧪 Testing Checklist

- [ ] Environment variables are set in `.env`
- [ ] Dev server restarted after `.env` changes
- [ ] Test endpoint shows configuration: `GET /api/test/email`
- [ ] Test email sent successfully: `POST /api/test/email`
- [ ] Email received in inbox (check spam folder)
- [ ] Server logs show email sent successfully
- [ ] Signup flow sends verification email
- [ ] Forgot password sends reset email

## 📝 Server Logs

Watch your server logs for email status:

**Success:**
```
[Email] Sent via Resend: { id: 'abc123', to: 'user@example.com', subject: '...' }
```

**Error:**
```
[Email] Resend error details: { message: '...', status: 401 }
```

## 🔗 Quick Links

- [Resend Dashboard](https://resend.com)
- [Resend API Keys](https://resend.com/api-keys)
- [Resend Domains](https://resend.com/domains)
- [Gmail App Passwords](https://myaccount.google.com/apppasswords)

## 💡 Tips

1. **Always check spam folder** - Test emails often go to spam initially
2. **Use real email addresses** - Some email providers block test domains
3. **Check rate limits** - Resend free tier: 3,000/month, `onboarding@resend.dev`: 100/day
4. **Restart dev server** after changing `.env` file
5. **Check server logs** for detailed error messages

