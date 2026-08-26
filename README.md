# Hyperlocal Disease Surveillance Platform

## Overview

This is a full‑stack Web application that lets public health officials and citizens in Karnataka, India, view and report disease incidence at a hyperlocal level. The back‑end, built with FastAPI + SQLAlchemy, exposes a REST API backed by a local SQLite database. The front‑end, created with Vite + React, consumes the API and renders dashboards, maps and alerts.

## Prerequisites

- **Node.js ≥ 18** (required for the front‑end)
- **Python ≥ 3.10**
- **pip** (Python package installer)
- **Git** (optional – for cloning the repo)

## Quick Start

> **Tip:** Run the backend **first**. The front‑end will make API calls to `http://127.0.0.1:8000` by default.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Hyperlocal_Disease_Surveillance_FullStack_moni.git
cd Hyperlocal_Disease_Surveillance_FullStack_moni
```

### 2. Start the Backend

```bash
# Create a Python virtual environment
python -m venv venv

# Seed the database (creates *surveillance.db* in this folder)
python -m app.seed

# Activate it
# Windows
.\venv\Scripts\Activate.ps1
# unix/macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI app
uvicorn app.main:app --reload
```

> The server will be available at `http://127.0.0.1:8000`.  
> The seed command populates demo agents, disease reports, predictions and notifications.

### 3. Start the Front‑end

Open a **new terminal** and run:

```bash
# Install JS dependencies
npm install

# Start the Vite dev server
npm run dev
```

> The front‑end will be available at `http://127.0.0.1:5173` by default.  
> It automatically proxies API requests to the backend running on port 8000.

### 4. Use the Application

- **Login**:  
  - Admin → `admin / admin123`
  - Citizen → `citizen / citizen123`
- Explore dashboards, maps, disease reports, etc.

### 5. Production Build (optional)

```bash
# In the front‑end folder
npm run build
```

This produces a static bundle under `dist/` that can be served by any static file host.

## Contribution Guide

Feel free to open issues or pull requests. We use standard Git flow:

1. Create a feature branch: `git checkout -b feature/your-branch`
2. Commit changes with meaningful messages.
3. Submit a PR.

## License

This project is licensed under the MIT License. See `LICENSE`.
