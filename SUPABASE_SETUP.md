# Supabase Setup Guide

This guide walks you through the one-time Supabase configuration needed to run Project Tracker.

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account)
2. Click **New project**
3. Choose a name, set a strong database password, and pick a region close to you
4. Wait ~2 minutes for the project to provision

---

## Step 2 — Copy Your API Keys

Go to **Project Settings → API** and copy:

| Key | Where to paste in `.env.local` |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` public key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` secret | `SUPABASE_SERVICE_KEY` |

Go to **Project Settings → Database → Connection string → URI** and copy it into `DATABASE_URL`. Replace `[YOUR-PASSWORD]` with the database password you set in Step 1.

---

## Step 3 — Enable pgvector (Required for Knowledge Base)

The Knowledge Base feature uses vector embeddings to search your documents. This requires the `pgvector` extension.

1. In your Supabase project, go to **Database → Extensions**
2. Search for `vector`
3. Toggle it **on**

If you skip this step, the Knowledge Base and document upload features will not work, but everything else will.

---

## Step 4 — Create the Documents Storage Bucket

Document uploads (PDFs, Word files) are stored in Supabase Storage.

1. Go to **Storage → New bucket**
2. Name it exactly: `documents`
3. Set it to **Private**
4. Click **Create bucket**

---

## Step 5 — Run the Database Schema

Back in your terminal:

```bash
npm run db:push
```

This creates all the tables, indexes, and relations in your Supabase database. You only need to run this once on first setup.

To verify it worked: go to **Supabase → Table Editor** — you should see tables like `profiles`, `projects`, `tasks`, `risks`, etc.

---

## Step 6 — Configure Auth Redirect URLs

Supabase needs to know which URLs are allowed for auth callbacks.

1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to your app URL:
   - Local dev: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/reset-callback`
   - *(If deploying)* `https://your-domain.com/auth/callback`
   - *(If deploying)* `https://your-domain.com/auth/reset-callback`

---

## Step 7 (Optional) — Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) → select or create a project
2. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Authorised redirect URI: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
5. Copy the **Client ID** and **Client Secret**
6. In Supabase: **Authentication → Providers → Google** → paste them in → Save

---

## Step 8 (Optional) — Password Reset Emails via Resend

By default, Supabase sends auth emails from its own domain. For branded emails from your own domain:

1. Sign up at [resend.com](https://resend.com) and verify your sending domain
2. Create an API key and paste it into `RESEND_API_KEY` in `.env.local`
3. In Supabase: **Project Settings → Authentication → SMTP Settings** → enable **Custom SMTP**

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | *(your Resend API key)* |
| Sender name | `Project Tracker` |
| Sender email | *(your verified domain email)* |

4. In Supabase: **Authentication → Email Templates → Reset Password** — customise the subject and body if you like. Make sure to keep `{{ .ConfirmationURL }}` in the body.

---

## Updating After Pulling New Code

When you pull an update that includes schema changes, run:

```bash
npm run db:migrate
```

This applies any new migrations in order without touching your existing data.
