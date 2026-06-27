# Project Tracker

A PMBOK 8-aligned enterprise project management application. Manage your projects across a full Portfolio → Program → Project hierarchy, with AI-assisted planning, earned value tracking, risk and stakeholder registers, and a public portfolio showcase.

---

## Features

- **PMBOK 8 Framework**: Life cycle phases (Initiating → Closing), 7 performance domains, 6 principles self-assessment
- **Hierarchy**: Portfolio → Program → Project grouping
- **Project Artifacts**: Charter, WBS, Risk Register, Stakeholder Register, Issue Log, Change Request Log, Lessons Learned, Notes
- **Earned Value Management**: PV, EV, AC → SPI, CPI, SV, CV, EAC, ETC, VAC with colour-coded indicators
- **AI Chat**: Multi-provider AI assistant (OpenAI, Claude, Gemini, OpenRouter, Ollama) with session history
- **Knowledge Base**: Upload PDFs and Word documents; AI searches them using RAG (pgvector)
- **AI Reports**: Generate status reports, risk reports, and more with one click; export to PDF
- **Analytics**: Cross-project charts, budget tracking, task completion trends
- **Public Portfolio**: Share your project history at `/portfolio/[username]`
- **Dark / Light Mode**: Fully themed, persists across sessions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Database | PostgreSQL + pgvector via Drizzle ORM |
| Auth + Storage | Supabase |
| UI | Tailwind CSS v4, shadcn/ui, Framer Motion |
| AI | Vercel AI SDK (multi-provider) |
| Email | Resend (optional) |

---

## Prerequisites

- **Node.js 20+**: [nodejs.org](https://nodejs.org)
- **A free Supabase account**: [supabase.com](https://supabase.com) (takes 2 minutes to set up)
- **At least one AI provider API key**: needed for the chat and report features

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/your-username/project-tracker.git
cd project-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

See **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** for a step-by-step guide. At minimum you need to:

- Create a Supabase project
- Enable the `pgvector` extension
- Create a storage bucket called `documents`
- Copy your project URL and API keys

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your Supabase credentials and at least one AI provider key. Every variable is documented inside the file.

### 5. Push the database schema

```bash
npm run db:push
```

This syncs the Drizzle schema to your Supabase database. Run this once on first setup.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up for an account and you're in.

---

## Database Scripts

| Script | What it does |
|---|---|
| `npm run db:push` | Sync schema to the database (use for first-time setup) |
| `npm run db:migrate` | Run pending migrations in order (use when pulling updates) |
| `npm run db:generate` | Generate a new migration file after schema changes |
| `npm run db:studio` | Open Drizzle Studio, a visual database browser |

---

## Optional Setup

### Google Sign-In

1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Set the authorised redirect URI to: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
3. In Supabase Dashboard → Authentication → Providers → Google: paste your Client ID and Secret

### Password Reset Emails

Requires a [Resend](https://resend.com) account and a verified sending domain. See **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md) → Step 4**.

### Bot Protection (Cloudflare Turnstile)

Recommended for public deployments. Leave `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` blank to disable it (default for local use).

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Turnstile → Add site
2. Copy the Site Key and Secret Key into `.env.local`

### Local AI (Ollama)

To use local models with no API cost:

1. Install [Ollama](https://ollama.com)
2. Pull a model: `ollama pull llama3`
3. In the app: Settings → AI Provider → select Ollama → set base URL to `http://localhost:11434`

---

## Deploying to Vercel

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import your repo
3. Add all environment variables from `.env.local` in the Vercel dashboard
4. Deploy

After deploying, update your Supabase project's **Site URL** and **Redirect URLs** to your Vercel domain (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) → Step 5).

---

## Contributing

Contributions are welcome. If you've self-hosted this and found something broken, have an idea that fits the PMBOK 8 direction, or want to improve the setup experience, open an issue or a pull request.

A few things that would be genuinely useful:
- Bug reports with clear reproduction steps
- Improvements to the self-hosting setup or documentation
- New PMBOK 8 features or better alignment with the standard
- UI/UX improvements

If you're planning something significant, open an issue first so we can discuss the approach before you invest the time building it.

---

## License

MIT. Do whatever you want with it.
