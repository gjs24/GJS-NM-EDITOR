# GJS Railway Name Board Studio · Online Edition

An online, role-based web application for designing and customizing authentic Indian Railways name boards (Express coach side boards, station platform master boards, Rajdhani/LHB red boards, and SLR guard/luggage van boards).

---

## 🚀 Key Features

### 1. 👥 Role-Based Architecture
- **Admin Role (Passcode Protected — Default: `admin123`)**:
  - **Upload Custom Texture Sheets**: Upload any PNG/JPG texture map (e.g. 1024×1024 or 2048×2048 UV texture sheets like Amrit Bharat LED or GJS Productions).
  - **Freely Place Text Slots**: Click and drag slots anywhere on the texture map.
  - **Authentic LED Glow & Typography**: Configure amber/orange LED glowing fonts, dot-matrix styling, letter spacing, and size.
  - **Post Templates Online**: Click **"Post Online (Public)"** to immediately publish templates for users under any chosen name.

- **User Role (Content-Only & DDS Export Mode)**:
  - Select from the official admin-posted templates.
  - **Automatically Identifies All Text Fields**: The app scans the template and lists all text fields with numeric indicators.
  - **Users Only Re-Enter the Content**: The UV layout, background textures, and LED alignments remain completely locked and protected.
  - **Direct DDS Format Export (`.dds`)**: Download DirectDraw Surface textures (32-bit BGRA Universal or DXT5 Compressed) ready to drop into Trainz, Open Rails, or MSTS folders!
  - **PNG & Print Export**: Download transparent 1024×1024 PNG images or print directly.

---

## 🛠️ How to Run Locally

### Run in Browser (Online Web Dev Server)
```bash
npm run dev
```
Open **`http://localhost:5173`** in any web browser.

### Run Production Build
```bash
npm run build
npm run preview
```

### Run as Desktop App (Electron)
```bash
npm run build
npm run electron
```

## 🌐 How to Deploy Online (Production)

This project is 100% production-ready with pre-configured routing, security headers, Docker support, and Cashfree integration.

See the complete **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step guides on:
- **Vercel** *(Recommended — 2-minute free deploy with pre-configured [`vercel.json`](./vercel.json))*
- **Cloudflare Pages** *(Fastest Edge CDN in India with [`public/_redirects`](./public/_redirects))*
- **Netlify** *(1-click deploy with [`netlify.toml`](./netlify.toml))*
- **Linux VPS / Hostinger / DigitalOcean** *(Containerized with [`Dockerfile`](./Dockerfile) & [`docker-compose.yml`](./docker-compose.yml))*
- **Cashfree Live Production Activation & Merchant KYC**
- **Environment Variables Reference ([`.env.example`](./.env.example))**

---

## 🔐 Admin Authentication
- Click the **"Admin Login"** button on the top right.
- Enter passcode: `admin123`.
- Once authenticated, you enter the **Admin Template Studio**.
- After creating or tweaking a template, click **"Post Online (Public)"** to make it instantly available to users.
- Click **"Switch to User View"** at any time to verify the experience as a regular user.

