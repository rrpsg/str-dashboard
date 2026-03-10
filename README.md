# STR Investment Dashboard

## How it works

```
GitHub Actions (runs daily at 6AM UTC)
  → scripts/fetch_data.py scrapes Zillow & Redfin
  → saves results to public/data.json
  → commits & pushes the file

Vercel (auto-deploys on every push)
  → serves the React dashboard
  → dashboard fetches /data.json on load
  → renders live listings + market data
```

No Google Cloud. No service accounts. No external APIs.
The repo IS the database.

---

## Setup (3 steps)

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/str-dashboard.git
git push -u origin main
```

### Step 2 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project → Import your GitHub repo
2. Framework: **Vite** (auto-detected)
3. Click **Deploy**
4. Done — you get a live URL like `str-dashboard.vercel.app`

Vercel auto-redeploys every time GitHub Actions commits new `data.json`.

### Step 3 — Trigger first data fetch

Go to your GitHub repo → **Actions** → **Fetch STR Listings** → **Run workflow**

This runs the scraper immediately and commits fresh listing data.
After that it runs automatically every day at 6AM UTC.

---

## File structure

```
├── .github/workflows/fetch-data.yml  ← daily scheduler (no secrets needed)
├── scripts/
│   ├── fetch_data.py                 ← Zillow/Redfin scraper
│   └── requirements.txt
├── public/
│   └── data.json                     ← THE DATABASE (auto-updated daily)
├── src/
│   ├── App.jsx                       ← React dashboard
│   └── main.jsx
├── index.html
└── package.json
```

## Viewing / editing data manually

`public/data.json` is just a JSON file in your repo.
You can edit it directly on GitHub (pencil icon) to:
- Manually add listings
- Update market stats
- Fix incorrect data from the scraper

Changes commit instantly and Vercel redeploys within ~30 seconds.

## Scraping notes

Zillow and Redfin block scrapers aggressively. If the scraper returns
0 listings, the seed data in `data.json` is preserved (the workflow
only commits if the file actually changed).

To manually add listings, just edit `public/data.json` on GitHub.
