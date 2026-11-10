# Galaxy Portfolio — Admin Backend

A small Node/Express API for the portfolio site:
- `POST /api/contact` — saves contact form submissions (name, email, message)
- `POST /api/visit` — counts one visit per page load
- `POST /api/admin/login` — returns a JWT for the admin
- `GET /api/admin/stats` — total messages, total/today visits, last-14-days chart data, recent messages
- `DELETE /api/admin/messages/:id` — deletes a submission
- `/admin` — the password-protected dashboard

Runs with **zero accounts locally** (SQLite via `node:sqlite`). In production it uses
a free Postgres database (Neon) so data survives restarts.

## Run locally

```bash
cd backend
npm install
copy .env.example .env    # set ADMIN_EMAIL + ADMIN_PASSWORD (and a JWT_SECRET)
npm start
```

Then open:
- API: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin (log in with the admin email/password you set)

## Deploy for free (Render + Neon)

1. **Database** — create a free account at https://neon.tech → create a project → copy the
   connection string (it looks like `postgresql://user:****@ep-something.region.aws.neon.tech/neondb?sslmode=require`).

2. **Backend** — create a free account at https://render.com → **New → Web Service**,
   connect this GitHub repo, and set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Environment variables** on Render (Environment → Environment Variables):
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | the Neon connection string |
   | `JWT_SECRET` | a long random string (e.g. from `openssl rand -hex 32`) |
   | `ADMIN_EMAIL` | the email you will log in with |
   | `ADMIN_PASSWORD` | a strong password for the admin login |
   | `CORS_ORIGIN` | `https://samislost2049.github.io` |

   Deploy. When it's live you get a URL like `https://portfolio-admin-api.onrender.com`.

4. **Point the portfolio at it** — in `script.js` (in the repo root) set the API URL:
   ```js
   const API_BASE = 'https://portfolio-admin-api.onrender.com';
   ```
   Update the version number in `index.html`:
   - `<link rel="stylesheet" href="styles.css?v=33">`
   - `<script src="script.js?v=33">`  → bump to `...v=34`
   Then commit and push — GitHub Pages rebuilds automatically.

5. **Admin dashboard** — go to `https://portfolio-admin-api.onrender.com/admin` and log in.
   You'll see totals, a 14-day visitor chart, and every form submission (with delete buttons).

> Free Render services sleep when idle — the first request after ~15 min wakes it up (~30–60 s).

## Free visitor analytics (optional, separate from the dashboard)

For a real visitor dashboard (page views, referrers, countries) sign up at
https://dash.cloudflare.com → **Analytics & Logs → Web Analytics** → create a new site and copy
its **site token**. Then in `index.html` uncomment the Cloudflare snippet and paste the token.

## Notes

- The contact form falls back to opening the visitor's email app if the API is unreachable,
  so the portfolio keeps working even while the backend is sleeping.
- Admins are seeded automatically from `ADMIN_EMAIL`/`ADMIN_PASSWORD` on first start.
- `POST /api/contact` is rate-limited (5/min/IP) and `POST /api/admin/login` (10/min/IP).