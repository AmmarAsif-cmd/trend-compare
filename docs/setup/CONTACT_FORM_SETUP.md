# 📧 Contact Form Setup Guide

## ✅ **What's Been Done**

1. ✅ **Removed social icons** from footer (Twitter, LinkedIn, GitHub, Email)
2. ✅ **Created contact form component** (`components/ContactForm.tsx`)
3. ✅ **Created API route** (`app/api/contact/route.ts`)
4. ✅ **Updated contact page** with the form

---

## 🔧 **Email Configuration Required**

The contact form is ready, but you need to configure email sending. Choose one of these options:

### **Option 1: Resend (Recommended - Easiest)**

1. **Sign up at [resend.com](https://resend.com)** (free tier: 3,000 emails/month)
2. **Get your API key** from the dashboard
3. **Install Resend:**
   ```bash
   npm install resend
   ```
4. **Add to `.env`:**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   CONTACT_EMAIL=your-email@example.com
   ```
5. **Uncomment Resend code** in `app/api/contact/route.ts` (lines 20-30)

---

### **Option 2: SendGrid**

1. **Sign up at [sendgrid.com](https://sendgrid.com)** (free tier: 100 emails/day)
2. **Create API key** in Settings → API Keys
3. **Install SendGrid:**
   ```bash
   npm install @sendgrid/mail
   ```
4. **Add to `.env`:**
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   CONTACT_EMAIL=your-email@example.com
   ```
5. **Uncomment SendGrid code** in `app/api/contact/route.ts` (lines 33-45)

---

### **Option 3: Nodemailer (SMTP)**

1. **Get SMTP credentials** from your email provider (Gmail, Outlook, etc.)
2. **Install Nodemailer:**
   ```bash
   npm install nodemailer
   ```
3. **Add to `.env`:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM=contact@trendarc.net
   CONTACT_EMAIL=your-email@example.com
   ```
4. **Uncomment Nodemailer code** in `app/api/contact/route.ts` (lines 48-65)

**Note for Gmail:** You'll need to use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

---

### **Option 4: Webhook (Zapier/Make.com/n8n)**

If you prefer using automation tools:

1. **Set up a webhook** in Zapier, Make.com, or n8n
2. **Add to `.env`:**
   ```env
   CONTACT_WEBHOOK_URL=https://your-webhook-url.com
   CONTACT_EMAIL=your-email@example.com
   ```
3. The webhook will receive the form data and you can configure it to send emails

---

## 📝 **Environment Variables**

**Required:**
```env
CONTACT_EMAIL=your-email@example.com
```

**For Resend:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**For SendGrid:**
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

**For Nodemailer:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=contact@trendarc.net
```

**For Webhook:**
```env
CONTACT_WEBHOOK_URL=https://your-webhook-url.com
```

---

## 🧪 **Testing**

1. **Start your dev server:**
   ```bash
   npm run dev
   ```
2. **Go to:** `http://localhost:3000/contact`
3. **Fill out the form** and submit
4. **Check your email** (or webhook logs)

---

## ✅ **Current Status**

- ✅ Form UI is complete
- ✅ Form validation works
- ✅ API route is ready
- ⚠️ **Email sending needs configuration** (choose one option above)

---

## 🚀 **Quick Start (Resend - Recommended)**

1. `npm install resend`
2. Add `RESEND_API_KEY` and `CONTACT_EMAIL` to `.env`
3. Uncomment Resend code in `app/api/contact/route.ts`
4. Test the form!

---

**Once you provide your email, I can help you set up the specific email service!**

