# Production Hosting & Deployment Guide

This guide explains how to host and deploy **GJS Railway Name Board Studio** to production.

---

## 🎯 Quick Comparison of Hosting Platforms

| Hosting Platform | Cost | Setup Time | Best For | Indian Speed / CDN |
| :--- | :--- | :--- | :--- | :--- |
| **Vercel** *(Recommended)* | **100% Free** | 2 minutes | Easiest zero-config deploy, automatic SSL, CI/CD from GitHub | ⭐⭐⭐⭐⭐ (Mumbai Edge) |
| **Cloudflare Pages** | **100% Free** | 3 minutes | Unlimited bandwidth, lowest latency across India | ⭐⭐⭐⭐⭐ (7+ Indian PoPs) |
| **Netlify** | **100% Free** | 2 minutes | Drag-and-drop `dist` folder or Git-based deployment | ⭐⭐⭐⭐ (Global CDN) |
| **Hostinger / DigitalOcean VPS** | ₹300 - ₹500/mo | 15 minutes | Full server control, custom domain, Nginx/Docker setup | ⭐⭐⭐⭐⭐ (India Datacenter) |

---

## 🚀 Option 1: Deploy on Vercel (Recommended — 2 Minutes)

Vercel is the fastest and most reliable platform for modern Vite + React applications.

### Steps:
1. Push your project code to **GitHub**, **GitLab**, or **Bitbucket**.
2. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
3. Click **"Add New..."** > **"Project"**.
4. Import your repository: `GJS-NM-EDITOR`.
5. Vercel will automatically detect **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Expand **"Environment Variables"** and add (optional):
   - `VITE_ADMIN_PASSCODE` = *your secret admin passcode*
   - `VITE_CASHFREE_ENV` = `production` (or `sandbox` for testing)
   - `VITE_CASHFREE_APP_ID` = *your live Cashfree App ID*
   - `VITE_CASHFREE_SECRET_KEY` = *your live Cashfree Secret Key*
7. Click **Deploy**.
8. In ~30 seconds, your site is live with a free `.vercel.app` URL and automatic HTTPS!
9. *(Optional)* Add your custom domain under **Project Settings > Domains** (e.g. `studio.yourdomain.com`).

> **Note**: A pre-configured [`vercel.json`](./vercel.json) is already included in the root folder with SPA rewrites and security headers.

---

## 🌐 Option 2: Deploy on Cloudflare Pages (Free & Fastest in India)

Cloudflare has data centers in Mumbai, Delhi, Chennai, Hyderabad, and Bangalore, giving lightning-fast performance for Indian users.

### Steps:
1. Go to **[pages.cloudflare.com](https://pages.cloudflare.com)** and log in.
2. Click **"Create a project"** > **"Connect to Git"**.
3. Select your repository.
4. Set Build Settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **"Save and Deploy"**.

The included [`public/_redirects`](./public/_redirects) automatically ensures single-page routing without 404s.

---

## 📦 Option 3: Deploy on Netlify (1-Click or Drag & Drop)

### Drag-and-Drop (No Git Required):
1. Run local build:
   ```bash
   npm run build
   ```
2. Go to **[app.netlify.com/drop](https://app.netlify.com/drop)**.
3. Drag and drop the generated `dist` folder into the browser.
4. Your site will be live instantly!

### Or Git Connect:
- Connect your GitHub repository.
- Build command: `npm run build`
- Publish directory: `dist`
- The included [`netlify.toml`](./netlify.toml) configures headers, caching, and rewrites.

---

## 🖥️ Option 4: Deploy on VPS with Docker (Hostinger, DigitalOcean, AWS EC2)

If you have an Ubuntu/Debian VPS with Docker installed:

### 1-Command Startup:
```bash
# Clone your repository onto the VPS
git clone <your-repo-url>
cd GJS-NM-EDITOR

# Build and start the production container
docker compose up -d --build
```
Your app will run inside an optimized Alpine Nginx container on port `80`.

### To connect a domain with Free SSL (Certbot):
Install Nginx and Certbot on your host:
```bash
sudo apt update && sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 💳 Cashfree Payments: Production Activation Checklist

To accept real money from users in India via UPI, Cards, and Netbanking:

1. **Complete Cashfree Merchant KYC**:
   - Log in to your [Cashfree Merchant Dashboard](https://merchant.cashfree.com).
   - Complete Business KYC (PAN, GSTIN/Bank Account details).
   - Once approved by Cashfree's compliance team, click the switch from **"Test Environment"** to **"Production"** in the top navigation bar.

2. **Retrieve Production Credentials**:
   - In Cashfree Merchant Dashboard, go to: **Payment Gateway > Developers > API Keys**.
   - Copy your **Live App ID** and **Live Secret Key**.

3. **Configure in Studio**:
   - In your deployed app, log in as **Admin**.
   - Go to **Template Details > Store Pricing & Access > Cashfree API Settings**.
   - Paste your **Live App ID** and **Live Secret Key**.
   - Set **Environment** to **"Production / Live Mode"**.
   - Click **Save Gateway Configuration**.
   - *Or set them as environment variables (`VITE_CASHFREE_APP_ID`, `VITE_CASHFREE_SECRET_KEY`, `VITE_CASHFREE_ENV=production`) on Vercel/Netlify.*

---

## 🔑 Google Authentication Setup for Custom Domains

To use real Google Sign-In with your custom domain:
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services > Credentials**.
3. Create an **OAuth 2.0 Client ID** (Web application).
4. Under **Authorized JavaScript origins**, add:
   - `https://yourdomain.com` (and `https://your-app.vercel.app` for staging).
5. Copy the Client ID and add it as `VITE_GOOGLE_CLIENT_ID` in your environment variables.

---

## 🔒 Production Security Best Practices

1. **Change the Default Admin Passcode**:
   - Do not leave the default passcode `admin123`.
   - Set `VITE_ADMIN_PASSCODE="YourStrongPassword2026!"` in your hosting dashboard or change it in the Admin settings modal.
2. **HTTPS / SSL**:
   - Always run on HTTPS (Vercel, Netlify, and Cloudflare provide free SSL automatically).
   - Cashfree SDK requires HTTPS in production mode.
3. **Backup Templates**:
   - Export your custom templates regularly via the Admin template repository.

