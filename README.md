# Hishab Tracker

A lightweight, installable web app to track advances collected from customers and the extra costs they fund — organized month by month, with an automatic balance calculation.

**Repo description (short):** Track monthly customer advances vs. page/business expenses, with per-month history, JSON backup, and an installable PWA-style interface.

## What it does

Hishab Tracker was built for a simple recurring workflow: a page/small business collects advances from customers, then uses that money to cover its own extra running costs. This app keeps that math honest and organized.

- **Advances** — log each customer's advance payment (name, optional details, amount)
- **Extra costs** — log every additional expense the business pays for
- **Automatic balance** — for the selected month, advances minus costs is calculated live:
  - If advances > costs → shown as **"Niloy Uncle Pabe"** (surplus owed back)
  - If costs > advances → shown as **"Ami Pabe"** (amount to be reimbursed)
  - If equal → **"হিসাব সমান"** (settled)
- **Monthly history** — every month's data is stored separately, so past months stay intact and can be revisited anytime via the month selector
- **Backup & restore** — one-click export of all months to a JSON file, and import to restore from a backup — important for long-term, worry-free use
- **Installable** — works as an "Add to Home Screen" app on phones, opening full-screen like a native app

## Tech

- Single-file HTML/CSS/vanilla JavaScript — no build step, no dependencies
- Fonts: Hind Siliguri (Bengali) + Inter (numerals), loaded from Google Fonts
- Data persistence:
  - Inside claude.ai artifacts: the built-in `window.storage` key-value API
  - Standalone deployment: browser storage, with manual JSON export/import as the backup layer

## Data model

- `months-list` — array of tracked months (`YYYY-MM`)
- `month:YYYY-MM` — that month's `{ advances: [...], costs: [...] }`

## Usage

1. Open the app (or add it to your home screen for app-like access)
2. Pick or create a month
3. Add advances as customers pay, and add extra costs as they come up
4. Check the balance card at any time to see who owes whom
5. Periodically tap **Backup** to download a JSON snapshot for safekeeping

## Credits

Developed by Tasin (Claude Code)
