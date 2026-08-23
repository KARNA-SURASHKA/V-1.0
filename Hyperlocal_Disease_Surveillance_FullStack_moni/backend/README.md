# Hyperlocal Disease Surveillance — Backend

FastAPI + SQLAlchemy + SQLite (swap to Postgres with one env var).

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Seed demo data (run once, or any time you want to reset)

```bash
python -m app.seed
```

This creates `surveillance.db` with:
- Karnataka > Kodagu (Virajpet, Madikeri, Somwarpet) & Mysuru (Mysuru, Hunsur, T Narasipura)
- A neighbour graph between taluks (used by the Spread Map + ML blending)
- 1 admin, 1 demo citizen login, 6 agents (one per taluk)
- 4 weeks of historical disease reports per taluk
- An initial prediction run, so the Spread Map has data immediately

Login credentials are printed at the end of the seed script.

## Run the API

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

## Switching to Postgres later

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/surveillance"
```

No code changes needed — `app/database.py` reads this env var.

## Notes on the ML model

`app/ml/predict.py` is deliberately dependency-free (no numpy/sklearn) so it
never breaks a demo on an environment issue. It fits a simple least-squares
linear trend to each taluk+disease's weekly history, blends in the current
case-average of neighbouring taluks (the "hyperlocal spread" signal), and
derives a confidence score from how much history exists and how noisy it is.
This is easy to explain in a viva and easy to swap for a real scikit-learn
model later — `predict_next_value()` is the only function you'd need to replace.
