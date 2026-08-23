# Hyperlocal Disease Surveillance & Spread Prediction System

Full-stack implementation: React (Vite + Tailwind) frontend, FastAPI + SQLite backend,
dependency-free ML prediction, and a schematic spread-network map (no Google Maps API key required).

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed              # creates + seeds surveillance.db, prints login credentials
uvicorn app.main:app --reload --port 8000
```

Leave this running. API docs at http://localhost:8000/docs

### 2. Frontend

In a second terminal:

```bash
npm install                     # if you haven't already, or if node_modules looks broken
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

> **If `npm run dev` or `npm run build` fails with a "Cannot find native binding" /
> rolldown error:** this is an npm optional-dependency bug (npm/cli#4828), not a code
> issue. Fix with:
> ```bash
> rm -rf node_modules package-lock.json
> npm install
> ```

## Using the app

From the landing page:
- **"User Portal"** button (Hero section) -> citizen login -> demo user `citizen` / `citizen123`
- **Portal dropdown (top right)** -> **Admin Portal** -> `admin` / `admin123`
- **Portal dropdown (top right)** -> **Agent Portal** -> e.g. `agent_virajpet` / `agent123`
  (see the seed script output for all six seeded agent usernames -- one per taluk)

**Suggested demo flow** (matches the original design doc's presentation order):
1. Log in as an **Agent**, submit the weekly report for your taluk.
2. Log in as **Admin** -> Prediction Management -> **Run Predictions** (regenerates forecasts using the latest reports).
3. Log in as **Admin** -> explore Agent Management, Weekly Monitoring, Disease Reports, Notifications.
4. Log in as **User** -> pick Karnataka -> Kodagu/Mysuru -> any taluk -> view Dashboard, Spread Map, Advice, Notifications.

## What's implemented

- **User Portal**: location selector (State -> District -> Taluk), Dashboard (disease cards, pie chart,
  4-week trend bar chart, overall risk), Spread Map (schematic network view of the selected taluk +
  neighbours, color-coded by risk, click for prediction details), Precautionary Advice, Notifications feed.
- **Agent Portal**: weekly report form (per-disease cases/severity/remarks/preventive measures),
  one-submission-per-week enforcement, submission history table.
- **Admin Portal**: platform stats dashboard, Agent Management (add/edit/delete, taluk assignment),
  Weekly Monitoring (submitted vs pending), Disease Reports browser (filterable), Prediction Management
  (trigger the ML run, view latest predictions), Notifications (publish health camps / awareness
  campaigns / emergency alerts, statewide or taluk-targeted).
- **Backend**: JWT auth with role checks, SQLite via SQLAlchemy (swap to Postgres with one env var),
  a taluk adjacency graph, and a dependency-free linear-trend + neighbour-blended prediction model
  (see `backend/app/ml/predict.py`).

## Known simplifications (documented, not hidden -- good talking points for a viva)

- **Spread Map** uses a schematic network diagram (selected taluk + neighbours, color-coded, no
  external map tiles or API key) rather than real Google Maps tiles. The API (`/spread-map/{taluk_id}`)
  already returns everything keyed by taluk, so swapping in `react-leaflet` or the Google Maps JS SDK
  later just means feeding the same data into a real map component with lat/lng instead of angles.
- **ML model** is a lightweight linear-trend extrapolation blended with neighbouring-taluk case
  averages -- chosen deliberately so it never breaks a live demo on a missing-package issue, and so
  it's easy to explain in a viva. It's a natural place to later swap in a proper scikit-learn model
  (ARIMA, random forest, etc.) trained on more historical data.
- **Database** is SQLite by default for zero-setup local running; `DATABASE_URL` env var switches to
  Postgres (matching the original design doc) with no code changes.
