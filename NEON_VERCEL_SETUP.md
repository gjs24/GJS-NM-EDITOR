# ⚡ Vercel + Neon Serverless PostgreSQL Setup Guide

Deploy **GJS Railway Name Board Studio** entirely on **Vercel** with **Neon Serverless PostgreSQL**.

---

## 🌟 Why Vercel + Neon Is the Ultimate Combo

```mermaid
graph LR
    User["User / Admin Browser"] -->|Loads React UI & Canvas| VercelFrontend["Vercel Frontend (Vite + React)"]
    User -->|API Requests (/api/*)| VercelServerless["Vercel Serverless Functions"]
    VercelServerless -->|Tagged SQL / Connection Pooling| NeonPostgres[("Neon Serverless PostgreSQL (neon.tech)")]
    VercelServerless -->|Cashfree PG API| CashfreeGateway["Cashfree Payments"]
    CashfreeGateway -->|Webhook Confirmation| VercelServerless
```

- **Cost**: **₹0 / Month (100% Free)** on both Vercel and Neon.
- **No Separate Server**: Your frontend and serverless API live in the exact same Vercel deployment.
- **Instant Auto-Scaling**: Neon database automatically scales and suspends when idle (saving compute), waking up in under 500ms.
- **Zero Connection Limits**: Uses `@neondatabase/serverless` over HTTP/WebSockets, so thousands of users can connect simultaneously without database connection pool exhaustion.

---

## 🗄️ Step 1: Create Neon PostgreSQL Database (1 Minute)

1. Go to **[neon.tech](https://neon.tech)** and sign up / log in with your GitHub account.
2. Click **"Create a project"**:
   - **Project Name**: `gjs-railway-db`
   - **Postgres Version**: 16 (default)
   - **Region**: Select **Singapore (ap-southeast-1)** or **AWS Mumbai (ap-south-1)** for fastest speeds in India.
3. Click **"Create Project"**.
4. Neon will immediately show your **Connection Details**:
   - Select **"Connection string"** (Node.js / Pooled).
   - Click the **Copy** button. It looks like:
     ```text
     postgresql://neondb_owner:npg_xxxxxxxxx@ep-xyz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
5. Run the database schema:
   - On the left sidebar of the Neon Console, click **"SQL Editor"**.
   - Open [`neon_schema.sql`](./neon_schema.sql) in this repository, copy all of its contents, paste them into the SQL Editor, and click **"Run"** (or press Ctrl+Enter).
   - Neon will instantly create the tables:
     - `templates`
     - `user_purchases`
     - `user_saved_boards`
     - `cashfree_logs`
     - And seed the initial Amrit Bharat & GJS Productions LED templates.

---

## 🌐 Step 2: Deploy to Vercel (1 Minute)

1. Go to **[vercel.com](https://vercel.com)** and log in with GitHub.
2. Click **"Add New..."** > **"Project"**.
3. Import your GitHub repository: **`gjs24/GJS-NM-EDITOR`**.
4. Under **"Environment Variables"**, add the following:

| Key | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | *Paste your Neon PostgreSQL connection string from Step 1* | Connects Vercel Serverless Functions to Neon |
| `VITE_ADMIN_PASSCODE` | `admin123` *(or your custom admin password)* | Secret admin password |
| `CASHFREE_APP_ID` | `TEST_CF_APP_GJS_94821` | Cashfree App ID |
| `CASHFREE_SECRET_KEY` | `TEST_CF_SECRET_SECURED` | Cashfree Secret Key |
| `CASHFREE_ENV` | `sandbox` *(or `production`)* | Cashfree environment |

5. Click **"Deploy"**.
6. In ~30 seconds, Vercel will complete the build and your site will be live!

---

## 🧪 Step 3: Verify Your Deployment

1. Open your live Vercel URL (e.g. `https://gjs-nm-editor.vercel.app`).
2. Your templates will be retrieved directly from your **Neon PostgreSQL** database.
3. Log in as **Admin** (`admin123`), create or edit a template, and click **"Post Online (Public)"**.
4. Open **Neon Console > Tables**:
   - You will see the new template saved inside your Neon PostgreSQL `templates` table!
5. When a user buys a template via Cashfree:
   - The purchase is saved directly in the `user_purchases` table and synced across all their devices!
