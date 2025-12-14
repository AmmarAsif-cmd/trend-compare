# 📧 Email Setup Instructions

## ✅ **Email Address Configured**
Your contact form is set to send emails to: **manipulator550@gmail.com

## 🚀 **Quick Setup Options**

### **Option 1: Resend (Recommended - Easiest)**

**Steps:**
1. **Sign up at [resend.com](https://resend.com)** (free: 3,000 emails/month)
2. **Get your API key** from the dashboard
3. **Install Resend:**
   ```bash
   npm install resend
   ```
4. **Add to `.env`:**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   CONTACT_EMAIL=manipulator550@gmail.com
   RESEND_FROM_EMAIL=TrendArc <onboarding@resend.dev>
   ```
   Note: You'll need to verify your domain or use `onboarding@resend.dev` for testing

**That's it!** The form will automatically use Resend.

---

### **Option 2: Gmail SMTP (Using Your Gmail Account)**

**Steps:**
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Create an App Password:**
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password
3. **Install Nodemailer:**
   ```bash
   npm install nodemailer
   ```
4. **Add to `.env`:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=manipulator550@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   SMTP_FROM=manipulator550@gmail.com
   CONTACT_EMAIL=manipulator550@gmail.com
   ```

**That's it!** The form will automatically use Gmail SMTP.

---

## 📝 **Environment Variables**

Create or update your `.env` file with one of these configurations:

### **For Resend:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
CONTACT_EMAIL=manipulator550@gmail.com
RESEND_FROM_EMAIL=TrendArc <onboarding@resend.dev>
```

### **For Gmail SMTP:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=manipulator550@gmail.com
SMTP_PASSWORD=your-app-password-here
SMTP_FROM=manipulator550@gmail.com
CONTACT_EMAIL=manipulator550@gmail.com
```

---

## 🧪 **Testing**

1. **Start your dev server:**
   ```bash
   npm run dev
   ```
2. **Go to:** `http://localhost:3000/contact`
3. **Fill out and submit the form**
4. **Check your email:** manipulator550@gmail.com

---

## ✅ **Current Status**

- ✅ Contact form is ready
- ✅ Email address configured: manipulator550@gmail.com
- ✅ Code supports both Resend and Gmail SMTP
- ⚠️ **You need to:**
  - Choose one option (Resend or Gmail SMTP)
  - Install the required package (`npm install resend` or `npm install nodemailer`)
  - Add environment variables to `.env`

---

## 💡 **Recommendation**

**Use Resend** - It's easier to set up and more reliable for production. Gmail SMTP can be blocked or rate-limited.

---

## 🔒 **Security Note**

Never commit your `.env` file to git! It contains sensitive credentials.

---

**Once you've set up one of the options above, the contact form will be fully functional!**

