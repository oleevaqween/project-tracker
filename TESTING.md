# Test Plan

Manual verification steps for every change made during the open-source release preparation.

---

## 1. Repository Cleanup

**What changed:** `IMPLEMENTATION_PLAN.md` and `docs/superpowers/` removed from git. `issues.md`, `qoutes.md`, and `pictures/` added to `.gitignore`.

**Test:**
```bash
git status
```
Expected:
- `IMPLEMENTATION_PLAN.md` shows as `deleted`
- `docs/superpowers/` files show as `deleted`
- `issues.md`, `qoutes.md` do NOT appear in git status (gitignored)
- `pictures/` does NOT appear in git status (gitignored)

```bash
git ls-files IMPLEMENTATION_PLAN.md docs/
```
Expected: no output (files no longer tracked).

---

## 2. Turnstile — Optional Bot Protection

**What changed:** Login and signup work without Cloudflare Turnstile keys configured.

### 2a. Without Turnstile keys (self-hosted default)

1. Ensure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are blank in `.env.local`
2. Run `npm run dev`
3. Go to `http://localhost:3000/login`

Expected:
- No Turnstile widget visible
- Sign in button is **immediately enabled** (not greyed out)
- Sign in with valid credentials → redirects to `/dashboard` successfully
- No "Verification failed" toast appears

4. Go to `http://localhost:3000/signup`

Expected:
- No Turnstile widget visible
- Create account button is **immediately enabled**
- Sign up with a new email → "Check your email to confirm your account" toast appears

### 2b. With Turnstile keys configured

1. Add real (or Cloudflare test) keys to `.env.local`:
   ```
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
   TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
   ```
2. Restart dev server (`npm run dev`)
3. Go to `/login`

Expected:
- Turnstile widget is visible
- Sign in button is **disabled** until the widget completes
- After widget completes → button enables → sign in works normally

---

## 3. Environment Variables (.env.local.example)

**What changed:** All variables documented with descriptions and where to find them.

**Test:**
```bash
diff .env.local.example .env.local
```
Expected: `.env.local` has real values where `.env.local.example` has placeholders. No variables exist in `.env.local.example` that are missing from `.env.local`.

Visual check — open `.env.local.example` and confirm:
- [ ] `DATABASE_URL` is present and described
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is present
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is present
- [ ] `SUPABASE_SERVICE_KEY` is present
- [ ] `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `OPENROUTER_API_KEY`, `COHERE_API_KEY` are present
- [ ] `RESEND_API_KEY` is present and marked optional
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are present and marked optional

---

## 4. Database Scripts

**What changed:** Four `db:*` scripts added to `package.json`.

### 4a. db:push

```bash
npm run db:push
```
Expected:
- Drizzle connects to your `DATABASE_URL`
- Prints a list of tables being created/updated
- Exits with code 0 (no errors)
- In Supabase Table Editor: tables `profiles`, `projects`, `tasks`, `risks`, `stakeholders`, `issues`, `change_requests`, `lessons_learned`, `wbs_elements`, `chat_sessions`, `chat_messages`, `document_chunks` all exist

### 4b. db:migrate

```bash
npm run db:migrate
```
Expected:
- Runs migrations from `drizzle/` in order
- If schema is already up to date, prints "No migrations to run" or similar
- Exits with code 0

### 4c. db:generate

Make a trivial schema change (e.g. add a comment), then:
```bash
npm run db:generate
```
Expected:
- A new `.sql` file appears in `drizzle/`
- Revert your schema change and delete the generated file

### 4d. db:studio

```bash
npm run db:studio
```
Expected:
- Prints a local URL (usually `https://local.drizzle.studio`)
- Opening it in a browser shows your database tables and data

---

## 5. README.md

**What changed:** Complete rewrite of the default Next.js README.

**Test (visual / content check):**
Open `README.md` and confirm:
- [ ] Project name and one-line description at top
- [ ] Features list covers: PMBOK 8, hierarchy, artifacts, EVM, AI chat, knowledge base, reports, analytics, public portfolio, dark mode
- [ ] Tech stack table is present
- [ ] Prerequisites section lists Node.js 20+ and Supabase
- [ ] Quick Start has exactly 6 numbered steps ending with `npm run dev`
- [ ] Database scripts table matches `package.json` scripts
- [ ] Optional setup covers: Google OAuth, password reset, Turnstile, Ollama
- [ ] Vercel deployment section present
- [ ] MIT license mentioned

Render check — paste contents into any Markdown previewer (VS Code preview, GitHub, etc.) and confirm it renders without broken formatting.

---

## 6. SUPABASE_SETUP.md

**What changed:** New detailed Supabase setup guide.

**Test (follow-through check — do this on a fresh Supabase project):**
- [ ] Step 1: Create project → project is provisioned
- [ ] Step 2: API keys → all three values copied into `.env.local` correctly
- [ ] Step 3: pgvector enabled → `npm run db:push` completes without vector extension errors
- [ ] Step 4: `documents` bucket created → document upload in the app works
- [ ] Step 5: `npm run db:push` → tables visible in Table Editor
- [ ] Step 6: Redirect URLs set → login/signup/OAuth redirects land on correct pages
- [ ] Step 7 (optional): Google OAuth → "Continue with Google" button completes sign-in
- [ ] Step 8 (optional): Resend SMTP → password reset email arrives from your domain

---

## 7. docker-compose.yml

**What changed:** New optional local Postgres + pgvector container.

**Test (requires Docker Desktop installed):**

```bash
docker compose up -d
```
Expected: container starts without errors.

```bash
docker compose ps
```
Expected: `postgres` service shows status `running`.

Update `.env.local`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/project_tracker
```

```bash
npm run db:push
```
Expected: schema pushed to local container successfully.

```bash
npm run dev
```
Expected: app starts and works normally using local database.

Cleanup:
```bash
docker compose down -v
```
Expected: container and volume removed cleanly.

---

## 8. Site Access Gate (Middleware)

**What changed:** `src/middleware.ts` and `src/app/api/unlock/route.ts` added. When `SITE_ACCESS_SECRET` is set, the entire site is locked behind a secret cookie.

### 8a. Gate disabled (self-hosted default)

1. Ensure `SITE_ACCESS_SECRET` is blank in `.env.local`
2. `npm run dev`
3. Visit `http://localhost:3000`

Expected: app loads normally, no gate, no cookie required.

### 8b. Gate enabled — blocked state

1. Set `SITE_ACCESS_SECRET=my-test-secret` in `.env.local`
2. Restart dev server
3. Open a private/incognito browser window (no existing cookie)
4. Visit `http://localhost:3000`

Expected:
- Sees a plain dark "Private — This site is not publicly accessible." page
- HTTP status 403
- The app never loads, no login page visible
- Any URL on the site returns the same 403 page

### 8c. Unlock — gaining access

Still in the incognito window:

5. Visit `http://localhost:3000/api/unlock?secret=my-test-secret`

Expected:
- Redirected to `/dashboard` (or `/login` if not signed in)
- A `site_access` cookie is now set (visible in DevTools → Application → Cookies)
- Navigating anywhere on the site works normally

6. Visit `http://localhost:3000/api/unlock?secret=wrong-secret`

Expected: `Invalid secret.` plain text response, no cookie set, no redirect.

### 8d. Wrong cookie value

7. In DevTools, manually edit the `site_access` cookie value to something else
8. Refresh the page

Expected: 403 "Private" page shown again.

### 8e. Revoking access

9. Visit `http://localhost:3000/api/unlock?secret=my-test-secret&revoke=1`

Expected:
- `site_access` cookie is cleared
- Redirected to `/dashboard` (but immediately blocked by middleware on next request)
- Refresh: 403 page appears again

### 8f. Secret rotation (revoking shared access)

10. Change `SITE_ACCESS_SECRET` to a new value and restart the server
11. Try visiting the site with the old cookie still set

Expected: 403 page — old cookie value no longer matches the new secret.

12. Visit `/api/unlock?secret=NEW_SECRET` — access restored with new cookie.

### 8g. Unlock endpoint is exempt from its own gate

13. With no valid cookie, visit `/api/unlock?secret=my-test-secret` directly

Expected: does NOT show the 403 page — the unlock endpoint is always reachable so the cookie can be set.

---

## 9. Full End-to-End Smoke Test

Run this after all changes to confirm nothing is broken.

1. `npm run dev` — server starts, no compilation errors in terminal
2. Visit `http://localhost:3000` — landing page loads
3. `/signup` — create a new account (no Turnstile widget if keys not set)
4. Check email → confirm account → redirected to `/onboarding`
5. Complete onboarding → land on `/dashboard`
6. Create a project → open it → all tabs load (Charter, WBS, Risks, Stakeholders, Issues, Change Requests, Lessons Learned, Notes, Measurement, Reports)
7. `/ai-chat` → send a message → AI responds (requires at least one AI provider key)
8. `/profile` → displays correctly → can save identity changes
9. `/forgot-password` → enter email → "Check your email" state shown
10. TopBar dropdown → Profile link → navigates to `/profile`
11. TopBar → Log out → redirected to `/login`
12. `npm run build` — clean build, zero TypeScript errors
